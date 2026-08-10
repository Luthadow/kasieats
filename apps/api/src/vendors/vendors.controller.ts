import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VendorsService } from './vendors.service';
import { ListVendorsQueryDto } from './dto/list-vendors-query.dto';

@ApiTags('vendors')
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  list(@Query() query: ListVendorsQueryDto) {
    return this.vendorsService.listVendors(query);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.vendorsService.getVendor(id);
  }
}
