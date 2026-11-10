import { config as loadEnv } from 'dotenv';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

// Load backend/.env before TypeORM config is evaluated
loadEnv();

/**
 * PostgreSQL only.
 *
 * Paste your connection string in backend/.env:
 *   DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
 *
 * Or use separate DATABASE_HOST / DATABASE_USERNAME / etc.
 */
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
        '  See backend/.env.example for the full template.',
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

  // In production: allow DATABASE_SYNC=true to force sync (useful for initial deploy)
  // In development: sync unless explicitly disabled
  const sync =
    process.env.DATABASE_SYNC === 'true' ||
    (!isProd && process.env.DATABASE_SYNC !== 'false');

  // Render and most cloud Postgres providers require SSL
  const ssl =
    process.env.DATABASE_SSL === 'true' ||
    isProd ||
    process.env.DATABASE_URL?.includes('sslmode=require') ||
    process.env.DATABASE_URL?.includes('render.com') ||
    process.env.DATABASE_URL?.includes('neon.tech') ||
    process.env.DATABASE_URL?.includes('supabase.co');

  if (process.env.DATABASE_URL) {
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
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
  if (process.env.DATABASE_URL) {
    return 'PostgreSQL (DATABASE_URL)';
  }
  return 'PostgreSQL (DATABASE_HOST fields)';
}
