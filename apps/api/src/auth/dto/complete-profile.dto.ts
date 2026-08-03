import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteProfileDto {
  @ApiProperty({
    description: 'Short-lived profile token issued by verify-otp when needsProfile is true.',
  })
  @IsString()
  @IsNotEmpty()
  profileToken!: string;

  @ApiProperty({ example: 'Amahle' })
  @IsString()
  @MinLength(2)
  firstName!: string;

  @ApiProperty({ example: 'Nkosi' })
  @IsString()
  @MinLength(2)
  lastName!: string;

  @ApiPropertyOptional({ example: 'amahle@example.com' })
  @IsOptional()
  @IsString()
  email?: string;
}
