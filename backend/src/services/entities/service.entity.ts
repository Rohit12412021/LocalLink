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

export type ServiceSubItem = {
  id: string;
  name: string;
  price: string;
  description?: string | null;
};

@Entity('services')
export class ServiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 160 })
  name: string;

  /** Starting / base price */
  @Column({ type: 'varchar', length: 80 })
  price: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /**
   * Service-level category — lets one provider offer services across different categories.
   * e.g. "Riya Car Repair" can offer "AC Repair" AND "Car Repair" services.
   * Falls back to the provider's category if not set.
   */
  @Column({ type: 'varchar', length: 80, nullable: true })
  category: string | null;

  /** Sub-options with individual prices (stored as JSONB) */
  @Column({ type: 'jsonb', nullable: true, default: null })
  subItems: ServiceSubItem[] | null;

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
