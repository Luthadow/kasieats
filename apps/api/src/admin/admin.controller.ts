import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { RejectDto } from './dto/reject.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  dashboard() {
    return this.adminService.getDashboard();
  }

  @Get('vendors/pending')
  pendingVendors() {
    return this.adminService.getPendingVendors();
  }

  @Post('vendors/:id/approve')
  approveVendor(@CurrentUser('sub') adminUserId: string, @Param('id') id: string) {
    return this.adminService.approveVendor(adminUserId, id);
  }

  @Post('vendors/:id/reject')
  rejectVendor(@Param('id') id: string, @Body() dto: RejectDto) {
    return this.adminService.rejectVendor(id, dto.reason);
  }

  @Get('drivers/pending')
  pendingDrivers() {
    return this.adminService.getPendingDrivers();
  }

  @Post('drivers/:id/approve')
  approveDriver(@CurrentUser('sub') adminUserId: string, @Param('id') id: string) {
    return this.adminService.approveDriver(adminUserId, id);
  }

  @Post('drivers/:id/reject')
  rejectDriver(@Param('id') id: string, @Body() dto: RejectDto) {
    return this.adminService.rejectDriver(id, dto.reason);
  }

  @Get('orders')
  listOrders(@Query() query: ListOrdersQueryDto) {
    return this.adminService.listOrders(query);
  }

  @Post('orders/:id/cancel')
  cancelOrder(@Param('id') id: string, @Body() dto: RejectDto) {
    return this.adminService.cancelOrder(id, dto.reason);
  }
}
