import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PaymentProvider {
  OZOW = 'ozow',
  YOCO = 'yoco',
}

export class InitiatePaymentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @ApiProperty({ enum: PaymentProvider })
  @IsEnum(PaymentProvider)
  provider!: PaymentProvider;
}

export class ConfirmPaymentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  paymentId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transactionReference?: string;
}

export class PaymentWebhookDto {
  @ApiProperty()
  @IsString()
  transactionReference!: string;

  @ApiProperty()
  @IsString()
  status!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  provider?: string;
}
