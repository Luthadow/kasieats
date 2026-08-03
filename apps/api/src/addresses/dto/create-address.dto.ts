import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({ example: 'home' })
  @IsString()
  @IsNotEmpty()
  label!: string;

  @ApiProperty({ example: '123 Zuma Street' })
  @IsString()
  @IsNotEmpty()
  addressLine1!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiPropertyOptional({ example: 'Rustenburg' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: '0300' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({ example: -25.6544 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({ example: 27.2389 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ example: 'Gate code 1234' })
  @IsOptional()
  @IsString()
  deliveryInstructions?: string;
}
