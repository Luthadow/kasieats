import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/types';
import { NotificationsService } from './notifications.service';
import { RegisterDeviceDto } from './dto/register-device.dto';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('register-device')
  registerDevice(@Req() req: AuthenticatedRequest, @Body() dto: RegisterDeviceDto) {
    return this.notificationsService.registerDevice(req.user.sub, dto);
  }

  @Get()
  list(@Req() req: AuthenticatedRequest, @Query('unreadOnly') unreadOnly?: string) {
    return this.notificationsService.listForUser(req.user.sub, unreadOnly === 'true');
  }

  @Patch('read-all')
  markAllRead(@Req() req: AuthenticatedRequest) {
    return this.notificationsService.markAllRead(req.user.sub);
  }

  @Patch(':id/read')
  markRead(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.notificationsService.markRead(req.user.sub, id);
  }
}
