import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceEntity } from './entities/service.entity';

@Controller('services')
export class ServicesController {
  constructor(
    @InjectRepository(ServiceEntity)
    private readonly servicesRepo: Repository<ServiceEntity>,
  ) {}

  /**
   * GET /services
   * Returns all services as flat list, each with provider info.
   * Query params:
   *   category — filter by service-level category (falls back to provider category)
   *   q        — search in service name, description, provider name
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getAll(
    @Query('category') category?: string,
    @Query('q') q?: string,
  ) {
    const services = await this.servicesRepo.find({
      relations: ['provider'],
      order: { createdAt: 'DESC' },
    });

    const normalize = (s: string) => s.toLowerCase().replace(/[\s\-_]+/g, '');

    let result = services.filter(s => s.provider != null); // skip orphans

    // Each service's effective category: service.category ?? provider.category
    if (category && category !== 'all') {
      const cat = normalize(category);
      result = result.filter(s => {
        const effective = s.category ?? s.provider?.category ?? '';
        return normalize(effective) === cat;
      });
    }

    if (q) {
      const query = q.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(query) ||
        (s.description ?? '').toLowerCase().includes(query) ||
        (s.provider?.name ?? '').toLowerCase().includes(query) ||
        (s.category ?? s.provider?.category ?? '').toLowerCase().includes(query),
      );
    }

    return result.map(s => ({
      serviceId: s.id,
      name: s.name,
      price: s.price,
      description: s.description,
      category: s.category ?? s.provider?.category ?? '',
      subItems: (s as any).subItems ?? [],
      provider: {
        id: s.provider!.id,
        name: s.provider!.name,
        rating: s.provider!.rating,
        reviewCount: s.provider!.reviewCount,
        location: s.provider!.location,
        distance: s.provider!.distance ?? 'Nearby',
        available: s.provider!.available,
        avatarUrl: s.provider!.avatarUrl ?? null,
        experience: s.provider!.experience ?? '',
      },
    }));
  }
}
