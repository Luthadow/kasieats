import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { UpdateProfileDto, CreateAddressDto, UpdateAddressDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        customer: {
          include: { addresses: { orderBy: { is_default: 'desc' } } },
        },
        vendor: true,
        driver: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.user_type,
      preferredLanguage: user.preferred_language,
      emailVerified: user.email_verified,
      phoneVerified: user.phone_verified,
      status: user.status,
      createdAt: user.created_at,
      customer: user.customer,
      vendor: user.vendor,
      driver: user.driver,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { customer: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        preferred_language: dto.preferredLanguage,
      },
    });

    if (user.customer && (dto.firstName || dto.lastName || dto.dietaryRestrictions)) {
      await this.prisma.customer.update({
        where: { user_id: userId },
        data: {
          first_name: dto.firstName,
          last_name: dto.lastName,
          dietary_restrictions: dto.dietaryRestrictions,
        },
      });
    }

    return this.getProfile(userId);
  }

  async getAddresses(userId: string) {
    const customer = await this.getCustomerForUser(userId);
    return this.prisma.address.findMany({
      where: { customer_id: customer.id },
      orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }],
    });
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    const customer = await this.getCustomerForUser(userId);

    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { customer_id: customer.id },
        data: { is_default: false },
      });
    }

    return this.prisma.address.create({
      data: {
        customer_id: customer.id,
        label: dto.label,
        address_line_1: dto.addressLine1,
        address_line_2: dto.addressLine2,
        city: dto.city || 'Rustenburg',
        postal_code: dto.postalCode,
        latitude: dto.latitude,
        longitude: dto.longitude,
        is_default: dto.isDefault ?? false,
        delivery_instructions: dto.deliveryInstructions,
      },
    });
  }

  async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto) {
    const customer = await this.getCustomerForUser(userId);

    const address = await this.prisma.address.findFirst({
      where: { id: addressId, customer_id: customer.id },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { customer_id: customer.id },
        data: { is_default: false },
      });
    }

    return this.prisma.address.update({
      where: { id: addressId },
      data: {
        label: dto.label,
        address_line_1: dto.addressLine1,
        address_line_2: dto.addressLine2,
        city: dto.city,
        postal_code: dto.postalCode,
        latitude: dto.latitude,
        longitude: dto.longitude,
        is_default: dto.isDefault,
        delivery_instructions: dto.deliveryInstructions,
      },
    });
  }

  async deleteAddress(userId: string, addressId: string) {
    const customer = await this.getCustomerForUser(userId);

    const address = await this.prisma.address.findFirst({
      where: { id: addressId, customer_id: customer.id },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    await this.prisma.address.delete({ where: { id: addressId } });
    return { message: 'Address deleted successfully' };
  }

  private async getCustomerForUser(userId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { user_id: userId },
    });

    if (!customer) {
      throw new ForbiddenException('Customer profile required');
    }

    return customer;
  }
}
