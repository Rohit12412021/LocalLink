import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { ProviderEntity } from '../../providers/entities/provider.entity';

@Entity('favorites')
@Unique('favorite_user_provider', ['userId', 'providerId'])
export class FavoriteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('favorite_user_idx')
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  providerId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: Relation<UserEntity>;

  @ManyToOne(() => ProviderEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'providerId' })
  provider?: Relation<ProviderEntity>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}