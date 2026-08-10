import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleStoreDto {
  @ApiProperty()
  @IsBoolean()
  isOpen!: boolean;
}
