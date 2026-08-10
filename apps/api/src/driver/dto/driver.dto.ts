import { IsBoolean, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DriverDeliveryAction {
  COLLECT = 'collect',
  START_DELIVERY = 'start_delivery',
  COMPLETE = 'complete',
}

export class UpdateDriverDeliveryDto {
  @ApiProperty({ enum: DriverDeliveryAction })
  @IsEnum(DriverDeliveryAction)
  action!: DriverDeliveryAction;
}

export class UpdateDriverLocationDto {
  @ApiProperty()
  @IsNumber()
  latitude!: number;

  @ApiProperty()
  @IsNumber()
  longitude!: number;
}

export class UpdateDriverStatusDto {
  @ApiProperty()
  @IsBoolean()
  isOnline!: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;
}
