import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayloadUser } from '../common/types/jwt-payload';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import {
  CreateServiceDto,
  UpdateProviderProfileDto,
  UpdateServiceDto,
} from './dto/provider.dto';
import { ProvidersService } from './providers.service';

@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  getAllProviders(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('sort') sort?: string,
  ) {
    return this.providersService.getAllProviders({
      lat: lat !== undefined ? Number(lat) : undefined,
      lng: lng !== undefined ? Number(lng) : undefined,
      q,
      category,
      sort,
    });
  }

  @Get('me/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Provider)
  @HttpCode(HttpStatus.OK)
  getMyProfile(@CurrentUser() user: JwtPayloadUser) {
    return this.providersService.getMyProfile(user.userId);
  }

  @Patch('me/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Provider)
  @HttpCode(HttpStatus.OK)
  updateMyProfile(
    @CurrentUser() user: JwtPayloadUser,
    @Body() body: UpdateProviderProfileDto,
  ) {
    return this.providersService.updateMyProfile(user.userId, body);
  }

  @Post('me/services')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Provider)
  @HttpCode(HttpStatus.CREATED)
  createService(
    @CurrentUser() user: JwtPayloadUser,
    @Body() body: CreateServiceDto,
  ) {
    return this.providersService.createService(user.userId, body);
  }

  @Patch('me/services/:serviceId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Provider)
  @HttpCode(HttpStatus.OK)
  updateService(
    @CurrentUser() user: JwtPayloadUser,
    @Param('serviceId') serviceId: string,
    @Body() body: UpdateServiceDto,
  ) {
    return this.providersService.updateService(user.userId, serviceId, body);
  }

  @Delete('me/services/:serviceId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Provider)
  @HttpCode(HttpStatus.OK)
  deleteService(
    @CurrentUser() user: JwtPayloadUser,
    @Param('serviceId') serviceId: string,
  ) {
    return this.providersService.deleteService(user.userId, serviceId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  getProviderById(@Param('id') id: string) {
    return this.providersService.getProviderById(id);
  }
}
