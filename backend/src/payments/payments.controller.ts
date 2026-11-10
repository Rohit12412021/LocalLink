import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayloadUser } from '../common/types/jwt-payload';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePaymentOrderDto, VerifyPaymentDto } from './dto/payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('config')
  @HttpCode(HttpStatus.OK)
  config() {
    return this.paymentsService.getPublicKey();
  }

  @Post('orders')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  createOrder(
    @Body() body: CreatePaymentOrderDto,
    @CurrentUser() user: JwtPayloadUser,
  ) {
    return this.paymentsService.createOrder(body, user);
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  verify(
    @Body() body: VerifyPaymentDto,
    @CurrentUser() user: JwtPayloadUser,
  ) {
    return this.paymentsService.verifyPayment(body, user);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature?: string,
  ) {
    const raw =
      (req.rawBody as Buffer | undefined) ||
      Buffer.from(JSON.stringify(req.body || {}));
    return this.paymentsService.handleWebhook(raw, signature);
  }
}
