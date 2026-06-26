import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Amahle' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Nkosi' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: 'zu' })
  @IsOptional()
  @IsString()
  preferredLanguage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dietaryRestrictions?: string;
}

export class CreateAddressDto {
  @ApiProperty({ example: 'home' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ example: '123 Tlhabane Main Road' })
  @IsString()
  @IsNotEmpty()
  addressLine1: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiPropertyOptional({ example: 'Rustenburg' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: '0299' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({ example: -25.6675 })
  @IsNumber()
  @Type(() => Number)
  latitude: number;

  @ApiProperty({ example: 27.2423 })
  @IsNumber()
  @Type(() => Number)
  longitude: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryInstructions?: string;
}

export class UpdateAddressDto extends CreateAddressDto {}
