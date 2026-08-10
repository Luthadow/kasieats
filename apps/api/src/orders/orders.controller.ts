import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/types';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateReviewDto } from './dto/create-review.dto';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(req.user.sub, dto);
  }

  @Get()
  list(@Req() req: AuthenticatedRequest) {
    return this.ordersService.listCustomerOrders(req.user.sub);
  }

  @Get(':id/tracking')
  getTracking(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.ordersService.getOrderTracking(req.user.sub, id);
  }

  @Get(':id/reviews')
  getReviews(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.ordersService.getOrderReviews(req.user.sub, id);
  }

  @Post(':id/reviews')
  submitReview(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.ordersService.submitReview(req.user.sub, id, dto);
  }

  @Get(':id')
  getOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.ordersService.getOrder(req.user.sub, id);
  }
}
