import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageEntity } from './entities/message.entity';
import { SocketGateway } from '../notifications/socket.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { RequestEntity } from '../requests/entities/request.entity';
import { ProviderEntity } from '../providers/entities/provider.entity';
import { UserEntity } from '../users/entities/user.entity';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(MessageEntity)
    private readonly messagesRepo: Repository<MessageEntity>,
    @InjectRepository(RequestEntity)
    private readonly requestsRepo: Repository<RequestEntity>,
    @InjectRepository(ProviderEntity)
    private readonly providersRepo: Repository<ProviderEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    private readonly socketGateway: SocketGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** Throws unless `userId` is the customer or the owning provider of the request. */
  private async assertParticipant(request: RequestEntity, userId?: string) {
    if (!userId) {
      throw new ForbiddenException('Not authenticated');
    }
    if (request.userId === userId) return;

    const provider = await this.providersRepo.findOne({
      where: { id: request.providerId ?? '' },
    });
    if (provider && provider.userId === userId) return;

    throw new ForbiddenException('You are not a participant of this request');
  }

  async getMessagesForRequest(requestId: string, userId?: string): Promise<any[]> {
    // Look up the actual request UUID from the display ID
    const request = await this.requestsRepo.findOne({ where: { displayId: requestId } });
    if (!request) {
      return [];
    }

    await this.assertParticipant(request, userId);

    const messages = await this.messagesRepo.find({
      where: { requestId: request.id }, // Use the actual UUID
      order: { createdAt: 'ASC' },
      relations: ['sender'] // Load sender information
    });

    // Bulk-update unread messages in one query instead of N+1
    if (userId) {
      const unreadIds = messages
        .filter(m => m.senderId !== userId && !m.isRead)
        .map(m => m.id);
      if (unreadIds.length > 0) {
        await this.messagesRepo
          .createQueryBuilder()
          .update()
          .set({ isRead: true })
          .where('id IN (:...ids)', { ids: unreadIds })
          .execute();
        // Reflect in the already-loaded objects
        messages.forEach(m => { if (unreadIds.includes(m.id)) m.isRead = true; });
      }
    }

    // Transform messages to include sender name
    return messages.map(msg => ({
      id: msg.id,
      requestId: msg.requestId,
      senderId: msg.senderId,
      content: msg.content,
      createdAt: msg.createdAt,
      isRead: msg.isRead,
      senderName: msg.sender?.name || 'Unknown'
    }));
  }

  async saveMessage(requestId: string, senderId: string, content: string): Promise<MessageEntity> {
    // Look up the actual request UUID from the display ID
    const request = await this.requestsRepo.findOne({ where: { displayId: requestId } });
    if (!request) {
      throw new NotFoundException('Request not found');
    }

    await this.assertParticipant(request, senderId);

    const message = this.messagesRepo.create({
      requestId: request.id, // Use the actual UUID, not display ID
      senderId,
      content,
      isRead: false, // New messages are unread by default
    });
    const saved = await this.messagesRepo.save(message);

    // Broadcast message to the specific request room (use display ID for room name)
    this.socketGateway.server.to(`request_${requestId}`).emit('chat_message', saved);

    // Notify the other party (in-app + email)
    await this.sendChatNotification(request, senderId, content);

    return saved;
  }

  async getUnreadCount(userId: string): Promise<number> {
    // Get all requests where the user is involved
    const provider = await this.providersRepo.findOne({ where: { userId } });
    const userRequests = await this.requestsRepo.find({
      where: provider
        ? [{ userId }, { providerId: provider.id }]
        : [{ userId }],
    });

    if (userRequests.length === 0) return 0;

    const requestIds = userRequests.map(r => r.id);

    // Count unread messages where sender is not the user
    const unreadCount = await this.messagesRepo
      .createQueryBuilder('message')
      .where('message.requestId IN (:...requestIds)', { requestIds })
      .andWhere('message.senderId != :userId', { userId })
      .andWhere('message.isRead = :isRead', { isRead: false })
      .getCount();

    return unreadCount;
  }

  async getUnreadCountForRequest(requestId: string, userId: string): Promise<number> {
    const request = await this.requestsRepo.findOne({ where: { displayId: requestId } });
    if (!request) return 0;

    await this.assertParticipant(request, userId);

    return this.messagesRepo
      .createQueryBuilder('message')
      .where('message.requestId = :requestId', { requestId: request.id })
      .andWhere('message.senderId != :userId', { userId })
      .andWhere('message.isRead = :isRead', { isRead: false })
      .getCount();
  }

  private async sendChatNotification(request: RequestEntity, senderId: string, content: string) {
    try {
      if (!request.userId || !request.providerId) return;

      const sender = await this.usersRepo.findOne({ where: { id: senderId } });
      const provider = await this.providersRepo.findOne({
        where: { id: request.providerId },
        relations: ['user']
      });
      const customer = await this.usersRepo.findOne({ where: { id: request.userId } });

      if (!sender) return;

      const preview = content.length > 90 ? `${content.slice(0, 90)}…` : content;

      // If sender is customer, notify provider
      if (senderId === request.userId && provider?.user) {
        await this.notificationsService.createNotification({
          userId: provider.user.id,
          type: 'chat',
          title: `New message — ${request.displayId}`,
          body: `${sender.name}: ${preview}`,
          requestId: request.id,
          link: `/chat/${request.displayId}`,
        });
        if (provider.user.email) {
          await this.notificationsService.sendNewMessageNotification(
            provider.user.email,
            provider.name,
            request.displayId,
            sender.name
          );
        }
      }
      // If sender is provider, notify customer
      else if (provider && senderId === provider.userId && customer) {
        await this.notificationsService.createNotification({
          userId: customer.id,
          type: 'chat',
          title: `New message — ${request.displayId}`,
          body: `${provider.name}: ${preview}`,
          requestId: request.id,
          link: `/chat/${request.displayId}`,
        });
        if (customer.email) {
          await this.notificationsService.sendNewMessageNotification(
            customer.email,
            customer.name,
            request.displayId,
            provider.name
          );
        }
      }
    } catch (error) {
      this.logger.error('[Chat Notification Error]', error);
    }
  }

  async markAsRead(requestId: string, userId: string) {
    const request = await this.requestsRepo.findOne({ where: { displayId: requestId } });
    if (!request) return;

    await this.assertParticipant(request, userId);

    // Bulk-update in one query
    const unreadMessages = await this.messagesRepo
      .createQueryBuilder('message')
      .where('message.requestId = :requestId', { requestId: request.id })
      .andWhere('message.senderId != :userId', { userId })
      .andWhere('message.isRead = :isRead', { isRead: false })
      .getMany();

    if (unreadMessages.length > 0) {
      await this.messagesRepo
        .createQueryBuilder()
        .update()
        .set({ isRead: true })
        .where('id IN (:...ids)', { ids: unreadMessages.map(m => m.id) })
        .execute();
    }

    return { marked: unreadMessages.length };
  }
}
