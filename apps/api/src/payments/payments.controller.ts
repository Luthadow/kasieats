import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('orders/:orderId/initiate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer')
  initiate(@CurrentUser('sub') userId: string, @Param('orderId') orderId: string) {
    return this.paymentsService.initiate(userId, orderId);
  }

  @Public()
  @Post('mock-checkout/:ref/confirm')
  confirm(@Param('ref') ref: string) {
    return this.paymentsService.confirmMockCheckout(ref);
  }

  @Get('orders/:orderId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer')
  status(@CurrentUser('sub') userId: string, @Param('orderId') orderId: string) {
    return this.paymentsService.getPaymentStatus(userId, orderId);
  }
}
