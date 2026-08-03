import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const customer = await this.getCustomer(userId);
    const addresses = await this.prisma.address.findMany({
      where: { customer_id: customer.id },
      orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }],
    });
    return { success: true, data: addresses.map((a) => this.format(a)) };
  }

  async create(userId: string, dto: CreateAddressDto) {
    const customer = await this.getCustomer(userId);

    const existingCount = await this.prisma.address.count({
      where: { customer_id: customer.id },
    });
    const makeDefault = dto.isDefault === true || existingCount === 0;

    if (makeDefault) {
      await this.prisma.address.updateMany({
        where: { customer_id: customer.id },
        data: { is_default: false },
      });
    }

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
        is_default: makeDefault,
        delivery_instructions: dto.deliveryInstructions,
      },
    });

    return { success: true, data: this.format(address) };
  }

  async update(userId: string, id: string, dto: UpdateAddressDto) {
    const customer = await this.getCustomer(userId);
    await this.getOwnedAddress(customer.id, id);

    if (dto.isDefault === true) {
      await this.prisma.address.updateMany({
        where: { customer_id: customer.id },
        data: { is_default: false },
      });
    }

    const address = await this.prisma.address.update({
      where: { id },
      data: {
        ...(dto.label !== undefined && { label: dto.label }),
        ...(dto.addressLine1 !== undefined && { address_line_1: dto.addressLine1 }),
        ...(dto.addressLine2 !== undefined && { address_line_2: dto.addressLine2 }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.postalCode !== undefined && { postal_code: dto.postalCode }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
        ...(dto.isDefault !== undefined && { is_default: dto.isDefault }),
        ...(dto.deliveryInstructions !== undefined && {
          delivery_instructions: dto.deliveryInstructions,
        }),
      },
    });

    return { success: true, data: this.format(address) };
  }

  async remove(userId: string, id: string) {
    const customer = await this.getCustomer(userId);
    const address = await this.getOwnedAddress(customer.id, id);

    await this.prisma.address.delete({ where: { id } });

    if (address.is_default) {
      const next = await this.prisma.address.findFirst({
        where: { customer_id: customer.id },
        orderBy: { created_at: 'desc' },
      });
      if (next) {
        await this.prisma.address.update({
          where: { id: next.id },
          data: { is_default: true },
        });
      }
    }

    return { success: true, message: 'Address deleted' };
  }

  async setDefault(userId: string, id: string) {
    const customer = await this.getCustomer(userId);
    await this.getOwnedAddress(customer.id, id);

    await this.prisma.address.updateMany({
      where: { customer_id: customer.id },
      data: { is_default: false },
    });

    const address = await this.prisma.address.update({
      where: { id },
      data: { is_default: true },
    });

    return { success: true, data: this.format(address) };
  }

  private async getCustomer(userId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { user_id: userId } });
    if (!customer) {
      throw new ForbiddenException('Complete your customer profile first');
    }
    return customer;
  }

  private async getOwnedAddress(customerId: string, id: string) {
    const address = await this.prisma.address.findFirst({
      where: { id, customer_id: customerId },
    });
    if (!address) {
      throw new NotFoundException('Address not found');
    }
    return address;
  }

  private format(address: {
    id: string;
    label: string;
    address_line_1: string;
    address_line_2: string | null;
    city: string;
    postal_code: string | null;
    latitude: unknown;
    longitude: unknown;
    is_default: boolean;
    delivery_instructions: string | null;
  }) {
    return {
      id: address.id,
      label: address.label,
      addressLine1: address.address_line_1,
      addressLine2: address.address_line_2,
      city: address.city,
      postalCode: address.postal_code,
      latitude: Number(address.latitude),
      longitude: Number(address.longitude),
      isDefault: address.is_default,
      deliveryInstructions: address.delivery_instructions,
    };
  }
}
