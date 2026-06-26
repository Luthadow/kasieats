import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { randomBytes, createHash } from 'crypto';
import { UserRole } from '@kasieats/shared';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly otpFallback = new Map<string, { otp: string; expires: number }>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redis: RedisService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
    });

    if (existing) {
      throw new ConflictException('Email or phone already registered');
    }

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        password_hash: passwordHash,
        user_type: dto.role,
        preferred_language: dto.preferredLanguage || 'en',
        ...(dto.role === UserRole.CUSTOMER && {
          customer: {
            create: {
              first_name: dto.firstName || 'Customer',
              last_name: dto.lastName || '',
            },
          },
        }),
        ...(dto.role === UserRole.VENDOR_OWNER && {
          vendor: {
            create: {
              store_name: `${dto.firstName || 'My'} Store`,
              store_category: 'takeaway',
              phone: dto.phone,
              address: 'Pending address update',
              latitude: -25.6675,
              longitude: 27.2423,
              status: 'pending_approval',
            },
          },
        }),
        ...(dto.role === UserRole.DRIVER && {
          driver: {
            create: {
              first_name: dto.firstName || 'Driver',
              last_name: dto.lastName || '',
              vehicle_type: 'motorcycle',
              status: 'pending_approval',
            },
          },
        }),
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.phone, dto.role);

    return {
      ...tokens,
      user: this.formatUser(user),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.identifier }, { phone: dto.identifier }],
        status: 'active',
      },
    });

    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await argon2.verify(user.password_hash, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.phone,
      user.user_type as UserRole,
    );

    return {
      ...tokens,
      user: this.formatUser(user),
    };
  }

  async refreshToken(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);

    const stored = await this.prisma.refreshToken.findFirst({
      where: {
        token_hash: tokenHash,
        revoked_at: null,
        expires_at: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!stored) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked_at: new Date() },
    });

    const tokens = await this.generateTokens(
      stored.user.id,
      stored.user.email,
      stored.user.phone,
      stored.user.user_type as UserRole,
    );

    return tokens;
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { user_id: userId, token_hash: tokenHash },
        data: { revoked_at: new Date() },
      });
    } else {
      await this.prisma.refreshToken.updateMany({
        where: { user_id: userId, revoked_at: null },
        data: { revoked_at: new Date() },
      });
    }

    return { message: 'Logged out successfully' };
  }

  async sendOtp(phone: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const ttl = (parseInt(this.configService.get('OTP_EXPIRY_MINUTES') || '10', 10) || 10) * 60;

    try {
      await this.redis.set(`otp:${phone}`, otp, ttl);
    } catch {
      this.otpFallback.set(phone, { otp, expires: Date.now() + ttl * 1000 });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV OTP] ${phone}: ${otp}`);
    }

    return { message: 'OTP sent successfully', ...(process.env.NODE_ENV === 'development' && { otp }) };
  }

  async verifyOtp(phone: string, otp: string) {
    let storedOtp: string | null = null;

    try {
      storedOtp = await this.redis.get(`otp:${phone}`);
    } catch {
      const fallback = this.otpFallback.get(phone);
      if (fallback && fallback.expires > Date.now()) {
        storedOtp = fallback.otp;
      }
    }

    if (!storedOtp || storedOtp !== otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.redis.del(`otp:${phone}`);
    this.otpFallback.delete(phone);

    await this.prisma.user.updateMany({
      where: { phone },
      data: { phone_verified: true, phone_verified_at: new Date() },
    });

    return { message: 'Phone verified successfully', verified: true };
  }

  private async generateTokens(userId: string, email: string, phone: string, role: UserRole) {
    const payload = { sub: userId, email, phone, role };

    const accessExpiry = this.configService.get('JWT_ACCESS_EXPIRY') || '15m';
    const refreshExpiry = this.configService.get('JWT_REFRESH_EXPIRY') || '7d';

    const accessToken = this.jwtService.sign(payload, { expiresIn: accessExpiry });
    const refreshToken = randomBytes(64).toString('hex');

    const refreshExpiryMs = this.parseExpiry(refreshExpiry);
    await this.prisma.refreshToken.create({
      data: {
        user_id: userId,
        token_hash: this.hashToken(refreshToken),
        expires_at: new Date(Date.now() + refreshExpiryMs),
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpiry(accessExpiry) / 1000,
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 15 * 60 * 1000;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 15 * 60 * 1000;
    }
  }

  private formatUser(user: { id: string; email: string; phone: string; user_type: string; preferred_language: string }) {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.user_type,
      preferredLanguage: user.preferred_language,
    };
  }
}
