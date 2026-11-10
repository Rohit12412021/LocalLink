import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import { Repository } from 'typeorm';

import { PaymentStatus } from '../common/enums/payment-status.enum';
import type { JwtPayloadUser } from '../common/types/jwt-payload';
import { RequestEntity } from '../requests/entities/request.entity';
import { CreatePaymentOrderDto, VerifyPaymentDto } from './dto/payment.dto';
import { PaymentEntity } from './entities/payment.entity';

type RazorpayLike = {
  orders: {
    create: (opts: {
      amount: number;
      currency: string;
      receipt: string;
      notes?: Record<string, string>;
    }) => Promise<{ id: string; amount: number; currency: string }>;
  };
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private razorpay: RazorpayLike | null = null;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(PaymentEntity)
    private readonly paymentsRepo: Repository<PaymentEntity>,
    @InjectRepository(RequestEntity)
    private readonly requestsRepo: Repository<RequestEntity>,
  ) {
    const keyId = this.config.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET');
    if (keyId && keySecret) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Razorpay = require('razorpay');
      this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      this.logger.log('Razorpay client configured');
    } else {
      this.logger.warn('Razorpay keys missing — payment create returns mock orders');
    }
  }

  private parseAmountPaise(price: string, override?: number): number {
    if (override && override >= 100) return override;
    const digits = price.replace(/[^\d]/g, '');
    const rupees = Number(digits || '0');
    if (!rupees) {
      throw new BadRequestException('Could not parse booking price for payment');
    }
    return rupees * 100;
  }

  private async findRequest(publicId: string): Promise<RequestEntity> {
    const entity =
      (await this.requestsRepo.findOne({ where: { displayId: publicId } })) ||
      (await this.requestsRepo.findOne({ where: { id: publicId } }));
    if (!entity) throw new NotFoundException('Booking not found');
    return entity;
  }

  async createOrder(dto: CreatePaymentOrderDto, user: JwtPayloadUser) {
    const request = await this.findRequest(dto.requestId);
    if (request.userId !== user.userId) {
      throw new ForbiddenException('You can only pay for your own bookings');
    }

    if (dto.idempotencyKey) {
      const existing = await this.paymentsRepo.findOne({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existing) {
        return this.toOrderResponse(existing);
      }
    }

    const amountPaise = this.parseAmountPaise(request.price, dto.amountPaise);
    let orderId: string;

    if (this.razorpay) {
      const order = await this.razorpay.orders.create({
        amount: amountPaise,
        currency: 'INR',
        receipt: request.displayId,
        notes: { requestId: request.displayId, userId: user.userId },
      });
      orderId = order.id;
    } else {
      orderId = `order_mock_${crypto.randomBytes(8).toString('hex')}`;
    }

    const payment = this.paymentsRepo.create({
      requestId: request.id,
      userId: user.userId,
      amountPaise,
      currency: 'INR',
      status: PaymentStatus.Pending,
      razorpayOrderId: orderId,
      idempotencyKey: dto.idempotencyKey || null,
      metadata: { displayId: request.displayId },
    });
    const saved = await this.paymentsRepo.save(payment);

    request.paymentStatus = PaymentStatus.Pending;
    request.amountPaise = amountPaise;
    await this.requestsRepo.save(request);

    return this.toOrderResponse(saved);
  }

  async verifyPayment(dto: VerifyPaymentDto, user: JwtPayloadUser) {
    const payment = await this.paymentsRepo.findOne({
      where: { razorpayOrderId: dto.razorpayOrderId },
    });
    if (!payment) throw new NotFoundException('Payment order not found');
    if (payment.userId !== user.userId) {
      throw new ForbiddenException('Not your payment');
    }

    const secret = this.config.get<string>('RAZORPAY_KEY_SECRET');
    if (secret && !dto.razorpayOrderId.startsWith('order_mock_')) {
      const body = `${dto.razorpayOrderId}|${dto.razorpayPaymentId}`;
      const expected = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');
      if (expected !== dto.razorpaySignature) {
        payment.status = PaymentStatus.Failed;
        await this.paymentsRepo.save(payment);
        throw new BadRequestException('Invalid payment signature');
      }
    }

    payment.status = PaymentStatus.Paid;
    payment.razorpayPaymentId = dto.razorpayPaymentId;
    payment.razorpaySignature = dto.razorpaySignature;
    await this.paymentsRepo.save(payment);

    const request = await this.requestsRepo.findOne({
      where: { id: payment.requestId },
    });
    if (request) {
      request.paymentStatus = PaymentStatus.Paid;
      await this.requestsRepo.save(request);
    }

    return { status: PaymentStatus.Paid, paymentId: payment.id };
  }

  /** Razorpay webhook — verifies signature and marks paid (idempotent). */
  async handleWebhook(rawBody: Buffer, signature: string | undefined) {
    const secret = this.config.get<string>('RAZORPAY_WEBHOOK_SECRET');
    if (!secret) {
      throw new ServiceUnavailableException('Webhook secret not configured');
    }
    if (!signature) {
      throw new BadRequestException('Missing X-Razorpay-Signature');
    }

    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');
    if (expected !== signature) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const payload = JSON.parse(rawBody.toString('utf8')) as {
      event?: string;
      payload?: {
        payment?: {
          entity?: {
            id?: string;
            order_id?: string;
            status?: string;
          };
        };
      };
    };

    const entity = payload.payload?.payment?.entity;
    if (!entity?.order_id) {
      return { ok: true, ignored: true };
    }

    const payment = await this.paymentsRepo.findOne({
      where: { razorpayOrderId: entity.order_id },
    });
    if (!payment) {
      return { ok: true, ignored: true };
    }

    if (payment.status === PaymentStatus.Paid) {
      return { ok: true, idempotent: true };
    }

    if (entity.status === 'captured' || entity.status === 'authorized') {
      payment.status = PaymentStatus.Paid;
      payment.razorpayPaymentId = entity.id || payment.razorpayPaymentId;
      await this.paymentsRepo.save(payment);

      const request = await this.requestsRepo.findOne({
        where: { id: payment.requestId },
      });
      if (request) {
        request.paymentStatus = PaymentStatus.Paid;
        await this.requestsRepo.save(request);
      }
    }

    return { ok: true };
  }

  getPublicKey() {
    return {
      keyId: this.config.get<string>('RAZORPAY_KEY_ID') || null,
      mockMode: !this.razorpay,
    };
  }

  private toOrderResponse(payment: PaymentEntity) {
    return {
      paymentId: payment.id,
      orderId: payment.razorpayOrderId,
      amountPaise: payment.amountPaise,
      currency: payment.currency,
      status: payment.status,
      keyId: this.config.get<string>('RAZORPAY_KEY_ID') || 'rzp_test_mock',
      mockMode: !this.razorpay,
    };
  }
}
