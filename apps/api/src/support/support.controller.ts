import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedRequest } from '../auth/types';
import { CreateSupportTicketDto, UpdateSupportTicketDto } from './dto/support.dto';
import { SupportService } from './support.service';

@ApiTags('support')
@Controller('support')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  createTicket(@Req() req: AuthenticatedRequest, @Body() dto: CreateSupportTicketDto) {
    return this.supportService.createTicket(req.user.sub, dto);
  }

  @Get('tickets')
  listMyTickets(@Req() req: AuthenticatedRequest) {
    return this.supportService.listMyTickets(req.user.sub);
  }
}

@ApiTags('admin')
@Controller('admin/support')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminSupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('tickets')
  listTickets(@Query('status') status?: string) {
    return this.supportService.listAllTickets(status);
  }

  @Patch('tickets/:id')
  updateTicket(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateSupportTicketDto,
  ) {
    return this.supportService.updateTicket(id, req.user.sub, dto);
  }
}
