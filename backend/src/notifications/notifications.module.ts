import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { SocketGateway } from './socket.gateway';
import { NotificationsController } from './notifications.controller';
import { NotificationEntity } from './entities/notification.entity';

@Module({
    imports: [
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get<string>('JWT_SECRET') || 'locallink-dev-secret-change-me',
                signOptions: { expiresIn: '7d' },
            }),
        }),
        TypeOrmModule.forFeature([NotificationEntity]),
    ],
    controllers: [NotificationsController],
    providers: [NotificationsService, SocketGateway],
    exports: [NotificationsService, SocketGateway],
})
export class NotificationsModule { }