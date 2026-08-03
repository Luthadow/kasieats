import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderActionDto } from './dto/order-action.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles('customer')
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(userId, dto);
  }

  @Get()
  @Roles('customer')
  list(@CurrentUser('sub') userId: string) {
    return this.ordersService.listCustomerOrders(userId);
  }

  @Get('vendor/inbox')
  @Roles('vendor')
  @ApiQuery({ name: 'status', required: false })
  vendorInbox(@CurrentUser('sub') userId: string, @Query('status') status?: string) {
    return this.ordersService.getVendorInbox(userId, status);
  }

  @Get(':id')
  @Roles('customer')
  getOne(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.ordersService.getOrder(userId, id);
  }

  @Post(':id/cancel')
  @Roles('customer')
  cancel(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: OrderActionDto,
  ) {
    return this.ordersService.cancelOrder(userId, id, dto.reason);
  }

  @Post(':id/accept')
  @Roles('vendor')
  accept(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.ordersService.acceptOrder(userId, id);
  }

  @Post(':id/reject')
  @Roles('vendor')
  reject(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: OrderActionDto,
  ) {
    return this.ordersService.rejectOrder(userId, id, dto.reason);
  }

  @Post(':id/preparing')
  @Roles('vendor')
  preparing(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.ordersService.markPreparing(userId, id);
  }

  @Post(':id/ready')
  @Roles('vendor')
  ready(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.ordersService.markReady(userId, id);
  }
}
