import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedRequest } from '../auth/types';
import { DriverPortalService } from './driver-portal.service';
import {
  UpdateDriverDeliveryDto,
  UpdateDriverLocationDto,
  UpdateDriverStatusDto,
} from './dto/driver.dto';

@ApiTags('driver')
@Controller('driver')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('driver')
@ApiBearerAuth()
export class DriverPortalController {
  constructor(private readonly driverPortalService: DriverPortalService) {}

  @Get('dashboard')
  getDashboard(@Req() req: AuthenticatedRequest) {
    return this.driverPortalService.getDashboard(req.user.sub);
  }

  @Post('status')
  updateStatus(@Req() req: AuthenticatedRequest, @Body() dto: UpdateDriverStatusDto) {
    return this.driverPortalService.updateStatus(req.user.sub, dto);
  }

  @Post('location')
  updateLocation(@Req() req: AuthenticatedRequest, @Body() dto: UpdateDriverLocationDto) {
    return this.driverPortalService.updateLocation(req.user.sub, dto);
  }

  @Get('jobs')
  listJobs(@Req() req: AuthenticatedRequest) {
    return this.driverPortalService.listAvailableJobs(req.user.sub);
  }

  @Post('jobs/:orderId/accept')
  acceptJob(@Req() req: AuthenticatedRequest, @Param('orderId') orderId: string) {
    return this.driverPortalService.acceptJob(req.user.sub, orderId);
  }

  @Get('deliveries/active')
  getActiveDelivery(@Req() req: AuthenticatedRequest) {
    return this.driverPortalService.getActiveDelivery(req.user.sub);
  }

  @Patch('deliveries/:id/status')
  updateDeliveryStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateDriverDeliveryDto,
  ) {
    return this.driverPortalService.updateDeliveryStatus(req.user.sub, id, dto);
  }
}
