import { Module } from '@nestjs/common';
import { AdminPortalController } from './admin-portal.controller';
import { AdminPortalService } from './admin-portal.service';

@Module({
  controllers: [AdminPortalController],
  providers: [AdminPortalService],
})
export class AdminModule {}
