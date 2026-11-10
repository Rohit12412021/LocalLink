import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { ProviderEntity } from '../providers/entities/provider.entity';
import { RequestEntity } from '../requests/entities/request.entity';
import { ReviewEntity } from './entities/review.entity';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([ReviewEntity, RequestEntity, ProviderEntity]),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
