import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { UploadsModule } from '../uploads/uploads.module';
import { ServiceEntity } from '../services/entities/service.entity';
import { ProviderEntity } from './entities/provider.entity';
import { ProvidersController } from './providers.controller';
import { ProvidersService } from './providers.service';
import { UploadsController } from './uploads.controller';

@Module({
  imports: [
    AuthModule,
    UploadsModule,
    TypeOrmModule.forFeature([ProviderEntity, ServiceEntity]),
  ],
  controllers: [ProvidersController, UploadsController],
  providers: [ProvidersService],
  exports: [ProvidersService],
})
export class ProvidersModule { }
