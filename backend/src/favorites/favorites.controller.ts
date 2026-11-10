import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayloadUser } from '../common/types/jwt-payload';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FavoritesService } from './favorites.service';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  list(@CurrentUser() user: JwtPayloadUser) {
    return this.favoritesService.list(user.userId);
  }

  @Get('status/:providerId')
  @HttpCode(HttpStatus.OK)
  status(
    @CurrentUser() user: JwtPayloadUser,
    @Param('providerId') providerId: string,
  ) {
    return this.favoritesService.isFavorite(user.userId, providerId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  add(
    @CurrentUser() user: JwtPayloadUser,
    @Body() body: { providerId: string },
  ) {
    return this.favoritesService.add(user.userId, body.providerId);
  }

  @Delete(':providerId')
  @HttpCode(HttpStatus.OK)
  remove(
    @CurrentUser() user: JwtPayloadUser,
    @Param('providerId') providerId: string,
  ) {
    return this.favoritesService.remove(user.userId, providerId);
  }
}