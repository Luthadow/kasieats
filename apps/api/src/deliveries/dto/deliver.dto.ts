import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DeliverDto {
  @ApiPropertyOptional({
    description: 'The 4-digit delivery PIN. Required when the order has a delivery PIN.',
  })
  @IsOptional()
  @IsString()
  pin?: string;
}
