import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ example: '0761234567' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(\+?27|0)[6-8][0-9]{8}$/, {
    message: 'Enter a valid South African mobile number',
  })
  phone!: string;
}
