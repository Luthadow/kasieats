import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum VendorOrderAction {
  ACCEPT = 'accept',
  REJECT = 'reject',
  MARK_READY = 'mark_ready',
}

export class UpdateVendorOrderStatusDto {
  @ApiProperty({ enum: VendorOrderAction })
  @IsEnum(VendorOrderAction)
  action!: VendorOrderAction;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
