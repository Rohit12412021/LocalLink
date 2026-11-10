import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RequestStatus } from '../common/enums/request-status.enum';
import type { JwtPayloadUser } from '../common/types/jwt-payload';
import { ProviderEntity } from '../providers/entities/provider.entity';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestStatusDto, RescheduleRequestDto } from './dto/update-request.dto';
import { RequestEntity } from './entities/request.entity';
import { UserEntity } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { SocketGateway } from '../notifications/socket.gateway';

export type ServiceRequestDto = {
  id: string;
  requestId: string;
  providerId: string;
  providerName: string;
  category: string;
  service: string;
  description: string;
  date: string;
  time: string;
  location: string;
  phone: string;
  price: string;
  status: RequestStatus;
  userId?: string;
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(RequestEntity)
    private readonly requestsRepo: Repository<RequestEntity>,
    @InjectRepository(ProviderEntity)
    private readonly providersRepo: Repository<ProviderEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    private readonly notificationsService: NotificationsService,
    private readonly socketGateway: SocketGateway,
  ) { }

  private toDto(entity: RequestEntity): ServiceRequestDto {
    return {
      id: entity.displayId,
      requestId: entity.id,
      providerId: entity.providerId || '',
      providerName: entity.providerName,
      category: entity.category,
      service: entity.service,
      description: entity.description,
      date: entity.date,
      time: entity.time,
      location: entity.location,
      phone: entity.phone,
      price: entity.price,
      status: entity.status,
      userId: entity.userId || undefined,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  private async nextDisplayId(): Promise<string> {
    const rows: Array<{ displayId: string }> =
      await this.requestsRepo
        .createQueryBuilder('r')
        .select('r.displayId', 'displayId')
        .where('r.displayId LIKE :prefix', { prefix: 'REQ-%' })
        .getRawMany();

    let max = 0;
    for (const row of rows) {
      const n = parseInt(String(row.displayId).split('-')[1], 10);
      if (!Number.isNaN(n) && n > max) max = n;
    }

    return `REQ-${String(max + 1).padStart(3, '0')}`;
  }

  async getUserRelatedRequests(userId: string): Promise<ServiceRequestDto[]> {
    const provider = await this.providersRepo.findOne({ where: { userId } });
    const where = provider
      ? [
          { userId },
          { providerId: provider.id },
        ]
      : [{ userId }];

    const rows = await this.requestsRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => this.toDto(r));
  }

  async getMine(userId: string): Promise<ServiceRequestDto[]> {
    const rows = await this.requestsRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => this.toDto(r));
  }

  async getInbox(userId: string): Promise<ServiceRequestDto[]> {
    const provider = await this.providersRepo.findOne({ where: { userId } });
    if (!provider) {
      throw new ForbiddenException('No provider profile linked to this account');
    }
    const rows = await this.requestsRepo.find({
      where: { providerId: provider.id },
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => this.toDto(r));
  }

  async getRequestById(id: string, user: JwtPayloadUser): Promise<ServiceRequestDto> {
    const entity = await this.findByPublicId(id);

    const isCustomer = entity.userId === user.userId;
    let isProvider = false;

    if (!isCustomer) {
      const provider = await this.providersRepo.findOne({ where: { userId: user.userId } });
      isProvider = provider ? provider.id === entity.providerId : false;
    }

    if (!isCustomer && !isProvider) {
      throw new ForbiddenException('You do not have permission to view this booking');
    }

    return this.toDto(entity);
  }

  async getRequestsByProvider(
    providerId: string,
    user: JwtPayloadUser,
  ): Promise<ServiceRequestDto[]> {
    const provider = await this.providersRepo.findOne({ where: { userId: user.userId } });
    if (!provider || provider.id !== providerId) {
      throw new ForbiddenException('You can only view your own provider bookings');
    }
    const rows = await this.requestsRepo.find({
      where: { providerId },
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => this.toDto(r));
  }

  async getRequestsByUser(
    userId: string,
    user: JwtPayloadUser,
  ): Promise<ServiceRequestDto[]> {
    if (userId !== user.userId) {
      throw new ForbiddenException('You can only view your own requests');
    }
    return this.getMine(userId);
  }

  async createRequest(
    dto: CreateRequestDto,
    user: JwtPayloadUser,
  ): Promise<ServiceRequestDto> {
    const provider = await this.providersRepo.findOne({
      where: { id: dto.providerId },
      relations: ['user'],
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    const entity = this.requestsRepo.create({
      displayId: await this.nextDisplayId(),
      userId: user.userId,
      providerId: provider.id,
      providerName: provider.name,
      category: dto.category,
      service: dto.service,
      description: dto.description.trim(),
      date: dto.date,
      time: dto.time,
      location: dto.location.trim(),
      phone: dto.phone.trim(),
      price: dto.price,
      status: RequestStatus.Pending,
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
    });

    const saved = await this.requestsRepo.save(entity);

    const customer = await this.usersRepo.findOne({
      where: { id: user.userId },
    });

    // Notify provider in real-time
    if (saved.providerId) {
      this.socketGateway.notifyProviderRequestUpdate(saved.providerId, saved.displayId, saved.status);
    }

    // Persist an in-app notification + email for the provider
    if (provider.user) {
      await this.notificationsService.createNotification({
        userId: provider.user.id,
        type: 'new_request',
        title: `New service request ${saved.displayId}`,
        body: `${customer?.name ?? 'A customer'} requested "${saved.service}" for ${saved.date} at ${saved.time}.`,
        requestId: saved.id,
        link: `/provider-requests`,
      });
    }

    if (provider.user?.email) {
      await this.notificationsService.sendNewServiceRequestToProvider(
        provider.user.email,
        provider.name,
        saved.displayId,
        saved.service,
        customer?.name ?? 'Customer',
      );
    }

    return this.toDto(saved);
  }

  async updateRequestStatus(
    id: string,
    dto: UpdateRequestStatusDto,
    user: JwtPayloadUser,
  ): Promise<ServiceRequestDto> {
    const entity = await this.findByPublicId(id);
    const provider = await this.providersRepo.findOne({
      where: { userId: user.userId },
      relations: ['user'],
    });

    // Allow users to cancel their own pending requests
    if (dto.status === RequestStatus.Cancelled && entity.userId === user.userId && entity.status === RequestStatus.Pending) {
      entity.status = dto.status;
      const saved = await this.requestsRepo.save(entity);

      if (saved.providerId) {
        this.socketGateway.notifyProviderRequestUpdate(saved.providerId, saved.displayId, saved.status);

        const providerForRequest = await this.providersRepo.findOne({
          where: { id: saved.providerId },
          relations: ['user'],
        });
        if (providerForRequest?.user) {
          await this.notificationsService.createNotification({
            userId: providerForRequest.user.id,
            type: 'cancelled',
            title: `Request ${saved.displayId} was cancelled`,
            body: 'The customer cancelled this pending request.',
            requestId: saved.id,
            link: `/provider-requests`,
          });
        }
      }

      return this.toDto(saved);
    }

    // Providers can update status (accept/reject/complete)
    if (!provider || entity.providerId !== provider.id) {
      throw new ForbiddenException('You can only update your own bookings');
    }

    entity.status = dto.status;
    const saved = await this.requestsRepo.save(entity);

    if (saved.userId) {
      const customer = await this.usersRepo.findOne({ where: { id: saved.userId } });
      if (customer) {
        const titleMap: Record<string, string> = {
          [RequestStatus.Accepted]: 'Request accepted',
          [RequestStatus.Rejected]: 'Request rejected',
          [RequestStatus.Completed]: 'Service completed',
        };
        await this.notificationsService.createNotification({
          userId: customer.id,
          type: dto.status,
          title: `${titleMap[dto.status] ?? 'Booking updated'} — ${saved.displayId}`,
          body: `${provider.name} updated your request "${saved.service}".`,
          requestId: saved.id,
          link: `/dashboard`,
        });

        if (dto.status === RequestStatus.Accepted || dto.status === RequestStatus.Rejected) {
          await this.notificationsService.sendProviderResponseToUser(
            customer.email,
            customer.name,
            saved.displayId,
            dto.status,
            provider.name,
          );
        } else if (dto.status === RequestStatus.Completed) {
          await this.notificationsService.sendServiceCompletedToUser(
            customer.email,
            customer.name,
            saved.displayId,
            provider.name,
          );
        } else {
          await this.notificationsService.sendBookingStatusUpdate(customer.email, saved.displayId, saved.status);
        }
      }
    }

    // Notify customer in real-time
    if (saved.userId) {
      this.socketGateway.notifyCustomerRequestUpdate(saved.userId, saved.displayId, saved.status);
    }

    return this.toDto(saved);
  }

  async deleteRequest(
    id: string,
    user: JwtPayloadUser,
  ): Promise<{ message: string; id: string }> {
    const entity = await this.findByPublicId(id);

    const isOwner = entity.userId === user.userId;
    const provider = await this.providersRepo.findOne({
      where: { userId: user.userId },
    });
    const isProviderOwner = provider ? provider.id === entity.providerId : false;

    if (!isOwner && !isProviderOwner) {
      throw new ForbiddenException('You can only delete your own requests');
    }

    await this.requestsRepo.remove(entity);
    return { message: 'Request deleted successfully', id };
  }

  async rescheduleRequest(
    id: string,
    dto: RescheduleRequestDto,
    user: JwtPayloadUser,
  ): Promise<ServiceRequestDto> {
    const entity = await this.findByPublicId(id);

    // Only the user who created the request can reschedule
    if (entity.userId !== user.userId) {
      throw new ForbiddenException('You can only reschedule your own requests');
    }

    // Can only reschedule pending or accepted requests
    if (entity.status !== RequestStatus.Pending && entity.status !== RequestStatus.Accepted) {
      throw new ForbiddenException('Can only reschedule pending or accepted requests');
    }

    entity.date = dto.date;
    entity.time = dto.time;
    const saved = await this.requestsRepo.save(entity);

    // Notify provider about reschedule
    if (saved.providerId) {
      const provider = await this.providersRepo.findOne({
        where: { id: saved.providerId },
        relations: ['user'],
      });
      if (provider?.user) {
        await this.notificationsService.createNotification({
          userId: provider.user.id,
          type: 'rescheduled',
          title: `Request ${saved.displayId} rescheduled`,
          body: `The customer moved this request to ${saved.date} at ${saved.time}.`,
          requestId: saved.id,
          link: `/provider-requests`,
        });
      }
      this.socketGateway.notifyProviderRequestUpdate(saved.providerId, saved.displayId, 'Rescheduled');
    }

    return this.toDto(saved);
  }

  private async findByPublicId(id: string): Promise<RequestEntity> {
    const entity =
      (await this.requestsRepo.findOne({ where: { displayId: id } })) ||
      (await this.requestsRepo.findOne({ where: { id } }));

    if (!entity) {
      throw new NotFoundException(`Request with id "${id}" was not found`);
    }
    return entity;
  }
}