import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

export type StoredFile = {
  url: string;
  folder: string;
  filename: string;
};

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  private isS3Configured(): boolean {
    return Boolean(
      process.env.AWS_ACCESS_KEY_ID &&
        process.env.AWS_ACCESS_KEY_ID !== 'mock' &&
        process.env.AWS_SECRET_ACCESS_KEY &&
        process.env.AWS_SECRET_ACCESS_KEY !== 'mock',
    );
  }

  private publicBaseUrl(): string {
    return process.env.PUBLIC_BASE_URL || 'http://localhost:4000';
  }

  /**
   * Validate an uploaded image and persist it either to S3 (when configured)
   * or to backend/public/uploads/<folder> served statically.
   */
  async saveImage(
    file: {
      originalname?: string;
      buffer: Buffer;
      mimetype?: string;
      size?: number;
    },
    folder: string,
  ): Promise<StoredFile> {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file uploaded');
    }
    if (typeof file.size !== 'number' || file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File size must be less than 5MB');
    }
    if (!file.mimetype || !ALLOWED_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG and WebP images are allowed');
    }

    const safeFolder = folder.replace(/[^a-z0-9-_]/gi, '');
    const ext = path.extname(file.originalname || '') || `.${file.mimetype.split('/')[1]}`;
    const filename = `${uuid()}${ext}`;

    if (this.isS3Configured()) {
      const s3 = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });
      const key = `${safeFolder}/${filename}`;
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME || 'locallink-assets',
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
      return {
        url: `https://${process.env.AWS_BUCKET_NAME || 'locallink-assets'}.s3.amazonaws.com/${key}`,
        folder: safeFolder,
        filename,
      };
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', safeFolder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, file.buffer);

    return {
      url: `${this.publicBaseUrl()}/uploads/${safeFolder}/${filename}`,
      folder: safeFolder,
      filename,
    };
  }
}