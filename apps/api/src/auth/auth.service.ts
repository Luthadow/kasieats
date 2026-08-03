import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { OTP_EXPIRY_SECONDS } from '@kasieats/shared';
import type { JwtPayload, UserType } from '@kasieats/shared';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { LoginDto } from './dto/login.dto';

const DEV_OTP = '123456';

interface OtpEntry {
  code: string;
  userType: Exclude<UserType, 'admin'>;
}

interface ProfileTokenPayload {
  sub: string;
  phone: string;
  type: 'profile';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async sendOtp(dto: SendOtpDto) {
    const phone = this.normalizePhone(dto.phone);
    const code = process.env.NODE_ENV === 'production' ? this.generateOtp() : DEV_OTP;
    const entry: OtpEntry = { code, userType: dto.userType ?? 'customer' };

    await this.redis.setex(this.otpKey(phone), OTP_EXPIRY_SECONDS, JSON.stringify(entry));

    // TODO: Integrate SMS provider (Twilio / Africa's Talking)
    return {
      success: true,
      message: 'OTP sent',
      phone,
      ...(process.env.NODE_ENV !== 'production' && { devOtp: code }),
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const phone = this.normalizePhone(dto.phone);
    const raw = await this.redis.get(this.otpKey(phone));

    if (!raw) {
      throw new UnauthorizedException('OTP expired. Request a new code.');
    }

    const stored = this.parseOtpEntry(raw);

    if (stored.code !== dto.otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    await this.redis.del(this.otpKey(phone));

    const onboardingType = dto.userType ?? stored.userType ?? 'customer';

    let user = await this.prisma.user.findUnique({ where: { phone } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone,
          user_type: onboardingType,
          phone_verified: true,
          phone_verified_at: new Date(),
        },
      });
    } else if (!user.phone_verified) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { phone_verified: true, phone_verified_at: new Date() },
      });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    // Vendor / driver / admin accounts authenticate straight to a JWT without
    // being forced through the customer profile flow.
    if (user.user_type !== 'customer') {
      const token = await this.signToken(
        user.id,
        user.phone,
        user.user_type as JwtPayload['userType'],
      );
      return {
        success: true,
        needsProfile: false,
        token,
        user: {
          id: user.id,
          phone: user.phone,
          userType: user.user_type,
        },
      };
    }

    const customer = await this.prisma.customer.findUnique({ where: { user_id: user.id } });

    if (!customer) {
      const profileToken = await this.signProfileToken(user.id, user.phone);
      return {
        success: true,
        needsProfile: true,
        profileToken,
        phone: user.phone,
      };
    }

    const token = await this.signToken(
      user.id,
      user.phone,
      user.user_type as JwtPayload['userType'],
    );

    return {
      success: true,
      needsProfile: false,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        userType: user.user_type,
        firstName: customer.first_name,
        lastName: customer.last_name,
      },
    };
  }

  async completeProfile(dto: CompleteProfileDto) {
    const userId = await this.verifyProfileToken(dto.profileToken);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const customer = await this.prisma.customer.upsert({
      where: { user_id: userId },
      update: {
        first_name: dto.firstName,
        last_name: dto.lastName,
      },
      create: {
        user_id: userId,
        first_name: dto.firstName,
        last_name: dto.lastName,
      },
    });

    if (dto.email) {
      await this.prisma.user
        .update({ where: { id: userId }, data: { email: dto.email } })
        .catch(() => undefined);
    }

    const token = await this.signToken(
      user.id,
      user.phone,
      user.user_type as JwtPayload['userType'],
    );

    return {
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        userType: user.user_type,
        firstName: customer.first_name,
        lastName: customer.last_name,
      },
    };
  }

  async login(dto: LoginDto) {
    const identifier = dto.phoneOrEmail.trim();
    const isEmail = identifier.includes('@');
    const where = isEmail
      ? { email: identifier.toLowerCase() }
      : { phone: this.normalizePhone(identifier) };

    const user = await this.prisma.user.findUnique({ where });

    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is not active');
    }

    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    const token = await this.signToken(
      user.id,
      user.phone,
      user.user_type as JwtPayload['userType'],
    );

    return {
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        userType: user.user_type,
      },
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { customer: true, vendor: true, driver: true },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      userType: user.user_type,
      customer: user.customer,
      vendor: user.vendor,
      driver: user.driver,
    };
  }

  private async signToken(userId: string, phone: string, userType: JwtPayload['userType']) {
    const payload: JwtPayload = { sub: userId, phone, userType };
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '7d'),
    });
  }

  private async signProfileToken(userId: string, phone: string) {
    const payload: ProfileTokenPayload = { sub: userId, phone, type: 'profile' };
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '15m',
    });
  }

  private async verifyProfileToken(token: string): Promise<string> {
    try {
      const payload = await this.jwtService.verifyAsync<ProfileTokenPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      if (payload.type !== 'profile' || !payload.sub) {
        throw new Error('Invalid profile token');
      }
      return payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid or expired profile token');
    }
  }

  private otpKey(phone: string): string {
    return `otp:${phone}`;
  }

  private parseOtpEntry(raw: string): OtpEntry {
    try {
      const parsed = JSON.parse(raw) as Partial<OtpEntry>;
      if (parsed && typeof parsed.code === 'string') {
        return { code: parsed.code, userType: parsed.userType ?? 'customer' };
      }
    } catch {
      // Legacy plain-string OTP value.
    }
    return { code: raw, userType: 'customer' };
  }

  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('27')) return `+${digits}`;
    if (digits.startsWith('0')) return `+27${digits.slice(1)}`;
    return `+${digits}`;
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
