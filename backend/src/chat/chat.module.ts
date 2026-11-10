import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageEntity } from './entities/message.entity';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RequestEntity } from '../requests/entities/request.entity';
import { ProviderEntity } from '../providers/entities/provider.entity';
import { UserEntity } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MessageEntity, RequestEntity, ProviderEntity, UserEntity]),
    AuthModule,
    NotificationsModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
