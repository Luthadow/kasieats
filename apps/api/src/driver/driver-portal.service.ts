import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DRIVER_EARNINGS_SHARE } from '@kasieats/shared';
import { Prisma } from '@kasieats/db';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  DriverDeliveryAction,
  UpdateDriverDeliveryDto,
  UpdateDriverLocationDto,
  UpdateDriverStatusDto,
} from './dto/driver.dto';

type DeliveryWithDetails = Prisma.DeliveryGetPayload<{
  include: {
    order: {
      include: {
        vendor: true;
        customer: { include: { user: true } };
        order_items: { include: { menu_item: true } };
      };
    };
  };
}>;

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
export class DriverPortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async getDashboard(driverUserId: string) {
    const driver = await this.getDriverForUser(driverUserId);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayDeliveries = await this.prisma.delivery.findMany({
      where: {
        driver_id: driver.id,
        delivered_at: { gte: startOfDay },
        status: 'delivered',
      },
    });

    const earningsToday = todayDeliveries.reduce(
      (sum, delivery) => sum + Number(delivery.driver_earned ?? 0),
      0,
    );

    const activeDelivery = await this.getActiveDeliveryRecord(driver.id);

    return {
      success: true,
      data: {
        firstName: driver.first_name,
        lastName: driver.last_name,
        isOnline: driver.is_online,
        vehicleType: driver.vehicle_type,
        averageRating: Number(driver.average_rating),
        deliveriesToday: todayDeliveries.length,
        earningsToday: Math.round(earningsToday * 100) / 100,
        pendingEarnings: Number(driver.pending_earnings),
        totalEarnings: Number(driver.total_earnings),
        activeDelivery: activeDelivery ? this.formatDelivery(activeDelivery) : null,
      },
    };
  }

  async updateStatus(driverUserId: string, dto: UpdateDriverStatusDto) {
    const driver = await this.getDriverForUser(driverUserId);

    if (!dto.isOnline) {
      const active = await this.getActiveDeliveryRecord(driver.id);
      if (active) {
        throw new BadRequestException('Complete your active delivery before going offline');
      }
    }

    const updated = await this.prisma.driver.update({
      where: { id: driver.id },
      data: {
        is_online: dto.isOnline,
        ...(dto.latitude !== undefined && {
          current_latitude: dto.latitude,
          current_longitude: dto.longitude,
          location_updated_at: new Date(),
        }),
      },
    });

    return {
      success: true,
      data: { isOnline: updated.is_online },
    };
  }

  async updateLocation(driverUserId: string, dto: UpdateDriverLocationDto) {
    const driver = await this.getDriverForUser(driverUserId);

    await this.prisma.driver.update({
      where: { id: driver.id },
      data: {
        current_latitude: dto.latitude,
        current_longitude: dto.longitude,
        location_updated_at: new Date(),
      },
    });

    return { success: true };
  }

  async listAvailableJobs(driverUserId: string) {
    const driver = await this.getDriverForUser(driverUserId);

    if (!driver.is_online) {
      return { success: true, data: [] };
    }

    const active = await this.getActiveDeliveryRecord(driver.id);
    if (active) {
      return { success: true, data: [] };
    }

    const driverLat = driver.current_latitude ? Number(driver.current_latitude) : -25.6544;
    const driverLng = driver.current_longitude ? Number(driver.current_longitude) : 27.2389;

    const orders = await this.prisma.order.findMany({
      where: {
        status: 'ready',
        delivery: null,
      },
      include: { vendor: true },
      orderBy: { marked_as_ready_at: 'asc' },
      take: 20,
    });

    const jobs = orders.map((order) => {
      const pickupLat = Number(order.vendor.latitude);
      const pickupLng = Number(order.vendor.longitude);
      const distanceKm = haversineKm(driverLat, driverLng, pickupLat, pickupLng);
      const driverEarned = Math.round(Number(order.delivery_fee) * DRIVER_EARNINGS_SHARE * 100) / 100;

      return {
        orderId: order.id,
        vendorName: order.vendor.store_name,
        pickupAddress: order.vendor.address,
        pickupLatitude: pickupLat,
        pickupLongitude: pickupLng,
        deliveryAddress: order.delivery_address,
        deliveryLatitude: order.delivery_latitude ? Number(order.delivery_latitude) : null,
        deliveryLongitude: order.delivery_longitude ? Number(order.delivery_longitude) : null,
        distanceKm: Math.round(distanceKm * 10) / 10,
        estimatedPayout: driverEarned,
        deliveryFee: Number(order.delivery_fee),
        readyAt: order.marked_as_ready_at,
      };
    });

    jobs.sort((a, b) => a.distanceKm - b.distanceKm);

    return { success: true, data: jobs };
  }

  async acceptJob(driverUserId: string, orderId: string) {
    const driver = await this.getDriverForUser(driverUserId);

    if (!driver.is_online) {
      throw new BadRequestException('Go online to accept deliveries');
    }

    const active = await this.getActiveDeliveryRecord(driver.id);
    if (active) {
      throw new BadRequestException('You already have an active delivery');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { vendor: true, delivery: true },
    });

    if (!order || order.status !== 'ready') {
      throw new NotFoundException('Job no longer available');
    }

    if (order.delivery) {
      throw new BadRequestException('Job already assigned');
    }

    const driverEarned = Math.round(Number(order.delivery_fee) * DRIVER_EARNINGS_SHARE * 100) / 100;

    const delivery = await this.prisma.$transaction(async (tx) => {
      const created = await tx.delivery.create({
        data: {
          order_id: order.id,
          driver_id: driver.id,
          pickup_address: order.vendor.address,
          pickup_latitude: order.vendor.latitude,
          pickup_longitude: order.vendor.longitude,
          delivery_address: order.delivery_address,
          delivery_latitude: order.delivery_latitude,
          delivery_longitude: order.delivery_longitude,
          driver_earned: driverEarned,
          status: 'assigned',
        },
        include: {
          order: {
            include: {
              vendor: true,
              customer: { include: { user: true } },
              order_items: { include: { menu_item: true } },
            },
          },
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { driver_id: driver.id },
      });

      return created;
    });

    await this.notifications.notify({
      userId: delivery.order.customer.user_id,
      title: 'Driver assigned',
      message: `${driver.first_name} is on the way to collect your order.`,
      notificationType: 'driver_assigned',
      relatedOrderId: orderId,
    });

    return {
      success: true,
      data: this.formatDelivery(delivery),
    };
  }

  async getActiveDelivery(driverUserId: string) {
    const driver = await this.getDriverForUser(driverUserId);
    const active = await this.getActiveDeliveryRecord(driver.id);

    return {
      success: true,
      data: active ? this.formatDelivery(active) : null,
    };
  }

  async updateDeliveryStatus(
    driverUserId: string,
    deliveryId: string,
    dto: UpdateDriverDeliveryDto,
  ) {
    const driver = await this.getDriverForUser(driverUserId);

    const delivery = await this.prisma.delivery.findFirst({
      where: { id: deliveryId, driver_id: driver.id },
      include: {
        order: {
          include: {
            vendor: true,
            customer: { include: { user: true } },
            order_items: { include: { menu_item: true } },
          },
        },
      },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    const updates = this.resolveDeliveryUpdate(delivery.status, dto.action);

    const updated = await this.prisma.$transaction(async (tx) => {
      const nextDelivery = await tx.delivery.update({
        where: { id: deliveryId },
        data: updates.delivery,
        include: {
          order: {
            include: {
              vendor: true,
              customer: { include: { user: true } },
              order_items: { include: { menu_item: true } },
            },
          },
        },
      });

      await tx.order.update({
        where: { id: delivery.order_id },
        data: updates.order,
      });

      if (dto.action === DriverDeliveryAction.COMPLETE) {
        await tx.driver.update({
          where: { id: driver.id },
          data: {
            total_deliveries: { increment: 1 },
            successful_deliveries: { increment: 1 },
            total_earnings: { increment: Number(delivery.driver_earned ?? 0) },
            pending_earnings: { increment: Number(delivery.driver_earned ?? 0) },
          },
        });

        if (delivery.order.payment_method === 'cash') {
          await tx.order.update({
            where: { id: delivery.order_id },
            data: { payment_status: 'paid' },
          });
        }
      }

      return nextDelivery;
    });

    if (dto.action === DriverDeliveryAction.START_DELIVERY) {
      await this.notifications.notify({
        userId: updated.order.customer.user_id,
        title: 'On the way!',
        message: `${driver.first_name} is delivering your order now.`,
        notificationType: 'driver_en_route',
        relatedOrderId: updated.order_id,
      });
    }

    if (dto.action === DriverDeliveryAction.COMPLETE) {
      await this.notifications.notify({
        userId: updated.order.customer.user_id,
        title: 'Delivered!',
        message: 'Your order has been delivered. Rate your experience.',
        notificationType: 'order_delivered',
        relatedOrderId: updated.order_id,
      });
      await this.notifications.notifyVendorByVendorId(
        updated.order.vendor_id,
        'Order delivered',
        `Order #${updated.order_id.slice(-6)} was delivered successfully.`,
        'order_delivered',
        updated.order_id,
      );
    }

    return {
      success: true,
      data: this.formatDelivery(updated),
    };
  }

  private resolveDeliveryUpdate(currentStatus: string, action: DriverDeliveryAction) {
    const now = new Date();

    switch (action) {
      case DriverDeliveryAction.COLLECT:
        if (currentStatus !== 'assigned') {
          throw new BadRequestException('Collect is only available after accepting a job');
        }
        return {
          delivery: { status: 'picked_up', picked_up_at: now },
          order: { status: 'picked_up', picked_up_by_driver_at: now },
        };
      case DriverDeliveryAction.START_DELIVERY:
        if (currentStatus !== 'picked_up') {
          throw new BadRequestException('Start delivery after collecting the order');
        }
        return {
          delivery: { status: 'en_route', en_route_at: now },
          order: { status: 'en_route', driver_en_route_at: now },
        };
      case DriverDeliveryAction.COMPLETE:
        if (!['en_route', 'picked_up'].includes(currentStatus)) {
          throw new BadRequestException('Complete delivery while en route');
        }
        return {
          delivery: { status: 'delivered', delivered_at: now, actual_delivery_time: now },
          order: { status: 'delivered', delivered_at: now },
        };
      default:
        throw new BadRequestException('Invalid action');
    }
  }

  private async getActiveDeliveryRecord(driverId: string) {
    return this.prisma.delivery.findFirst({
      where: {
        driver_id: driverId,
        status: { in: ['assigned', 'picked_up', 'en_route'] },
      },
      include: {
        order: {
          include: {
            vendor: true,
            customer: { include: { user: true } },
            order_items: { include: { menu_item: true } },
          },
        },
      },
      orderBy: { assigned_at: 'desc' },
    });
  }

  private async getDriverForUser(driverUserId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { user_id: driverUserId },
    });

    if (!driver || driver.status !== 'active') {
      throw new ForbiddenException('Driver account not active');
    }

    return driver;
  }

  private formatDelivery(delivery: DeliveryWithDetails) {
    return {
      id: delivery.id,
      status: delivery.status,
      driverEarned: Number(delivery.driver_earned ?? 0),
      pickupAddress: delivery.pickup_address,
      pickupLatitude: delivery.pickup_latitude ? Number(delivery.pickup_latitude) : null,
      pickupLongitude: delivery.pickup_longitude ? Number(delivery.pickup_longitude) : null,
      deliveryAddress: delivery.delivery_address,
      deliveryLatitude: delivery.delivery_latitude ? Number(delivery.delivery_latitude) : null,
      deliveryLongitude: delivery.delivery_longitude ? Number(delivery.delivery_longitude) : null,
      assignedAt: delivery.assigned_at,
      pickedUpAt: delivery.picked_up_at,
      enRouteAt: delivery.en_route_at,
      deliveredAt: delivery.delivered_at,
      order: {
        id: delivery.order.id,
        status: delivery.order.status,
        specialInstructions: delivery.order.special_instructions,
        vendor: {
          storeName: delivery.order.vendor.store_name,
          phone: delivery.order.vendor.phone,
        },
        customer: {
          firstName: delivery.order.customer.first_name,
          lastName: delivery.order.customer.last_name,
          phone: delivery.order.customer.user.phone,
        },
        items: delivery.order.order_items.map((item) => ({
          name: item.menu_item.name,
          quantity: item.quantity,
        })),
      },
    };
  }
}
