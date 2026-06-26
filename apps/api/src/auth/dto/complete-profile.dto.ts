import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteProfileDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ example: 'Amahle' })
  @IsString()
  @MinLength(2)
  firstName!: string;

  @ApiProperty({ example: 'Nkosi' })
  @IsString()
  @MinLength(2)
  lastName!: string;
}
