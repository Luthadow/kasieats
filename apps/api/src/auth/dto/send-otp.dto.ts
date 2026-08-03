import { IsIn, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { UserType } from '@kasieats/shared';

export class SendOtpDto {
  @ApiProperty({ example: '0761234567' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(\+?27|0)[6-8][0-9]{8}$/, {
    message: 'Enter a valid South African mobile number',
  })
  phone!: string;

  @ApiPropertyOptional({
    enum: ['customer', 'vendor', 'driver'],
    description: 'Onboarding context for a new user. Defaults to customer.',
  })
  @IsOptional()
  @IsIn(['customer', 'vendor', 'driver'])
  userType?: Exclude<UserType, 'admin'>;
}
