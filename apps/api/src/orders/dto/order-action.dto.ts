import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class OrderActionDto {
  @ApiPropertyOptional({ description: 'Optional reason for cancellation/rejection.' })
  @IsOptional()
  @IsString()
  reason?: string;
}
