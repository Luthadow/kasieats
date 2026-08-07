import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedRequest } from '../auth/types';
import { VendorPortalService } from './vendor-portal.service';
import { UpdateVendorOrderStatusDto } from './dto/update-vendor-order-status.dto';
import { ToggleStoreDto } from './dto/toggle-store.dto';

@ApiTags('vendor')
@Controller('vendor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('vendor')
@ApiBearerAuth()
export class VendorPortalController {
  constructor(private readonly vendorPortalService: VendorPortalService) {}

  @Get('dashboard')
  getDashboard(@Req() req: AuthenticatedRequest) {
    return this.vendorPortalService.getDashboard(req.user.sub);
  }

  @Get('orders')
  listOrders(@Req() req: AuthenticatedRequest, @Query('status') status?: string) {
    return this.vendorPortalService.listOrders(req.user.sub, status);
  }

  @Patch('orders/:id/status')
  updateOrderStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateVendorOrderStatusDto,
  ) {
    return this.vendorPortalService.updateOrderStatus(req.user.sub, id, dto);
  }

  @Post('store/toggle')
  toggleStore(@Req() req: AuthenticatedRequest, @Body() dto: ToggleStoreDto) {
    return this.vendorPortalService.toggleStoreStatus(req.user.sub, dto.isOpen);
  }
}
