import { Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedRequest } from '../auth/types';
import { AdminPortalService } from './admin-portal.service';
import { RejectApplicationDto } from './dto/admin.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminPortalController {
  constructor(private readonly adminPortalService: AdminPortalService) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminPortalService.getDashboard();
  }

  @Get('vendors/pending')
  listPendingVendors() {
    return this.adminPortalService.listPendingVendors();
  }

  @Get('drivers/pending')
  listPendingDrivers() {
    return this.adminPortalService.listPendingDrivers();
  }

  @Get('orders')
  listOrders() {
    return this.adminPortalService.listRecentOrders();
  }

  @Patch('vendors/:id/approve')
  approveVendor(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.adminPortalService.approveVendor(id, req.user.sub);
  }

  @Patch('vendors/:id/reject')
  rejectVendor(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: RejectApplicationDto,
  ) {
    return this.adminPortalService.rejectVendor(id, req.user.sub, dto);
  }

  @Patch('drivers/:id/approve')
  approveDriver(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.adminPortalService.approveDriver(id, req.user.sub);
  }

  @Patch('drivers/:id/reject')
  rejectDriver(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: RejectApplicationDto,
  ) {
    return this.adminPortalService.rejectDriver(id, req.user.sub, dto);
  }

  @Get('withdrawals/pending')
  listPendingWithdrawals() {
    return this.adminPortalService.listPendingWithdrawals();
  }

  @Patch('withdrawals/:id/approve')
  approveWithdrawal(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.adminPortalService.approveWithdrawal(id, req.user.sub);
  }

  @Patch('withdrawals/:id/reject')
  rejectWithdrawal(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: RejectApplicationDto,
  ) {
    return this.adminPortalService.rejectWithdrawal(id, req.user.sub, dto);
  }
}
