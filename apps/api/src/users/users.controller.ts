import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@kasieats/shared';
import { UsersService } from './users.service';
import { UpdateProfileDto, CreateAddressDto, UpdateAddressDto } from './dto/users.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@GetUser('sub') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  updateProfile(@GetUser('sub') userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Get('me/addresses')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get customer saved addresses' })
  getAddresses(@GetUser('sub') userId: string) {
    return this.usersService.getAddresses(userId);
  }

  @Post('me/addresses')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Add a saved address' })
  createAddress(@GetUser('sub') userId: string, @Body() dto: CreateAddressDto) {
    return this.usersService.createAddress(userId, dto);
  }

  @Patch('me/addresses/:id')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Update a saved address' })
  updateAddress(
    @GetUser('sub') userId: string,
    @Param('id') addressId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.usersService.updateAddress(userId, addressId, dto);
  }

  @Delete('me/addresses/:id')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Delete a saved address' })
  deleteAddress(@GetUser('sub') userId: string, @Param('id') addressId: string) {
    return this.usersService.deleteAddress(userId, addressId);
  }
}
