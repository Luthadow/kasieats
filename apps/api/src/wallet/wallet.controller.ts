import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/types';
import { RequestWithdrawalDto } from './dto/wallet.dto';
import { WalletService } from './wallet.service';

@ApiTags('wallet')
@Controller('wallet')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  getSummary(@Req() req: AuthenticatedRequest) {
    return this.walletService.getSummary(req.user.sub);
  }

  @Get('transactions')
  listTransactions(@Req() req: AuthenticatedRequest) {
    return this.walletService.listTransactions(req.user.sub);
  }

  @Post('withdraw')
  requestWithdrawal(@Req() req: AuthenticatedRequest, @Body() dto: RequestWithdrawalDto) {
    return this.walletService.requestWithdrawal(req.user.sub, dto);
  }
}
