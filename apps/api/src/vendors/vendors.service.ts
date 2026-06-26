import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@kasieats/db';
import { VendorStatus } from '@kasieats/shared';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  UpdateVendorDto,
  VendorQueryDto,
  ApproveVendorDto,
  CreateMenuItemDto,
  UpdateMenuItemDto,
  CreateMenuCategoryDto,
} from './dto/vendors.dto';

@Injectable()
export class VendorsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: VendorQueryDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 50);
    const skip = (page - 1) * limit;

    const where: Prisma.VendorWhereInput = {
      status: VendorStatus.APPROVED,
      ...(query.city && { city: query.city }),
      ...(query.category && { store_category: query.category }),
      ...(query.search && {
        OR: [
          { store_name: { contains: query.search, mode: 'insensitive' } },
          { store_description: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [vendors, total] = await Promise.all([
      this.prisma.vendor.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ is_open_now: 'desc' }, { average_rating: 'desc' }],
        select: {
          id: true,
          store_name: true,
          store_description: true,
          store_category: true,
          logo_url: true,
          banner_url: true,
          address: true,
          city: true,
          latitude: true,
          longitude: true,
          is_open_now: true,
          average_rating: true,
          rating_count: true,
          operating_hours: true,
        },
      }),
      this.prisma.vendor.count({ where }),
    ]);

    let items = vendors;

    if (query.latitude && query.longitude) {
      items = vendors
        .map((vendor) => ({
          ...vendor,
          distanceKm: this.haversineDistance(
            query.latitude!,
            query.longitude!,
            Number(vendor.latitude),
            Number(vendor.longitude),
          ),
        }))
        .filter((v) => !query.radiusKm || v.distanceKm <= query.radiusKm)
        .sort((a, b) => a.distanceKm - b.distanceKm);
    }

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(vendorId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        menus: {
          include: {
            items: {
              where: { is_available: true },
              orderBy: { display_order: 'asc' },
            },
          },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    if (vendor.status !== VendorStatus.APPROVED) {
      throw new NotFoundException('Vendor not found');
    }

    return vendor;
  }

  async getMyVendor(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { user_id: userId },
      include: {
        menus: {
          include: {
            items: { orderBy: { display_order: 'asc' } },
          },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    return vendor;
  }

  async updateMyVendor(userId: string, dto: UpdateVendorDto) {
    const vendor = await this.getMyVendor(userId);

    return this.prisma.vendor.update({
      where: { id: vendor.id },
      data: {
        store_name: dto.storeName,
        store_description: dto.storeDescription,
        store_category: dto.storeCategory,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
        operating_hours: dto.operatingHours,
        is_open_now: dto.isOpenNow,
      },
    });
  }

  async approveVendor(vendorId: string, adminId: string, dto: ApproveVendorDto) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return this.prisma.vendor.update({
      where: { id: vendorId },
      data: {
        status: dto.approved ? VendorStatus.APPROVED : VendorStatus.REJECTED,
        approval_reason_if_rejected: dto.approved ? null : dto.reason,
        approved_at: dto.approved ? new Date() : null,
        approved_by_admin_id: dto.approved ? adminId : null,
      },
    });
  }

  async getPendingVendors() {
    return this.prisma.vendor.findMany({
      where: { status: VendorStatus.PENDING_APPROVAL },
      include: { user: { select: { email: true, phone: true, created_at: true } } },
      orderBy: { created_at: 'asc' },
    });
  }

  async createMenuCategory(userId: string, dto: CreateMenuCategoryDto) {
    const vendor = await this.getMyVendor(userId);

    const menu = await this.prisma.menu.create({
      data: {
        vendor_id: vendor.id,
        category: dto.category,
        ...(dto.items?.length && {
          items: {
            create: dto.items.map((item, index) => ({
              vendor_id: vendor.id,
              name: item.name,
              description: item.description,
              category: item.category,
              price: item.price,
              image_url: item.imageUrl,
              preparation_time_minutes: item.preparationTimeMinutes || 15,
              is_available: item.isAvailable ?? true,
              display_order: index,
            })),
          },
        }),
      },
      include: { items: true },
    });

    return menu;
  }

  async createMenuItem(userId: string, menuId: string, dto: CreateMenuItemDto) {
    const vendor = await this.getMyVendor(userId);

    const menu = await this.prisma.menu.findFirst({
      where: { id: menuId, vendor_id: vendor.id },
    });

    if (!menu) {
      throw new NotFoundException('Menu category not found');
    }

    return this.prisma.menuItem.create({
      data: {
        menu_id: menuId,
        vendor_id: vendor.id,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        price: dto.price,
        image_url: dto.imageUrl,
        preparation_time_minutes: dto.preparationTimeMinutes || 15,
        is_available: dto.isAvailable ?? true,
      },
    });
  }

  async updateMenuItem(userId: string, itemId: string, dto: UpdateMenuItemDto) {
    const vendor = await this.getMyVendor(userId);

    const item = await this.prisma.menuItem.findFirst({
      where: { id: itemId, vendor_id: vendor.id },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    return this.prisma.menuItem.update({
      where: { id: itemId },
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        price: dto.price,
        image_url: dto.imageUrl,
        preparation_time_minutes: dto.preparationTimeMinutes,
        is_available: dto.isAvailable,
      },
    });
  }

  async deleteMenuItem(userId: string, itemId: string) {
    const vendor = await this.getMyVendor(userId);

    const item = await this.prisma.menuItem.findFirst({
      where: { id: itemId, vendor_id: vendor.id },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    await this.prisma.menuItem.delete({ where: { id: itemId } });
    return { message: 'Menu item deleted successfully' };
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
