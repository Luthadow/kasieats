import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '@kasieats/shared';

export class RegisterDto {
  @ApiProperty({ example: 'amahle@example.co.za' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+27829876543' })
  @IsPhoneNumber('ZA')
  phone: string;

  @ApiProperty({ example: 'SecurePass123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.CUSTOMER })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ example: 'Amahle' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Nkosi' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  lastName?: string;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  preferredLanguage?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'amahle@example.co.za', description: 'Email or phone number' })
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class SendOtpDto {
  @ApiProperty({ example: '+27829876543' })
  @IsPhoneNumber('ZA')
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+27829876543' })
  @IsPhoneNumber('ZA')
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  otp: string;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  expiresIn: number;

  @ApiProperty()
  user: {
    id: string;
    email: string;
    phone: string;
    role: string;
    preferredLanguage: string;
  };
}
