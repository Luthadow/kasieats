import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedRequest } from '../auth/types';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import { CustomersService } from './customers.service';

@ApiTags('customers')
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('customer')
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get('addresses')
  listAddresses(@Req() req: AuthenticatedRequest) {
    return this.customersService.listAddresses(req.user.sub);
  }

  @Post('addresses')
  createAddress(@Req() req: AuthenticatedRequest, @Body() dto: CreateAddressDto) {
    return this.customersService.createAddress(req.user.sub, dto);
  }

  @Patch('addresses/:id')
  updateAddress(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.customersService.updateAddress(req.user.sub, id, dto);
  }

  @Delete('addresses/:id')
  deleteAddress(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.customersService.deleteAddress(req.user.sub, id);
  }
}
