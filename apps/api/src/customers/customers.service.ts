import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async listAddresses(customerUserId: string) {
    const customer = await this.getCustomer(customerUserId);

    const addresses = await this.prisma.address.findMany({
      where: { customer_id: customer.id },
      orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }],
    });

    return {
      success: true,
      data: addresses.map((a) => this.formatAddress(a)),
    };
  }

  async createAddress(customerUserId: string, dto: CreateAddressDto) {
    const customer = await this.getCustomer(customerUserId);

    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { customer_id: customer.id },
        data: { is_default: false },
      });
    }

    const isFirst = (await this.prisma.address.count({ where: { customer_id: customer.id } })) === 0;

    const address = await this.prisma.address.create({
      data: {
        customer_id: customer.id,
        label: dto.label,
        address_line_1: dto.addressLine1,
        address_line_2: dto.addressLine2,
        city: dto.city ?? 'Rustenburg',
        postal_code: dto.postalCode,
        latitude: dto.latitude,
        longitude: dto.longitude,
        delivery_instructions: dto.deliveryInstructions,
        is_default: dto.isDefault ?? isFirst,
      },
    });

    return { success: true, data: this.formatAddress(address) };
  }

  async updateAddress(customerUserId: string, addressId: string, dto: UpdateAddressDto) {
    const customer = await this.getCustomer(customerUserId);
    await this.getAddressForCustomer(customer.id, addressId);

    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { customer_id: customer.id },
        data: { is_default: false },
      });
    }

    const address = await this.prisma.address.update({
      where: { id: addressId },
      data: {
        ...(dto.label !== undefined ? { label: dto.label } : {}),
        ...(dto.addressLine1 !== undefined ? { address_line_1: dto.addressLine1 } : {}),
        ...(dto.addressLine2 !== undefined ? { address_line_2: dto.addressLine2 } : {}),
        ...(dto.city !== undefined ? { city: dto.city } : {}),
        ...(dto.postalCode !== undefined ? { postal_code: dto.postalCode } : {}),
        ...(dto.latitude !== undefined ? { latitude: dto.latitude } : {}),
        ...(dto.longitude !== undefined ? { longitude: dto.longitude } : {}),
        ...(dto.deliveryInstructions !== undefined
          ? { delivery_instructions: dto.deliveryInstructions }
          : {}),
        ...(dto.isDefault !== undefined ? { is_default: dto.isDefault } : {}),
      },
    });

    return { success: true, data: this.formatAddress(address) };
  }

  async deleteAddress(customerUserId: string, addressId: string) {
    const customer = await this.getCustomer(customerUserId);
    await this.getAddressForCustomer(customer.id, addressId);

    await this.prisma.address.delete({ where: { id: addressId } });

    return { success: true };
  }

  private async getCustomer(userId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { user_id: userId } });
    if (!customer) {
      throw new ForbiddenException('Complete your profile before managing addresses');
    }
    return customer;
  }

  private async getAddressForCustomer(customerId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, customer_id: customerId },
    });
    if (!address) {
      throw new NotFoundException('Address not found');
    }
    return address;
  }

  private formatAddress(a: {
    id: string;
    label: string;
    address_line_1: string;
    address_line_2: string | null;
    city: string;
    postal_code: string | null;
    latitude: { toString(): string } | number;
    longitude: { toString(): string } | number;
    is_default: boolean;
    delivery_instructions: string | null;
  }) {
    return {
      id: a.id,
      label: a.label,
      addressLine1: a.address_line_1,
      addressLine2: a.address_line_2,
      city: a.city,
      postalCode: a.postal_code,
      latitude: Number(a.latitude),
      longitude: Number(a.longitude),
      isDefault: a.is_default,
      deliveryInstructions: a.delivery_instructions,
      formatted: `${a.address_line_1}, ${a.city}`,
    };
  }
}
