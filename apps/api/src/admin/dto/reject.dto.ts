import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RejectDto {
  @ApiPropertyOptional({ description: 'Reason for rejection / cancellation.' })
  @IsOptional()
  @IsString()
  reason?: string;
}
