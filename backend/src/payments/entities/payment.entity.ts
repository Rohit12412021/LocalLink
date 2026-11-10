import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { RequestEntity } from '../../requests/entities/request.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('payments')
@Index(['razorpayOrderId'], { unique: true, where: '"razorpayOrderId" IS NOT NULL' })
@Index(['idempotencyKey'], { unique: true, where: '"idempotencyKey" IS NOT NULL' })
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  requestId: string;

  @ManyToOne(() => RequestEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requestId' })
  request: RequestEntity;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  /** Amount in paise (INR * 100) */
  @Column({ type: 'int' })
  amountPaise: number;

  @Column({ type: 'varchar', length: 10, default: 'INR' })
  currency: string;

  @Column({ type: 'varchar', length: 20, default: PaymentStatus.Pending })
  status: PaymentStatus;

  @Column({ type: 'varchar', length: 120, nullable: true })
  razorpayOrderId: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  razorpayPaymentId: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  razorpaySignature: string | null;

  /** Client-supplied key to avoid duplicate order creation */
  @Column({ type: 'varchar', length: 120, nullable: true })
  idempotencyKey: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
