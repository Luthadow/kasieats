import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListVendorsQueryDto } from './dto/list-vendors-query.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Injectable()
export class VendorsService {
  constructor(private readonly prisma: PrismaService) {}

  async listVendors(query: ListVendorsQueryDto) {
    const vendors = await this.prisma.vendor.findMany({
      where: {
        status: 'active',
        ...(query.category && { store_category: query.category }),
        ...(query.openNow === true && { is_open_now: true }),
      },
      orderBy: [{ average_rating: 'desc' }, { total_orders: 'desc' }],
    });

    const latitude = query.latitude ?? query.lat;
    const longitude = query.longitude ?? query.lng;
    const maxDistanceKm = query.maxDistanceKm ?? query.radiusKm;

    const withDistance = vendors.map((vendor) => {
      const distanceKm =
        latitude !== undefined && longitude !== undefined
          ? haversineKm(
              latitude,
              longitude,
              Number(vendor.latitude),
              Number(vendor.longitude),
            )
          : undefined;

      return {
        id: vendor.id,
        storeName: vendor.store_name,
        storeCategory: vendor.store_category,
        address: vendor.address,
        city: vendor.city,
        latitude: Number(vendor.latitude),
        longitude: Number(vendor.longitude),
        logoUrl: vendor.logo_url,
        bannerUrl: vendor.banner_url,
        isOpenNow: vendor.is_open_now,
        averageRating: Number(vendor.average_rating),
        ratingCount: vendor.rating_count,
        distanceKm: distanceKm ? Math.round(distanceKm * 10) / 10 : undefined,
        estimatedDeliveryMinutes: distanceKm
          ? Math.max(20, Math.round(distanceKm * 8 + 15))
          : 35,
      };
    });

    const filtered =
      maxDistanceKm !== undefined
        ? withDistance.filter(
            (v) => v.distanceKm === undefined || v.distanceKm <= maxDistanceKm!,
          )
        : withDistance;

  filtered.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));

    return { success: true, data: filtered };
  }

  async getVendor(id: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      include: {
        menus: {
          include: {
            items: {
              where: { is_available: true },
              orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
            },
          },
        },
      },
    });

    if (!vendor || vendor.status !== 'active') {
      throw new NotFoundException('Vendor not found');
    }

    const menuItems = vendor.menus.flatMap((menu) =>
      menu.items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        price: Number(item.price),
        isAvailable: item.is_available,
        imageUrl: item.image_url,
        preparationTimeMinutes: item.preparation_time_minutes,
      })),
    );

    return {
      success: true,
      data: {
        id: vendor.id,
        storeName: vendor.store_name,
        storeDescription: vendor.store_description,
        storeCategory: vendor.store_category,
        address: vendor.address,
        city: vendor.city,
        latitude: Number(vendor.latitude),
        longitude: Number(vendor.longitude),
        logoUrl: vendor.logo_url,
        bannerUrl: vendor.banner_url,
        isOpenNow: vendor.is_open_now,
        averageRating: Number(vendor.average_rating),
        ratingCount: vendor.rating_count,
        operatingHours: vendor.operating_hours,
        menuItems,
      },
    };
  }

  async getMyVendor(userId: string) {
    const vendor = await this.getVendorByUser(userId);
    return { success: true, data: this.formatVendorProfile(vendor) };
  }

  async updateMyVendor(userId: string, dto: UpdateVendorDto) {
    const vendor = await this.getVendorByUser(userId);

    const updated = await this.prisma.vendor.update({
      where: { id: vendor.id },
      data: {
        ...(dto.storeName !== undefined && { store_name: dto.storeName }),
        ...(dto.storeDescription !== undefined && { store_description: dto.storeDescription }),
        ...(dto.storeCategory !== undefined && { store_category: dto.storeCategory }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
        ...(dto.logoUrl !== undefined && { logo_url: dto.logoUrl }),
        ...(dto.bannerUrl !== undefined && { banner_url: dto.bannerUrl }),
        ...(dto.isOpenNow !== undefined && { is_open_now: dto.isOpenNow }),
      },
    });

    return { success: true, data: this.formatVendorProfile(updated) };
  }

  async getMyMenu(userId: string) {
    const vendor = await this.getVendorByUser(userId);
    const items = await this.prisma.menuItem.findMany({
      where: { vendor_id: vendor.id },
      orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
    });

    return {
      success: true,
      data: items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        price: Number(item.price),
        isAvailable: item.is_available,
        imageUrl: item.image_url,
        preparationTimeMinutes: item.preparation_time_minutes,
      })),
    };
  }

  async createMenuItem(userId: string, dto: CreateMenuItemDto) {
    const vendor = await this.getVendorByUser(userId);

    let menu = await this.prisma.menu.findFirst({ where: { vendor_id: vendor.id } });
    if (!menu) {
      menu = await this.prisma.menu.create({
        data: { vendor_id: vendor.id, category: dto.category ?? 'Main' },
      });
    }

    const item = await this.prisma.menuItem.create({
      data: {
        menu_id: menu.id,
        vendor_id: vendor.id,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        price: dto.price,
        is_available: dto.isAvailable ?? true,
        ...(dto.preparationTimeMinutes !== undefined && {
          preparation_time_minutes: dto.preparationTimeMinutes,
        }),
        image_url: dto.imageUrl,
      },
    });

    return {
      success: true,
      data: {
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        price: Number(item.price),
        isAvailable: item.is_available,
        imageUrl: item.image_url,
        preparationTimeMinutes: item.preparation_time_minutes,
      },
    };
  }

  async updateMenuItem(userId: string, itemId: string, dto: UpdateMenuItemDto) {
    const vendor = await this.getVendorByUser(userId);

    const existing = await this.prisma.menuItem.findFirst({
      where: { id: itemId, vendor_id: vendor.id },
    });
    if (!existing) {
      throw new NotFoundException('Menu item not found');
    }

    const item = await this.prisma.menuItem.update({
      where: { id: itemId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.isAvailable !== undefined && { is_available: dto.isAvailable }),
        ...(dto.preparationTimeMinutes !== undefined && {
          preparation_time_minutes: dto.preparationTimeMinutes,
        }),
        ...(dto.imageUrl !== undefined && { image_url: dto.imageUrl }),
      },
    });

    return {
      success: true,
      data: {
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        price: Number(item.price),
        isAvailable: item.is_available,
        imageUrl: item.image_url,
        preparationTimeMinutes: item.preparation_time_minutes,
      },
    };
  }

  private async getVendorByUser(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { user_id: userId } });
    if (!vendor) {
      throw new ForbiddenException('No vendor profile for this account');
    }
    return vendor;
  }

  private formatVendorProfile(vendor: {
    id: string;
    store_name: string;
    store_description: string | null;
    store_category: string;
    phone: string;
    email: string | null;
    address: string;
    city: string;
    latitude: unknown;
    longitude: unknown;
    logo_url: string | null;
    banner_url: string | null;
    is_open_now: boolean;
    status: string;
    average_rating: unknown;
    rating_count: number;
    total_orders: number;
    total_revenue: unknown;
    operating_hours: unknown;
  }) {
    return {
      id: vendor.id,
      storeName: vendor.store_name,
      storeDescription: vendor.store_description,
      storeCategory: vendor.store_category,
      phone: vendor.phone,
      email: vendor.email,
      address: vendor.address,
      city: vendor.city,
      latitude: Number(vendor.latitude),
      longitude: Number(vendor.longitude),
      logoUrl: vendor.logo_url,
      bannerUrl: vendor.banner_url,
      isOpenNow: vendor.is_open_now,
      status: vendor.status,
      averageRating: Number(vendor.average_rating),
      ratingCount: vendor.rating_count,
      totalOrders: vendor.total_orders,
      totalRevenue: Number(vendor.total_revenue),
      operatingHours: vendor.operating_hours,
    };
  }
}
