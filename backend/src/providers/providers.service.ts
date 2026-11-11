import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  formatDistanceKm,
  haversineKm,
} from '../common/utils/geo.util';
import { ServiceEntity } from '../services/entities/service.entity';
import { ProviderEntity } from './entities/provider.entity';
import {
  CreateServiceDto,
  UpdateProviderProfileDto,
  UpdateServiceDto,
} from './dto/provider.dto';

export type ProviderDto = {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  distance: string;
  price: string;
  available: boolean;
  location: string;
  phone: string;
  whatsapp: string;
  experience: string;
  about: string;
  avatarUrl: string | null;
  gallery: string[];
  latitude?: number | null;
  longitude?: number | null;
  services: Array<{ id?: string; name: string; price: string; description?: string | null; subItems?: any[] }>;
};

export type ProviderQuery = {
  lat?: number;
  lng?: number;
  q?: string;
  category?: string;
  sort?: string;
};

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(ProviderEntity)
    private readonly providersRepo: Repository<ProviderEntity>,
    @InjectRepository(ServiceEntity)
    private readonly servicesRepo: Repository<ServiceEntity>,
  ) {}

  private toDto(provider: ProviderEntity, distanceOverride?: string): ProviderDto {
    return {
      id: provider.id,
      name: provider.name,
      category: provider.category,
      rating: provider.rating,
      reviewCount: provider.reviewCount,
      distance: distanceOverride ?? provider.distance ?? 'Nearby',
      price: provider.price ?? 'Ask for quote',
      available: provider.available,
      location: provider.location,
      phone: provider.phone ?? '',
      whatsapp: provider.whatsapp ?? provider.phone ?? '',
      experience: provider.experience ?? '',
      about: provider.about ?? '',
      avatarUrl: provider.avatarUrl ?? null,
      gallery: provider.gallery ?? [],
      latitude: provider.latitude,
      longitude: provider.longitude,
      services: (provider.services || []).map((s) => ({
        id: s.id,
        name: s.name,
        price: s.price,
        description: s.description,
        category: (s as any).category || null,
        subItems: (s as any).subItems || [],
      })),
    };
  }

  async getAllProviders(query: ProviderQuery = {}): Promise<ProviderDto[]> {
    let providers = await this.providersRepo.find({
      relations: ['services'],
      order: { rating: 'DESC' },
    });

    if (query.category && query.category !== 'all') {
      // Normalize both sides: "car-repair" matches "Car Repair", "car repair", "carrepair"
      const normalize = (s: string) => s.toLowerCase().replace(/[\s-_]+/g, '');
      const cat = normalize(query.category);
      providers = providers.filter((p) => normalize(p.category) === cat);
    }

    if (query.q) {
      const q = query.q.toLowerCase();
      providers = providers.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          (p.services || []).some(
            (s) =>
              s.name.toLowerCase().includes(q) ||
              (s.subItems || []).some((sub) => sub.name.toLowerCase().includes(q)),
          ),
      );
    }

    const hasGeo =
      typeof query.lat === 'number' &&
      typeof query.lng === 'number' &&
      !Number.isNaN(query.lat) &&
      !Number.isNaN(query.lng);

    type Ranked = { provider: ProviderEntity; km: number; dto: ProviderDto };

    const ranked: Ranked[] = providers.map((provider) => {
      let km = Number.POSITIVE_INFINITY;
      let distanceLabel = provider.distance ?? 'Nearby';

      if (
        hasGeo &&
        provider.latitude != null &&
        provider.longitude != null
      ) {
        km = haversineKm(
          query.lat!,
          query.lng!,
          provider.latitude,
          provider.longitude,
        );
        distanceLabel = formatDistanceKm(km);
      }

      return {
        provider,
        km,
        dto: this.toDto(provider, distanceLabel),
      };
    });

    const sort = (query.sort || 'smart').toLowerCase();

    ranked.sort((a, b) => {
      if (sort === 'distance') {
        return a.km - b.km;
      }
      if (sort === 'rating') {
        return b.provider.rating - a.provider.rating;
      }
      if (sort === 'price') {
        const pa = parseInt(a.provider.price?.replace(/\D/g, '') || '9999', 10);
        const pb = parseInt(b.provider.price?.replace(/\D/g, '') || '9999', 10);
        return pa - pb;
      }
      // smart: available first, then rating * proximity score
      const score = (r: Ranked) => {
        const avail = r.provider.available ? 30 : 0;
        const rating = r.provider.rating * 10;
        const prox = Number.isFinite(r.km) ? Math.max(0, 20 - r.km) : 5;
        return avail + rating + prox;
      };
      return score(b) - score(a);
    });

    return ranked.map((r) => r.dto);
  }

  async getProviderById(id: string): Promise<ProviderDto> {
    const provider = await this.providersRepo.findOne({
      where: { id },
      relations: ['services'],
    });
    if (!provider) {
      throw new NotFoundException(`Provider with id "${id}" was not found`);
    }
    return this.toDto(provider);
  }

  async getMyProfile(userId: string): Promise<ProviderDto> {
    const provider = await this.findByUserId(userId);
    return this.toDto(provider);
  }

  async updateMyProfile(
    userId: string,
    dto: UpdateProviderProfileDto,
  ): Promise<ProviderDto> {
    const provider = await this.findByUserId(userId);

    if (dto.name !== undefined) provider.name = dto.name.trim();
    if (dto.about !== undefined) provider.about = dto.about.trim();
    if (dto.phone !== undefined) provider.phone = dto.phone.trim();
    if (dto.whatsapp !== undefined) provider.whatsapp = dto.whatsapp.trim();
    if (dto.available !== undefined) provider.available = dto.available;
    if (dto.location !== undefined) provider.location = dto.location.trim();
    if (dto.latitude !== undefined) provider.latitude = dto.latitude;
    if (dto.longitude !== undefined) provider.longitude = dto.longitude;
    if (dto.experience !== undefined) provider.experience = dto.experience.trim();
    if (dto.category !== undefined) provider.category = dto.category.trim();

    await this.providersRepo.save(provider);
    return this.getProviderById(provider.id);
  }

  async createService(userId: string, dto: CreateServiceDto): Promise<ProviderDto> {
    const provider = await this.findByUserId(userId);
    const { v4: uuidv4 } = await import('uuid');

    const subItemsData = dto.subItems && dto.subItems.length > 0
      ? dto.subItems.map(s => ({
          id: s.id || uuidv4(),
          name: s.name.trim(),
          price: s.price.trim(),
          description: s.description?.trim() || null,
        }))
      : null;

    // Build service object without subItems first (safe for DBs where column may not exist yet)
    const serviceData: Partial<ServiceEntity> = {
      name: dto.name.trim(),
      price: dto.price.trim(),
      description: dto.description?.trim() || null,
      category: dto.category?.trim() || null,
      providerId: provider.id,
    };

    if (subItemsData) {
      (serviceData as any).subItems = subItemsData;
    }

    const service = this.servicesRepo.create(serviceData as ServiceEntity);

    try {
      await this.servicesRepo.save(service);
    } catch (err: any) {
      // If subItems column doesn't exist yet on production DB, retry without it
      if (subItemsData && (
        err?.message?.includes('subItems') ||
        err?.message?.includes('column') ||
        err?.code === '42703'
      )) {
        delete (service as any).subItems;
        await this.servicesRepo.save(service);
      } else {
        throw err;
      }
    }

    if (!provider.price) {
      provider.price = dto.price.trim();
      await this.providersRepo.save(provider);
    }

    return this.getProviderById(provider.id);
  }

  async updateService(
    userId: string,
    serviceId: string,
    dto: UpdateServiceDto,
  ): Promise<ProviderDto> {
    const { v4: uuidv4 } = await import('uuid');
    const provider = await this.findByUserId(userId);
    const service = await this.servicesRepo.findOne({ where: { id: serviceId } });
    if (!service || service.providerId !== provider.id) {
      throw new NotFoundException('Service not found');
    }
    if (dto.name !== undefined) service.name = dto.name.trim();
    if (dto.price !== undefined) service.price = dto.price.trim();
    if (dto.description !== undefined) service.description = dto.description.trim();
    if (dto.category !== undefined) service.category = dto.category.trim() || null;
    if (dto.subItems !== undefined) {
      service.subItems = dto.subItems.map(s => ({
        id: s.id || uuidv4(),
        name: s.name.trim(),
        price: s.price.trim(),
        description: s.description?.trim() || null,
      }));
    }
    await this.servicesRepo.save(service);
    return this.getProviderById(provider.id);
  }

  async deleteService(userId: string, serviceId: string): Promise<ProviderDto> {
    const provider = await this.findByUserId(userId);
    const service = await this.servicesRepo.findOne({ where: { id: serviceId } });
    if (!service || service.providerId !== provider.id) {
      throw new NotFoundException('Service not found');
    }
    await this.servicesRepo.remove(service);
    return this.getProviderById(provider.id);
  }

  private async findByUserId(userId: string): Promise<ProviderEntity> {
    const provider = await this.providersRepo.findOne({
      where: { userId },
      relations: ['services'],
    });
    if (!provider) {
      throw new ForbiddenException('No provider profile linked to this account');
    }
    return provider;
  }

  async getProviderByUserId(userId: string): Promise<ProviderEntity> {
    return this.findByUserId(userId);
  }

  async updateProviderProfile(userId: string, updates: Partial<ProviderEntity>): Promise<void> {
    const provider = await this.findByUserId(userId);
    await this.providersRepo.update(provider.id, updates);
  }
}
