import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProviderEntity } from '../providers/entities/provider.entity';
import { ServiceEntity } from '../services/entities/service.entity';
import { UserEntity } from '../users/entities/user.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProviderEntity, ServiceEntity, UserEntity])],
  providers: [SeedService],
})
export class SeedModule {}
