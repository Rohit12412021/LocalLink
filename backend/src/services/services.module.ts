import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceEntity } from './entities/service.entity';
import { ServicesController } from './services.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceEntity])],
  controllers: [ServicesController],
  exports: [],
})
export class ServicesModule {}
