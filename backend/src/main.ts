import { config as loadEnv } from 'dotenv';
loadEnv();

import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { getDatabaseModeLabel } from './config/database.config';
import helmet from 'helmet';
import * as path from 'path';

const logger = new Logger('Bootstrap');

async function runSafeMigrations(dataSource: DataSource) {
  try {
    await dataSource.query(`ALTER TABLE services ADD COLUMN IF NOT EXISTS "subItems" jsonb DEFAULT NULL;`);
    await dataSource.query(`ALTER TABLE providers ADD COLUMN IF NOT EXISTS "avatarUrl" varchar(500) DEFAULT NULL;`);
    try { await dataSource.query(`ALTER TABLE providers ADD COLUMN IF NOT EXISTS gallery text DEFAULT '';`); } catch {}
    logger.log('[Migration] Safe column additions completed');
  } catch (err) {
    logger.warn(`[Migration] Non-fatal: ${(err as Error).message}`);
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(helmet());

  try {
    const dataSource = app.get(DataSource);
    if (dataSource.isInitialized) await runSafeMigrations(dataSource);
  } catch (err) {
    logger.warn(`[Migration] Could not run: ${(err as Error).message}`);
  }

  app.useStaticAssets(path.join(process.cwd(), 'public'), {
    prefix: '/uploads',
    maxAge: '7d',
    fallthrough: true,
  });

  const allowedOrigins = [
    process.env.CORS_ORIGIN,
    'http://localhost:3000',
    'http://localhost:3001',
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = Number(process.env.PORT || 4000);
  await app.listen(port);

  console.log(`Backend running on http://localhost:${port}`);
  console.log(`Database: ${getDatabaseModeLabel()}`);
  console.log('Auth: real email signup — providers & users register their own accounts');
}

bootstrap();
