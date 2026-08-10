import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedRequest } from '../auth/types';
import { CreatePromotionDto, ValidatePromoDto } from './dto/promotion.dto';
import { PromotionsService } from './promotions.service';

@ApiTags('promotions')
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async validate(@Req() req: AuthenticatedRequest, @Body() dto: ValidatePromoDto) {
    const data = await this.promotionsService.validateForUser(req.user.sub, dto);
    return { success: true, data };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  list() {
    return this.promotionsService.listPromotions();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreatePromotionDto) {
    return this.promotionsService.createPromotion(req.user.sub, dto);
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  deactivate(@Param('id') id: string) {
    return this.promotionsService.deactivatePromotion(id);
  }
}
