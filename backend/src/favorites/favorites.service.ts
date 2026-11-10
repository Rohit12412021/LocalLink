import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProviderEntity } from '../providers/entities/provider.entity';
import { UserEntity } from '../users/entities/user.entity';
import { FavoriteEntity } from './entities/favorite.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(FavoriteEntity)
    private readonly favoritesRepo: Repository<FavoriteEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    @InjectRepository(ProviderEntity)
    private readonly providersRepo: Repository<ProviderEntity>,
  ) {}

  async list(userId: string) {
    const favorites = await this.favoritesRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: {
        provider: {
          services: true,
        },
      },
    });

    return favorites
      .filter((f) => f.provider)
      .map((f) => ({
        id: f.id,
        providerId: f.providerId,
        createdAt: f.createdAt,
        provider: this.toProviderDto(f.provider as ProviderEntity),
      }));
  }

  async add(userId: string, providerId: string) {
    const provider = await this.providersRepo.findOne({
      where: { id: providerId },
    });
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    let favorite = await this.favoritesRepo.findOne({
      where: { userId, providerId },
    });

    if (!favorite) {
      favorite = this.favoritesRepo.create({ userId, providerId });
      await this.favoritesRepo.save(favorite);
    }

    return { id: favorite.id, providerId, added: true };
  }

  async remove(userId: string, providerId: string) {
    const result = await this.favoritesRepo.delete({ userId, providerId });
    return { removed: (result.affected ?? 0) > 0 };
  }

  async isFavorite(userId: string, providerId: string) {
    const favorite = await this.favoritesRepo.findOne({
      where: { userId, providerId },
    });
    return { isFavorite: Boolean(favorite) };
  }

  private toProviderDto(p: ProviderEntity) {
    return {
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      rating: p.rating,
      reviewCount: p.reviewCount,
      avatarUrl: p.avatarUrl ?? undefined,
      location: p.location,
      distance: p.distance ?? '',
      experience: p.experience,
      available: p.available,
      about: p.about,
      phone: p.phone ?? '',
      whatsapp: p.whatsapp ?? '',
      latitude: p.latitude ?? undefined,
      longitude: p.longitude ?? undefined,
      services: (p.services ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        price: s.price,
        description: s.description,
      })),
    };
  }
}