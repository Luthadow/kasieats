import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import { OtpService } from './otp.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { VendorRegisterDto } from './dto/vendor-register.dto';
import { DriverRegisterDto } from './dto/driver-register.dto';
import { AdminLoginDto } from '../admin/dto/admin.dto';
import type { JwtPayload } from '@kasieats/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly smsService: SmsService,
    private readonly otpService: OtpService,
  ) {}

  async sendOtp(dto: SendOtpDto) {
    const phone = this.normalizePhone(dto.phone);
    const code = await this.otpService.issue(phone);

    await this.smsService.sendOtp(phone, code);

    return {
      success: true,
      message: 'OTP sent',
      phone,
      ...(this.configService.get<string>('NODE_ENV') !== 'production' && { devOtp: code }),
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const phone = this.normalizePhone(dto.phone);
    await this.otpService.verify(phone, dto.otp);

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
    const vendor = await this.prisma.vendor.findUnique({ where: { user_id: user.id } });
    const driver = await this.prisma.driver.findUnique({ where: { user_id: user.id } });

    if (user.user_type === 'customer' && !customer) {
      return {
        success: true,
        needsProfile: true,
        userId: user.id,
        phone: user.phone,
      };
    }

    const token = await this.signToken(user.id, user.phone, user.user_type as JwtPayload['userType']);

    if (user.user_type === 'vendor' && vendor) {
      return {
        success: true,
        needsProfile: false,
        token,
        user: {
          id: user.id,
          phone: user.phone,
          userType: user.user_type,
          storeName: vendor.store_name,
        },
      };
    }

    if (user.user_type === 'driver' && driver) {
      return {
        success: true,
        needsProfile: false,
        token,
        user: {
          id: user.id,
          phone: user.phone,
          userType: user.user_type,
          firstName: driver.first_name,
          lastName: driver.last_name,
        },
      };
    }

    if (user.user_type === 'admin') {
      return {
        success: true,
        needsProfile: false,
        token,
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          userType: user.user_type,
        },
      };
    }

    if (customer) {
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

    throw new UnauthorizedException('Account setup incomplete');
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

  async registerVendor(dto: VendorRegisterDto) {
    const phone = this.normalizePhone(dto.phone);
    await this.otpService.verify(phone, dto.otp);

    const existing = await this.prisma.user.findUnique({ where: { phone } });
    if (existing?.user_type === 'vendor') {
      throw new ConflictException('This phone is already registered as a vendor');
    }
    if (existing && existing.user_type !== 'customer') {
      throw new ConflictException('Phone number already in use');
    }

    const user =
      existing ??
      (await this.prisma.user.create({
        data: {
          phone,
          user_type: 'vendor',
          phone_verified: true,
          phone_verified_at: new Date(),
        },
      }));

    if (existing) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { user_type: 'vendor', phone_verified: true, phone_verified_at: new Date() },
      });
    }

    const vendor = await this.prisma.vendor.create({
      data: {
        user_id: user.id,
        store_name: dto.storeName,
        store_description: dto.storeDescription,
        store_category: dto.storeCategory,
        phone,
        address: dto.address,
        city: dto.city ?? 'Rustenburg',
        latitude: dto.latitude,
        longitude: dto.longitude,
        status: 'pending_approval',
      },
    });

    await this.prisma.menu.create({
      data: {
        vendor_id: vendor.id,
        category: 'Main',
      },
    });

    return {
      success: true,
      message: 'Vendor application submitted. An admin will review your store shortly.',
      data: {
        vendorId: vendor.id,
        storeName: vendor.store_name,
        status: vendor.status,
      },
    };
  }

  async registerDriver(dto: DriverRegisterDto) {
    const phone = this.normalizePhone(dto.phone);
    await this.otpService.verify(phone, dto.otp);

    const existing = await this.prisma.user.findUnique({ where: { phone } });
    if (existing?.user_type === 'driver') {
      throw new ConflictException('This phone is already registered as a driver');
    }
    if (existing && existing.user_type !== 'customer') {
      throw new ConflictException('Phone number already in use');
    }

    const user =
      existing ??
      (await this.prisma.user.create({
        data: {
          phone,
          user_type: 'driver',
          phone_verified: true,
          phone_verified_at: new Date(),
        },
      }));

    if (existing) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { user_type: 'driver', phone_verified: true, phone_verified_at: new Date() },
      });
    }

    const driver = await this.prisma.driver.create({
      data: {
        user_id: user.id,
        first_name: dto.firstName,
        last_name: dto.lastName,
        vehicle_type: dto.vehicleType,
        vehicle_plate: dto.vehiclePlate,
        status: 'pending_approval',
      },
    });

    return {
      success: true,
      message: 'Driver application submitted. An admin will review your profile shortly.',
      data: {
        driverId: driver.id,
        status: driver.status,
      },
    };
  }

  async adminLogin(dto: AdminLoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, user_type: 'admin' },
    });

    if (!user?.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.signToken(user.id, user.phone, 'admin');

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
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

  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('27')) return `+${digits}`;
    if (digits.startsWith('0')) return `+27${digits.slice(1)}`;
    return `+${digits}`;
  }
}
