import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { UserRole } from '../../common/enums/user-role.enum';
import { RequestEntity } from '../../requests/entities/request.entity';
import { ProviderEntity } from '../../providers/entities/provider.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 180, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string | null;

  @Column({ type: 'varchar', length: 20, default: UserRole.User })
  role: UserRole;

  @Column({ type: 'varchar', length: 20, default: 'password' })
  authMethod: string;

  @Column({ type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  emailVerificationToken: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  emailVerificationExpiry: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'boolean', default: false })
  phoneVerified: boolean;

  @Column({ type: 'varchar', length: 10, nullable: true })
  phoneVerificationCode: string | null;

  @Column({ type: 'timestamp', nullable: true })
  phoneVerificationExpiry: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordResetToken: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  passwordResetExpiry: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  googleId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  githubId: string | null;

  @OneToOne(() => ProviderEntity, (provider) => provider.user)
  providerProfile: ProviderEntity | null;

  @OneToMany(() => RequestEntity, (request) => request.user)
  requests: RequestEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
