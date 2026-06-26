import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateVendorDto {
  @ApiPropertyOptional({ example: "Mama Lindiwe's Shisanyama" })
  @IsOptional()
  @IsString()
  storeName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storeDescription?: string;

  @ApiPropertyOptional({ example: 'shisanyama' })
  @IsOptional()
  @IsString()
  storeCategory?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  operatingHours?: Record<string, { open: string; close: string }>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isOpenNow?: boolean;
}

export class VendorQueryDto {
  @ApiPropertyOptional({ example: 'Rustenburg' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'shisanyama' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: -25.6675 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({ example: 27.2423 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;

  @ApiPropertyOptional({ example: 10, description: 'Search radius in km' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  radiusKm?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ example: 'kota' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class ApproveVendorDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  approved: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreateMenuItemDto {
  @ApiProperty({ example: 'Full Plate Braai' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 85.0 })
  @IsNumber()
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({ example: 'Plates' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  preparationTimeMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

export class UpdateMenuItemDto extends CreateMenuItemDto {}

export class CreateMenuCategoryDto {
  @ApiProperty({ example: 'Main Menu' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({ type: [CreateMenuItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMenuItemDto)
  items?: CreateMenuItemDto[];
}
