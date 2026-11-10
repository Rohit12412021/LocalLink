
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayloadUser } from '../common/types/jwt-payload';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  list(@CurrentUser() user: JwtPayloadUser) {
    if (!user) {
      throw new UnauthorizedException('Please sign in to continue');
    }
    return this.notificationsService.listForUser(user.userId);
  }

  @Get('unread-count')
  @HttpCode(HttpStatus.OK)
  unreadCount(@CurrentUser() user: JwtPayloadUser) {
    if (!user) {
      throw new UnauthorizedException('Please sign in to continue');
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
      throw new UnauthorizedException('Please sign in to continue');
    }
    return this.notificationsService.markRead(user.userId, id);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  markAllRead(@CurrentUser() user: JwtPayloadUser) {
    if (!user) {
      throw new UnauthorizedException('Please sign in to continue');
    }
    return this.notificationsService.markAllRead(user.userId);
  }
}
