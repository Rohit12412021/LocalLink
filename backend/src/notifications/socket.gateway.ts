import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
    },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    constructor(private readonly jwtService: JwtService) { }

    async handleConnection(client: Socket) {
        const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];

        if (!token) {
            client.disconnect();
            return;
        }

        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_SECRET || 'locallink-dev-secret-change-me',
            });
            if (!payload?.sub) {
                client.disconnect();
                return;
            }
            if (payload.providerId) {
                client.join(`provider_${payload.providerId}`);
            }
            client.join(`user_${payload.sub}`);
        } catch {
            client.disconnect();
        }
    }

    handleDisconnect(_client: Socket) {
        // nothing special needed
    }

    @SubscribeMessage('join_request_room')
    handleJoinRequestRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { requestId: string },
    ) {
        if (data?.requestId) {
            client.join(`request_${data.requestId}`);
        }
    }

    emitToUser(userId: string, event: string, payload: unknown) {
        this.server.to(`user_${userId}`).emit(event, payload);
    }

    notifyProviderRequestUpdate(providerId: string, requestId: string, status: string) {
        this.server.to(`provider_${providerId}`).emit('booking_updated', { requestId, status });
    }

    notifyCustomerRequestUpdate(userId: string, requestId: string, status: string) {
        this.server.to(`user_${userId}`).emit('booking_updated', { requestId, status });
    }
}