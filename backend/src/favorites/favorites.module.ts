import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { FavoriteEntity } from './entities/favorite.entity';
import { UserEntity } from '../users/entities/user.entity';
import { ProviderEntity } from '../providers/entities/provider.entity';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([FavoriteEntity, UserEntity, ProviderEntity])
  ],
  controllers: [FavoritesController],
  providers: [FavoritesService],
  exports: [FavoritesService],
})
export class FavoritesModule {}