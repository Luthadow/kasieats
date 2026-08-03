import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Public } from '../common/decorators/public.decorator';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('me')
  @UseGuards(RolesGuard)
  @Roles('vendor')
  @ApiOperation({ summary: "Get vendor's current subscription" })
  getMySubscription(@Request() req: { user: { sub: string } }) {
    return this.subscriptionsService.getMySubscription(req.user.sub);
  }

  @Post('checkout')
  @UseGuards(RolesGuard)
  @Roles('vendor')
  @ApiOperation({ summary: 'Initiate monthly subscription payment (sandbox)' })
  checkout(@Request() req: { user: { sub: string } }) {
    return this.subscriptionsService.initiateCheckout(req.user.sub);
  }

  @Post('mock-checkout/:ref/confirm')
  @Public()
  @ApiOperation({ summary: 'Confirm mock sandbox subscription payment' })
  confirmMockCheckout(@Param('ref') ref: string) {
    return this.subscriptionsService.confirmMockCheckout(ref);
  }

  @Post('ozow/callback')
  @Public()
  @ApiOperation({ summary: 'Ozow payment gateway callback (stub)' })
  ozowCallback(@Request() req: { body: Record<string, unknown> }) {
    return this.subscriptionsService.handleOzowCallback(req.body);
  }
}
