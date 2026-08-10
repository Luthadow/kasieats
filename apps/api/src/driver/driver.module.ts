import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { DriverPortalController } from './driver-portal.controller';
import { DriverPortalService } from './driver-portal.service';

@Module({
  imports: [RealtimeModule],
  controllers: [DriverPortalController],
  providers: [DriverPortalService],
})
export class DriverModule {}
