import {
  Body,
  Controller,
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
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('reviews')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: CreateReviewDto, @CurrentUser() user: JwtPayloadUser) {
    return this.reviewsService.create(body, user);
  }

  @Get('providers/:providerId/reviews')
  @HttpCode(HttpStatus.OK)
  list(@Param('providerId') providerId: string) {
    return this.reviewsService.listForProvider(providerId);
  }
}
