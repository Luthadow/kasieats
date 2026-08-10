import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class VendorRegisterDto {
  @ApiProperty({ example: '0891234567' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  otp!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  storeName!: string;

  @ApiProperty({ example: 'kota' })
  @IsString()
  @IsNotEmpty()
  storeCategory!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiPropertyOptional({ default: 'Rustenburg' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: -25.6544 })
  @IsNumber()
  latitude!: number;

  @ApiProperty({ example: 27.2389 })
  @IsNumber()
  longitude!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storeDescription?: string;
}
