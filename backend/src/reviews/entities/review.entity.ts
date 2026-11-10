import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { ProviderEntity } from '../../providers/entities/provider.entity';
import { RequestEntity } from '../../requests/entities/request.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('reviews')
@Unique(['requestId'])
@Index(['providerId'])
export class ReviewEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  providerId: string;

  @ManyToOne(() => ProviderEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'providerId' })
  provider: ProviderEntity;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({ type: 'uuid', unique: true })
  requestId: string;

  @ManyToOne(() => RequestEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requestId' })
  request: RequestEntity;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
