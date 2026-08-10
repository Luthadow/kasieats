import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/types';
import { ConfirmPaymentDto, InitiatePaymentDto, PaymentWebhookDto } from './dto/payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initiate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  initiate(@Req() req: AuthenticatedRequest, @Body() dto: InitiatePaymentDto) {
    return this.paymentsService.initiate(req.user.sub, dto);
  }

  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  confirm(@Req() req: AuthenticatedRequest, @Body() dto: ConfirmPaymentDto) {
    return this.paymentsService.confirm(req.user.sub, dto);
  }

  @Post('webhook/:provider')
  webhook(
    @Param('provider') provider: string,
    @Body() dto: PaymentWebhookDto,
    @Req() req: { headers: Record<string, string | undefined> },
  ) {
    const signature =
      req.headers['x-yoco-signature'] ??
      req.headers['x-ozow-signature'] ??
      req.headers['authorization'];
    return this.paymentsService.handleWebhook(
      provider,
      dto.transactionReference,
      dto.status,
      signature,
    );
  }
}
