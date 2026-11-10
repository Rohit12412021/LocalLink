import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { RequestStatus } from '../../common/enums/request-status.enum';
import { UserEntity } from '../../users/entities/user.entity';
import { ProviderEntity } from '../../providers/entities/provider.entity';
import { ServiceEntity } from '../../services/entities/service.entity';

@Entity('requests')
export class RequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 40, unique: true })
  displayId: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => UserEntity, (user) => user.requests, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity | null;

  @Column({ type: 'uuid', nullable: true })
  providerId: string | null;

  @ManyToOne(() => ProviderEntity, (provider) => provider.requests, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'providerId' })
  provider: ProviderEntity | null;

  @Column({ type: 'varchar', length: 160 })
  providerName: string;

  @Column({ type: 'uuid', nullable: true })
  serviceId: string | null;

  @ManyToOne(() => ServiceEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'serviceId' })
  serviceRef: ServiceEntity | null;

  @Column({ type: 'varchar', length: 80 })
  category: string;

  @Column({ type: 'varchar', length: 160 })
  service: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 80 })
  date: string;

  @Column({ type: 'varchar', length: 40 })
  time: string;

  @Column({ type: 'varchar', length: 255 })
  location: string;

  @Column({ type: 'varchar', length: 30 })
  phone: string;

  @Column({ type: 'varchar', length: 80 })
  price: string;

  @Column({ type: 'varchar', length: 20, default: RequestStatus.Pending })
  status: RequestStatus;

  @Column({ type: 'varchar', length: 20, default: PaymentStatus.Unpaid })
  paymentStatus: PaymentStatus;

  @Column({ type: 'int', nullable: true })
  amountPaise: number | null;

  @Column({ type: 'float', nullable: true })
  latitude: number | null;

  @Column({ type: 'float', nullable: true })
  longitude: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
