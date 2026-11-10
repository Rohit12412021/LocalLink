import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayloadUser } from '../common/types/jwt-payload';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  list(@CurrentUser() user: JwtPayloadUser) {
    if (!user) {
      throw new Error('Unauthorized');
    }
    return this.notificationsService.listForUser(user.userId);
  }

  @Get('unread-count')
  @HttpCode(HttpStatus.OK)
  unreadCount(@CurrentUser() user: JwtPayloadUser) {
    if (!user) {
      throw new Error('Unauthorized');
    }
    return this.notificationsService.unreadCount(user.userId);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  markRead(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
  ) {
    if (!user) {
      throw new Error('Unauthorized');
    }
    return this.notificationsService.markRead(user.userId, id);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  markAllRead(@CurrentUser() user: JwtPayloadUser) {
    if (!user) {
      throw new Error('Unauthorized');
    }
    return this.notificationsService.markAllRead(user.userId);
  }
}