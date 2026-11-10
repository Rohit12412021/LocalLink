import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreatePaymentOrderDto {
  @IsString()
  @MaxLength(40)
  requestId: string;

  /** Optional override in paise; otherwise parsed from booking price */
  @IsOptional()
  @IsInt()
  @Min(100)
  amountPaise?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  idempotencyKey?: string;
}

export class VerifyPaymentDto {
  @IsString()
  razorpayOrderId: string;

  @IsString()
  razorpayPaymentId: string;

  @IsString()
  razorpaySignature: string;
}
