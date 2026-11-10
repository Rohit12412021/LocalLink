import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayloadUser } from '../common/types/jwt-payload';
import { UserRole } from '../common/enums/user-role.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProviderEntity } from './entities/provider.entity';
import { UploadsService } from '../uploads/uploads.service';

interface UploadedFile {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
}

@Controller('providers/me/upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Provider)
export class UploadsController {
  constructor(
    @InjectRepository(ProviderEntity)
    private readonly providersRepo: Repository<ProviderEntity>,
    private readonly uploadsService: UploadsService,
  ) {}

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile() file: UploadedFile,
    @CurrentUser() user: JwtPayloadUser,
  ) {
    const stored = await this.uploadsService.saveImage(file, 'avatars');

    await this.providersRepo.update(
      { userId: user.userId },
      { avatarUrl: stored.url },
    );

    return { url: stored.url };
  }

  @Post('gallery')
  @UseInterceptors(FileInterceptor('file'))
  async uploadGallery(
    @UploadedFile() file: UploadedFile,
    @CurrentUser() user: JwtPayloadUser,
  ) {
    const provider = await this.providersRepo.findOne({
      where: { userId: user.userId },
    });
    if (!provider) {
      throw new BadRequestException('Provider profile not found');
    }

    const stored = await this.uploadsService.saveImage(file, 'gallery');
    const gallery = Array.isArray(provider.gallery) ? provider.gallery : [];
    // Keep gallery capped at 9 images.
    const next = [...gallery, stored.url].slice(-9);
    await this.providersRepo.update(provider.id, { gallery: next });

    return { url: stored.url, gallery: next };
  }
}