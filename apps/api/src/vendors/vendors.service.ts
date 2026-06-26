import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListVendorsQueryDto } from './dto/list-vendors-query.dto';

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

    const withDistance = vendors.map((vendor) => {
      const distanceKm =
        query.latitude !== undefined && query.longitude !== undefined
          ? haversineKm(
              query.latitude,
              query.longitude,
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
      query.maxDistanceKm !== undefined
        ? withDistance.filter(
            (v) => v.distanceKm === undefined || v.distanceKm <= query.maxDistanceKm!,
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
}
