import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'admin@kasieats.co.za',
    description: 'Email address or phone number of the account.',
  })
  @IsString()
  @IsNotEmpty()
  phoneOrEmail!: string;

  @ApiProperty({ example: 'Admin123!' })
  @IsString()
  @MinLength(6)
  password!: string;
}
