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
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayloadUser } from '../common/types/jwt-payload';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestStatusDto, RescheduleRequestDto } from './dto/update-request.dto';
import { RequestsService } from './requests.service';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  createRequest(
    @Body() body: CreateRequestDto,
    @CurrentUser() user: JwtPayloadUser,
  ) {
    return this.requestsService.createRequest(body, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  getAll(@CurrentUser() user: JwtPayloadUser) {
    return this.requestsService.getUserRelatedRequests(user.userId);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  getMine(@CurrentUser() user: JwtPayloadUser) {
    return this.requestsService.getMine(user.userId);
  }

  @Get('inbox')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Provider)
  @HttpCode(HttpStatus.OK)
  getInbox(@CurrentUser() user: JwtPayloadUser) {
    return this.requestsService.getInbox(user.userId);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  getRequestsByUser(
    @Param('userId') userId: string,
    @CurrentUser() user: JwtPayloadUser,
  ) {
    return this.requestsService.getRequestsByUser(userId, user);
  }

  @Get('provider/:providerId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  getRequestsByProvider(
    @Param('providerId') providerId: string,
    @CurrentUser() user: JwtPayloadUser,
  ) {
    return this.requestsService.getRequestsByProvider(providerId, user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  getRequestById(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayloadUser,
  ) {
    return this.requestsService.getRequestById(id, user);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  updateRequestStatus(
    @Param('id') id: string,
    @Body() body: UpdateRequestStatusDto,
    @CurrentUser() user: JwtPayloadUser,
  ) {
    return this.requestsService.updateRequestStatus(id, body, user);
  }

  @Patch(':id/reschedule')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  rescheduleRequest(
    @Param('id') id: string,
    @Body() body: RescheduleRequestDto,
    @CurrentUser() user: JwtPayloadUser,
  ) {
    return this.requestsService.rescheduleRequest(id, body, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  deleteRequest(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayloadUser,
  ) {
    return this.requestsService.deleteRequest(id, user);
  }
}