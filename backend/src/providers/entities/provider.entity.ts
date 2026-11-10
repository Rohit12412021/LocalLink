import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ServiceEntity } from '../../services/entities/service.entity';
import { RequestEntity } from '../../requests/entities/request.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('providers')
export class ProviderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 160 })
  name: string;

  @Column({ type: 'varchar', length: 80 })
  category: string;

  @Column({ type: 'varchar', length: 255 })
  location: string;

  @Column({ type: 'float', default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  @Column({ type: 'varchar', length: 40, nullable: true })
  distance: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  price: string | null;

  @Column({ type: 'boolean', default: true })
  available: boolean;

  @Column({ type: 'varchar', length: 40, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  whatsapp: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  experience: string | null;

  @Column({ type: 'text', nullable: true })
  about: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'simple-array', default: '' })
  gallery: string[];

  @Column({ type: 'text', nullable: true })
  searchDocument: string | null;

  @Column({ type: 'float', nullable: true })
  latitude: number | null;

  @Column({ type: 'float', nullable: true })
  longitude: number | null;

  @Column({ type: 'uuid', nullable: true, unique: true })
  userId: string | null;

  @OneToOne(() => UserEntity, (user) => user.providerProfile, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity | null;

  @OneToMany(() => ServiceEntity, (service) => service.provider, {
    cascade: true,
    eager: true,
  })
  services: ServiceEntity[];

  @OneToMany(() => RequestEntity, (request) => request.provider)
  requests: RequestEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
