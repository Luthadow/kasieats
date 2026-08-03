import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class OrderExtraDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  price!: number;
}

class CreateOrderItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  menuItemId!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({ type: [OrderExtraDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderExtraDto)
  extras?: OrderExtraDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialInstructions?: string;
}

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  vendorId!: string;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  deliveryAddress!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  deliveryLatitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  deliveryLongitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialInstructions?: string;

  // MTHURA launch model: the customer pays the vendor via EFT and uploads proof.
  // 'eft' is the default. 'pay_vendor_directly' / 'cash' are legacy aliases.
  @ApiPropertyOptional({ enum: ['eft', 'pay_vendor_directly', 'cash'] })
  @IsOptional()
  @IsEnum(['eft', 'pay_vendor_directly', 'cash'])
  paymentMethod?: 'eft' | 'pay_vendor_directly' | 'cash';
}
