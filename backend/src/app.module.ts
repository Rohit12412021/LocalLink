import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import {
  getDatabaseModeLabel,
  getTypeOrmConfig,
} from './config/database.config';
import { ProvidersModule } from './providers/providers.module';
import { RequestsModule } from './requests/requests.module';
import { SeedModule } from './seed/seed.module';
import { SmartModule } from './smart/smart.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ChatModule } from './chat/chat.module';
import { PaymentsModule } from './payments/payments.module';
import { ReviewsModule } from './reviews/reviews.module';
import { UploadsModule } from './uploads/uploads.module';
import { FavoritesModule } from './favorites/favorites.module';
import { ServicesModule } from './services/services.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    ThrottlerModule.forRoot([
      {
        // Single global limit: 600 requests per minute per IP
        // Auth endpoints override this with their own stricter @Throttle() decorators
        name: 'default',
        ttl: 60000,
        limit: 600,
      },
    ]),
    TypeOrmModule.forRoot(getTypeOrmConfig()),
    AuthModule,
    ProvidersModule,
    RequestsModule,
    SmartModule,
    SeedModule,
    NotificationsModule,
    PaymentsModule,
    ReviewsModule,
    ChatModule,
    UploadsModule,
    FavoritesModule,
    ServicesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {
  constructor() {
    console.log(`Database mode: ${getDatabaseModeLabel()}`);
  }
}
