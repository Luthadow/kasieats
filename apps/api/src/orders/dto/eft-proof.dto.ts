import { IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EftProofDto {
  @ApiProperty({ description: 'URL / link to the uploaded EFT proof of payment.' })
  @IsString()
  @IsNotEmpty()
  proofUrl!: string;

  @ApiPropertyOptional({ description: 'EFT payment reference used by the customer.' })
  @IsOptional()
  @IsString()
  reference?: string;
}
