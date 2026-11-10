import { config as loadEnv } from 'dotenv';
loadEnv();

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { getDatabaseModeLabel } from './config/database.config';
import helmet from 'helmet';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(helmet());

  app.useStaticAssets(path.join(process.cwd(), 'public'), {
    prefix: '/uploads',
    maxAge: '7d',
    fallthrough: true,
  });

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = Number(process.env.PORT || 4000);
  await app.listen(port);

  console.log(`Backend running on http://localhost:${port}`);
  console.log(`Database: ${getDatabaseModeLabel()}`);
  console.log('Auth: real email signup — providers & users register their own accounts');
}

bootstrap();
