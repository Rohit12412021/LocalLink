import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('notifications')
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('notification_user_idx')
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 50 })
  type: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 1000, default: '' })
  body: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  requestId: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  link: string | null;

  @Column({ type: 'boolean', default: false })
  read: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}