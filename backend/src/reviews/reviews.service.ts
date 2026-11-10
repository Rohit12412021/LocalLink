import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RequestStatus } from '../common/enums/request-status.enum';
import type { JwtPayloadUser } from '../common/types/jwt-payload';
import { ProviderEntity } from '../providers/entities/provider.entity';
import { RequestEntity } from '../requests/entities/request.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewEntity } from './entities/review.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(ReviewEntity)
    private readonly reviewsRepo: Repository<ReviewEntity>,
    @InjectRepository(RequestEntity)
    private readonly requestsRepo: Repository<RequestEntity>,
    @InjectRepository(ProviderEntity)
    private readonly providersRepo: Repository<ProviderEntity>,
  ) {}

  async create(dto: CreateReviewDto, user: JwtPayloadUser) {
    // Try UUID lookup first — wrap in try/catch because PostgreSQL throws
    // 22P02 (invalid_text_representation) if the string is not a valid UUID
    let request: RequestEntity | null = null;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.requestId);

    if (isUuid) {
      request = await this.requestsRepo.findOne({ where: { id: dto.requestId } });
    }

    // Fall back to displayId search (e.g. "LL-20260918-XXXX")
    if (!request) {
      request = await this.requestsRepo.findOne({ where: { displayId: dto.requestId } });
    }

    if (!request) {
      throw new NotFoundException('Booking not found');
    }
    if (request.userId !== user.userId) {
      throw new ForbiddenException('You can only review your own completed bookings');
    }
    if (request.status !== RequestStatus.Completed) {
      throw new ForbiddenException('You can only review completed bookings');
    }
    if (!request.providerId) {
      throw new NotFoundException('Provider missing on booking');
    }

    const existing = await this.reviewsRepo.findOne({
      where: { requestId: request.id },
    });
    if (existing) {
      throw new ForbiddenException('This booking already has a review');
    }

    const review = this.reviewsRepo.create({
      providerId: request.providerId,
      userId: user.userId,
      requestId: request.id, // Store the actual UUID, not the displayId
      rating: dto.rating,
      comment: dto.comment?.trim() || null,
    });
    const saved = await this.reviewsRepo.save(review);
    await this.recomputeProviderRating(request.providerId);

    return this.toDto(saved);
  }

  async listForProvider(providerId: string) {
    const rows = await this.reviewsRepo.find({
      where: { providerId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return rows.map((r) => this.toDto(r));
  }

  private async recomputeProviderRating(providerId: string) {
    const result = await this.reviewsRepo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(*)', 'count')
      .where('r.providerId = :providerId', { providerId })
      .getRawOne<{ avg: string; count: string }>();

    const provider = await this.providersRepo.findOne({ where: { id: providerId } });
    if (!provider) return;

    const avg = Number(result?.avg || 0);
    const count = Number(result?.count || 0);
    provider.rating = Math.round(avg * 10) / 10;
    provider.reviewCount = count;
    await this.providersRepo.save(provider);
  }

  private toDto(review: ReviewEntity) {
    return {
      id: review.id,
      providerId: review.providerId,
      userId: review.userId,
      requestId: review.requestId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
      user: review.user ? {
        name: review.user.name,
      } : null,
    };
  }
}
