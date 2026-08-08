import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RequestWithdrawalDto {
  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(50)
  amount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankAccountHolder?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankCode?: string;
}

export class RejectWithdrawalDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
