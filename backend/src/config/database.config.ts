import { config as loadEnv } from 'dotenv';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

loadEnv();

export function assertPostgresConfigured(): void {
  if (!hasPostgresConfig()) {
    throw new Error(
      [
        '',
        '══════════════════════════════════════════════════════════════',
        '  LocalLink requires PostgreSQL — no local/sqlite database.',
        '',
        '  1. Open:  backend/.env',
        '  2. Paste: DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB',
        '  3. Restart: npm run start:dev',
        '',
        '  Free hosts: Neon, Supabase, Railway, or local Postgres.',
        '══════════════════════════════════════════════════════════════',
        '',
      ].join('\n'),
    );
  }
}

export function hasPostgresConfig(): boolean {
  return Boolean(
    process.env.DATABASE_URL ||
    process.env.DATABASE_HOST ||
    process.env.DATABASE_ENABLED === 'true',
  );
}

export function getTypeOrmConfig(): TypeOrmModuleOptions {
  assertPostgresConfigured();

  const isProd = process.env.NODE_ENV === 'production';

  // Always sync unless explicitly set to false.
  // This ensures tables are created/updated on Render on every deploy.
  const sync = process.env.DATABASE_SYNC !== 'false';

  // Auto-detect SSL for cloud providers (Render, Neon, Supabase, Railway)
  const url = process.env.DATABASE_URL ?? '';
  const ssl =
    process.env.DATABASE_SSL === 'true' ||
    isProd ||
    url.includes('sslmode=require') ||
    url.includes('render.com') ||
    url.includes('neon.tech') ||
    url.includes('supabase.co') ||
    url.includes('railway.app');

  if (url) {
    return {
      type: 'postgres',
      url,
      autoLoadEntities: true,
      synchronize: sync,
      ssl: ssl ? { rejectUnauthorized: false } : undefined,
      extra: ssl ? { ssl: { rejectUnauthorized: false } } : undefined,
    };
  }

  return {
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT || 5432),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'locallink',
    autoLoadEntities: true,
    synchronize: sync,
    ssl: ssl ? { rejectUnauthorized: false } : undefined,
  };
}

export function getDatabaseModeLabel(): string {
  if (process.env.DATABASE_URL) return 'PostgreSQL (DATABASE_URL)';
  return 'PostgreSQL (DATABASE_HOST fields)';
}
