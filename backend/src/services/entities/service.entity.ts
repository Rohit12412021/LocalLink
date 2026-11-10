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

  /** Base/starting price shown on card — e.g. "₹500 onwards" */
  @Column({ type: 'varchar', length: 80 })
  price: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /**
   * Optional sub-items (sub-categories) with individual prices.
   * Stored as JSON so no migration needed — just a new nullable column.
   * Example: [{ id: "uuid", name: "AC Filter Change", price: "₹300" }]
   */
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
