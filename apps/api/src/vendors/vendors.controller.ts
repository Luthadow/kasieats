import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { VendorsService } from './vendors.service';
import { ListVendorsQueryDto } from './dto/list-vendors-query.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('vendors')
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Public()
  @Get()
  list(@Query() query: ListVendorsQueryDto) {
    return this.vendorsService.listVendors(query);
  }

  // Vendor self-service routes must be declared before the ":id" route so that
  // "me" is not captured as a vendor id.
  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendor')
  getMe(@CurrentUser('sub') userId: string) {
    return this.vendorsService.getMyVendor(userId);
  }

  @Patch('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendor')
  updateMe(@CurrentUser('sub') userId: string, @Body() dto: UpdateVendorDto) {
    return this.vendorsService.updateMyVendor(userId, dto);
  }

  @Get('me/menu')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendor')
  getMyMenu(@CurrentUser('sub') userId: string) {
    return this.vendorsService.getMyMenu(userId);
  }

  @Post('me/menu-items')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendor')
  createMenuItem(@CurrentUser('sub') userId: string, @Body() dto: CreateMenuItemDto) {
    return this.vendorsService.createMenuItem(userId, dto);
  }

  @Patch('me/menu-items/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendor')
  updateMenuItem(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMenuItemDto,
  ) {
    return this.vendorsService.updateMenuItem(userId, id, dto);
  }

  @Public()
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.vendorsService.getVendor(id);
  }
}
