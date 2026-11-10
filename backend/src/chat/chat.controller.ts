import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayloadUser } from '../common/types/jwt-payload';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('unread/count')
  async getUnreadCount(@CurrentUser() user: JwtPayloadUser) {
    return { count: await this.chatService.getUnreadCount(user.userId) };
  }

  @Get(':requestId')
  async getMessages(@Param('requestId') requestId: string, @CurrentUser() user: JwtPayloadUser) {
    return this.chatService.getMessagesForRequest(requestId, user.userId);
  }

  @Post(':requestId/mark-read')
  async markAsRead(@Param('requestId') requestId: string, @CurrentUser() user: JwtPayloadUser) {
    return this.chatService.markAsRead(requestId, user.userId);
  }

  @Get(':requestId/unread/count')
  async getUnreadCountForRequest(@Param('requestId') requestId: string, @CurrentUser() user: JwtPayloadUser) {
    return { count: await this.chatService.getUnreadCountForRequest(requestId, user.userId) };
  }

  @Post(':requestId')
  async sendMessage(
    @Param('requestId') requestId: string,
    @Body('content') content: string,
    @CurrentUser() user: JwtPayloadUser,
  ) {
    // Both providers and customers can send messages
    return this.chatService.saveMessage(requestId, user.userId, content);
  }
}
