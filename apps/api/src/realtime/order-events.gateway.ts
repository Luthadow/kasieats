import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { OrderEventsService } from './order-events.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/orders',
})
export class OrderEventsGateway implements OnGatewayConnection {
  private readonly logger = new Logger(OrderEventsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly orderEvents: OrderEventsService) {
    this.orderEvents.subscribe((event) => {
      this.server.emit('order:update', event);
      if (event.vendorUserId) {
        this.server.to(`user:${event.vendorUserId}`).emit('order:update', event);
      }
      if (event.customerUserId) {
        this.server.to(`user:${event.customerUserId}`).emit('order:update', event);
      }
      if (event.driverUserId) {
        this.server.to(`user:${event.driverUserId}`).emit('order:update', event);
      }
      this.server.to(`order:${event.orderId}`).emit('order:update', event);
    });
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId?: string; orderId?: string },
  ) {
    if (payload.userId) {
      client.join(`user:${payload.userId}`);
    }
    if (payload.orderId) {
      client.join(`order:${payload.orderId}`);
    }
    return { success: true };
  }
}
