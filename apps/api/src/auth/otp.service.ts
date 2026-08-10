import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';

const DEV_OTP = '123456';
const OTP_TTL_SECONDS = 300;

@Injectable()
export class OtpService {
  constructor(
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async issue(phone: string): Promise<string> {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    const code = isProduction ? this.generateOtp() : DEV_OTP;
    await this.redis.set(this.key(phone), code, OTP_TTL_SECONDS);
    return code;
  }

  async verify(phone: string, otp: string) {
    const stored = await this.redis.get(this.key(phone));
    if (!stored) {
      throw new UnauthorizedException('OTP expired. Request a new code.');
    }
    if (stored !== otp) {
      throw new UnauthorizedException('Invalid OTP');
    }
    await this.redis.del(this.key(phone));
  }

  private key(phone: string) {
    return `otp:${phone}`;
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
