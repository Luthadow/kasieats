import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import type { JwtPayload } from '@kasieats/shared';

const DEV_OTP = '123456';

@Injectable()
export class AuthService {
  private otpStore = new Map<string, { code: string; expiresAt: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async sendOtp(dto: SendOtpDto) {
    const phone = this.normalizePhone(dto.phone);
    const code = process.env.NODE_ENV === 'production' ? this.generateOtp() : DEV_OTP;

    this.otpStore.set(phone, {
      code,
      expiresAt: Date.now() + 60_000,
    });

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
    const stored = this.otpStore.get(phone);

    if (!stored || stored.expiresAt < Date.now()) {
      throw new UnauthorizedException('OTP expired. Request a new code.');
    }

    if (stored.code !== dto.otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    this.otpStore.delete(phone);

    let user = await this.prisma.user.findUnique({ where: { phone } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone,
          user_type: 'customer',
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

    const customer = await this.prisma.customer.findUnique({ where: { user_id: user.id } });
    const needsProfile = !customer;

    if (needsProfile) {
      return {
        success: true,
        needsProfile: true,
        userId: user.id,
        phone: user.phone,
      };
    }

    const token = await this.signToken(user.id, user.phone, user.user_type as JwtPayload['userType']);

    return {
      success: true,
      needsProfile: false,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        userType: user.user_type,
        firstName: customer!.first_name,
        lastName: customer!.last_name,
      },
    };
  }

  async completeProfile(userId: string, dto: CompleteProfileDto) {
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

    const token = await this.signToken(user.id, user.phone, user.user_type as JwtPayload['userType']);

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
