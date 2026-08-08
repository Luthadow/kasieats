import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class DriverRegisterDto {
  @ApiProperty({ example: '0861234568' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  otp!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ enum: ['bicycle', 'motorbike', 'car'] })
  @IsIn(['bicycle', 'motorbike', 'car'])
  vehicleType!: string;

  @ApiProperty({ example: 'NW 123 GP' })
  @IsString()
  @IsNotEmpty()
  vehiclePlate!: string;
}
