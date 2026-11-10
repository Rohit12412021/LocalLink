import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ProviderEntity } from '../../providers/entities/provider.entity';

@Entity('services')
export class ServiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 160 })
  name: string;

  @Column({ type: 'varchar', length: 80 })
  price: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'uuid' })
  providerId: string;

  @ManyToOne(() => ProviderEntity, (provider) => provider.services, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'providerId' })
  provider: ProviderEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
