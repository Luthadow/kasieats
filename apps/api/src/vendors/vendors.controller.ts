import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@kasieats/shared';
import { VendorsService } from './vendors.service';
import {
  UpdateVendorDto,
  VendorQueryDto,
  ApproveVendorDto,
  CreateMenuItemDto,
  UpdateMenuItemDto,
  CreateMenuCategoryDto,
} from './dto/vendors.dto';
import { Public, Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';

@ApiTags('vendors')
@Controller('vendors')
export class VendorsController {
  constructor(private vendorsService: VendorsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Discover nearby vendors' })
  findAll(@Query() query: VendorQueryDto) {
    return this.vendorsService.findAll(query);
  }

  @Get('me/store')
  @Roles(UserRole.VENDOR_OWNER, UserRole.VENDOR_STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my vendor store profile' })
  getMyVendor(@GetUser('sub') userId: string) {
    return this.vendorsService.getMyVendor(userId);
  }

  @Patch('me/store')
  @Roles(UserRole.VENDOR_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update my vendor store profile' })
  updateMyVendor(@GetUser('sub') userId: string, @Body() dto: UpdateVendorDto) {
    return this.vendorsService.updateMyVendor(userId, dto);
  }

  @Post('me/menu')
  @Roles(UserRole.VENDOR_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a menu category' })
  createMenuCategory(@GetUser('sub') userId: string, @Body() dto: CreateMenuCategoryDto) {
    return this.vendorsService.createMenuCategory(userId, dto);
  }

  @Post('me/menu/:menuId/items')
  @Roles(UserRole.VENDOR_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add item to menu category' })
  createMenuItem(
    @GetUser('sub') userId: string,
    @Param('menuId') menuId: string,
    @Body() dto: CreateMenuItemDto,
  ) {
    return this.vendorsService.createMenuItem(userId, menuId, dto);
  }

  @Patch('me/menu/items/:itemId')
  @Roles(UserRole.VENDOR_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a menu item' })
  updateMenuItem(
    @GetUser('sub') userId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateMenuItemDto,
  ) {
    return this.vendorsService.updateMenuItem(userId, itemId, dto);
  }

  @Delete('me/menu/items/:itemId')
  @Roles(UserRole.VENDOR_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a menu item' })
  deleteMenuItem(@GetUser('sub') userId: string, @Param('itemId') itemId: string) {
    return this.vendorsService.deleteMenuItem(userId, itemId);
  }

  @Get('admin/pending')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List vendors pending approval' })
  getPendingVendors() {
    return this.vendorsService.getPendingVendors();
  }

  @Patch('admin/:id/approve')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve or reject a vendor' })
  approveVendor(
    @GetUser('sub') adminId: string,
    @Param('id') vendorId: string,
    @Body() dto: ApproveVendorDto,
  ) {
    return this.vendorsService.approveVendor(vendorId, adminId, dto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get vendor details with menu' })
  findOne(@Param('id') id: string) {
    return this.vendorsService.findOne(id);
  }
}
