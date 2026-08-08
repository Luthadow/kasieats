import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminLoginDto {
  @ApiProperty({ example: 'admin@kasieats.co.za' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Admin123!' })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class RejectApplicationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
