import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { VendorPortalController } from './vendor-portal.controller';
import { VendorPortalService } from './vendor-portal.service';

@Module({
  imports: [RealtimeModule],
  controllers: [VendorPortalController],
  providers: [VendorPortalService],
})
export class VendorModule {}
