import { Global, Module } from '@nestjs/common';
import { OrderEventsGateway } from './order-events.gateway';
import { OrderEventsService } from './order-events.service';

@Global()
@Module({
  providers: [OrderEventsService, OrderEventsGateway],
  exports: [OrderEventsService],
})
export class RealtimeModule {}
