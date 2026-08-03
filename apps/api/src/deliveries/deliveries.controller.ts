import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DeliveriesService } from './deliveries.service';
import { UpdateDriverStatusDto } from './dto/update-driver-status.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('deliveries')
@ApiBearerAuth()
@Controller('deliveries')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('driver')
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Get('available')
  available(@CurrentUser('sub') userId: string) {
    return this.deliveriesService.getAvailable(userId);
  }

  @Get('mine')
  mine(@CurrentUser('sub') userId: string) {
    return this.deliveriesService.getMine(userId);
  }

  @Patch('driver/status')
  updateStatus(@CurrentUser('sub') userId: string, @Body() dto: UpdateDriverStatusDto) {
    return this.deliveriesService.updateDriverStatus(userId, dto);
  }

  @Post(':orderId/claim')
  claim(@CurrentUser('sub') userId: string, @Param('orderId') orderId: string) {
    return this.deliveriesService.claim(userId, orderId);
  }

  @Post(':id/pickup')
  pickup(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.deliveriesService.pickup(userId, id);
  }

  @Post(':id/en-route')
  enRoute(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.deliveriesService.enRoute(userId, id);
  }

  @Post(':id/arrived')
  arrived(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.deliveriesService.arrived(userId, id);
  }

  @Post(':id/deliver')
  deliver(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.deliveriesService.deliver(userId, id);
  }
}
