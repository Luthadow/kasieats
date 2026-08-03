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
import { UpdateDriverStatusDto } from './dto/update-driver-status.dto';

const DELIVERY_INCLUDE = {
  order: { include: { vendor: true, customer: true } },
} satisfies Prisma.DeliveryInclude;

type DeliveryWithOrder = Prisma.DeliveryGetPayload<{ include: typeof DELIVERY_INCLUDE }>;

@Injectable()
export class DeliveriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async getAvailable(driverUserId: string) {
    const driver = await this.getDriver(driverUserId);
    await this.assertDriverHasActiveSubscription(driver.id);

    const orders = await this.prisma.order.findMany({
      where: { status: 'ready', delivery: { is: null } },
      include: { vendor: true, order_items: true },
      orderBy: { marked_as_ready_at: 'asc' },
      take: 50,
    });

    return {
      success: true,
      data: orders.map((order) => ({
        orderId: order.id,
        vendorName: order.vendor.store_name,
        pickupAddress: order.vendor.address,
        deliveryAddress: order.delivery_address,
        deliveryFee: Number(order.delivery_fee),
        estimatedEarnings: Math.round(Number(order.delivery_fee) * DRIVER_EARNINGS_SHARE * 100) / 100,
        itemCount: order.order_items.length,
        readyAt: order.marked_as_ready_at,
      })),
    };
  }

  async claim(driverUserId: string, orderId: string) {
    const driver = await this.getDriver(driverUserId);
    await this.assertDriverHasActiveSubscription(driver.id);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { vendor: true, delivery: true, customer: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== 'ready') {
      throw new BadRequestException('Order is not ready for pickup');
    }
    if (order.delivery) {
      throw new BadRequestException('Order has already been claimed');
    }

    const delivery = await this.prisma.delivery.create({
      data: {
        order_id: order.id,
        driver_id: driver.id,
        pickup_address: order.vendor.address,
        pickup_latitude: order.vendor.latitude,
        pickup_longitude: order.vendor.longitude,
        delivery_address: order.delivery_address,
        delivery_latitude: order.delivery_latitude,
        delivery_longitude: order.delivery_longitude,
        status: 'assigned',
      },
      include: DELIVERY_INCLUDE,
    });

    await this.prisma.order.update({
      where: { id: order.id },
      data: { driver_id: driver.id },
    });

    await this.notifyCustomer(
      order.customer.user_id,
      order.id,
      delivery.id,
      'Driver assigned',
      'A driver has been assigned and is heading to the restaurant.',
    );

    return { success: true, data: this.format(delivery) };
  }

  async pickup(driverUserId: string, deliveryId: string) {
    const delivery = await this.getOwnedDelivery(driverUserId, deliveryId);
    if (delivery.status !== 'assigned') {
      throw new BadRequestException('Delivery must be assigned before pickup');
    }

    const now = new Date();
    const [updated] = await this.prisma.$transaction([
      this.prisma.delivery.update({
        where: { id: delivery.id },
        data: { status: 'picked_up', picked_up_at: now },
        include: DELIVERY_INCLUDE,
      }),
      this.prisma.order.update({
        where: { id: delivery.order_id },
        data: { status: 'picked_up', picked_up_by_driver_at: now },
      }),
    ]);

    await this.notifyCustomer(
      delivery.order.customer.user_id,
      delivery.order_id,
      delivery.id,
      'Order picked up',
      'The driver has collected your order.',
    );

    return { success: true, data: this.format(updated) };
  }

  async enRoute(driverUserId: string, deliveryId: string) {
    const delivery = await this.getOwnedDelivery(driverUserId, deliveryId);
    if (delivery.status !== 'picked_up') {
      throw new BadRequestException('Delivery must be picked up first');
    }

    const now = new Date();
    const [updated] = await this.prisma.$transaction([
      this.prisma.delivery.update({
        where: { id: delivery.id },
        data: { status: 'en_route', en_route_at: now },
        include: DELIVERY_INCLUDE,
      }),
      this.prisma.order.update({
        where: { id: delivery.order_id },
        data: { status: 'en_route', driver_en_route_at: now },
      }),
    ]);

    await this.notifyCustomer(
      delivery.order.customer.user_id,
      delivery.order_id,
      delivery.id,
      'Driver on the way',
      'Your order is on its way to you.',
    );

    return { success: true, data: this.format(updated) };
  }

  async arrived(driverUserId: string, deliveryId: string) {
    const delivery = await this.getOwnedDelivery(driverUserId, deliveryId);
    if (!['picked_up', 'en_route'].includes(delivery.status)) {
      throw new BadRequestException('Delivery must be en route before arrival');
    }

    const updated = await this.prisma.delivery.update({
      where: { id: delivery.id },
      data: { status: 'arrived', arrived_at: new Date() },
      include: DELIVERY_INCLUDE,
    });

    await this.notifyCustomer(
      delivery.order.customer.user_id,
      delivery.order_id,
      delivery.id,
      'Driver arrived',
      'Your driver has arrived at your location.',
    );

    return { success: true, data: this.format(updated) };
  }

  async deliver(driverUserId: string, deliveryId: string, pin?: string) {
    const driver = await this.getDriver(driverUserId);
    const delivery = await this.prisma.delivery.findFirst({
      where: { id: deliveryId, driver_id: driver.id },
      include: DELIVERY_INCLUDE,
    });
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }
    if (delivery.status === 'delivered') {
      throw new BadRequestException('Delivery already completed');
    }
    if (!['picked_up', 'en_route', 'arrived'].includes(delivery.status)) {
      throw new BadRequestException('Delivery must be in progress before completing');
    }

    const order = delivery.order;

    // Delivery PIN verification (MTHURA blueprint): the customer's 4-digit PIN
    // must be supplied and match before the order can be marked delivered.
    if (order.delivery_pin) {
      if (!pin) {
        throw new BadRequestException('Delivery PIN is required to complete this delivery');
      }
      if (pin.trim() !== order.delivery_pin) {
        throw new BadRequestException('Incorrect delivery PIN');
      }
    }

    const now = new Date();
    const driverEarned =
      Math.round(Number(order.delivery_fee) * DRIVER_EARNINGS_SHARE * 100) / 100;

    // Driver payment is arranged directly between driver and customer/vendor outside platform
    const operations: Prisma.PrismaPromise<unknown>[] = [
      this.prisma.delivery.update({
        where: { id: delivery.id },
        data: {
          status: 'delivered',
          delivered_at: now,
          actual_delivery_time: now,
          driver_earned: driverEarned,
          driver_payment_status: 'external', // arranged outside platform
        },
      }),
      this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'delivered',
          delivered_at: now,
          // payment_status stays 'not_applicable' — no platform payment
        },
      }),
      this.prisma.driver.update({
        where: { id: driver.id },
        data: {
          total_deliveries: { increment: 1 },
          successful_deliveries: { increment: 1 },
          total_earnings: { increment: driverEarned },
        },
      }),
      this.prisma.vendor.update({
        where: { id: order.vendor_id },
        data: {
          total_orders: { increment: 1 },
          // total_revenue is GMV tracking only — not platform revenue
          total_revenue: { increment: order.subtotal },
        },
      }),
      this.prisma.customer.update({
        where: { id: order.customer_id },
        data: {
          total_orders: { increment: 1 },
          total_spent: { increment: order.total_amount },
          last_order_at: now,
          ...(order.customer.first_order_at ? {} : { first_order_at: now }),
        },
      }),
    ];

    await this.prisma.$transaction(operations);

    const updated = await this.prisma.delivery.findUnique({
      where: { id: delivery.id },
      include: DELIVERY_INCLUDE,
    });

    await this.notifyCustomer(
      order.customer.user_id,
      order.id,
      delivery.id,
      'Order delivered',
      'Your order has been delivered. Enjoy your meal!',
    );
    await this.notifications.createNotification(
      order.vendor.user_id,
      'Order delivered',
      'An order has been successfully delivered.',
      'order_delivered',
      { relatedOrderId: order.id },
    );

    return { success: true, data: this.format(updated!) };
  }

  async getMine(driverUserId: string) {
    const driver = await this.getDriver(driverUserId);

    const deliveries = await this.prisma.delivery.findMany({
      where: { driver_id: driver.id },
      include: DELIVERY_INCLUDE,
      orderBy: { assigned_at: 'desc' },
      take: 50,
    });

    return { success: true, data: deliveries.map((d) => this.format(d)) };
  }

  async updateDriverStatus(driverUserId: string, dto: UpdateDriverStatusDto) {
    const driver = await this.getDriver(driverUserId);

    const updated = await this.prisma.driver.update({
      where: { id: driver.id },
      data: {
        is_online: dto.isOnline,
        ...(dto.latitude !== undefined && { current_latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { current_longitude: dto.longitude }),
        ...(dto.latitude !== undefined || dto.longitude !== undefined
          ? { location_updated_at: new Date() }
          : {}),
      },
    });

    return {
      success: true,
      data: {
        isOnline: updated.is_online,
        latitude: updated.current_latitude ? Number(updated.current_latitude) : null,
        longitude: updated.current_longitude ? Number(updated.current_longitude) : null,
      },
    };
  }

  private async getDriver(driverUserId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { user_id: driverUserId } });
    if (!driver) {
      throw new ForbiddenException('No driver profile for this account');
    }
    if (driver.status !== 'active') {
      throw new ForbiddenException('Driver account is not active');
    }
    return driver;
  }

  private async assertDriverHasActiveSubscription(driverId: string): Promise<void> {
    const now = new Date();
    const subscription = await this.prisma.driverSubscription.findFirst({
      where: {
        driver_id: driverId,
        status: { in: ['active', 'trialing'] },
        current_period_end: { gt: now },
      },
    });

    if (!subscription) {
      throw new ForbiddenException(
        'Driver subscription is inactive. Please renew your MTHURA driver subscription (R80/month) to accept deliveries.',
      );
    }
  }

  private async getOwnedDelivery(driverUserId: string, deliveryId: string) {
    const driver = await this.getDriver(driverUserId);
    const delivery = await this.prisma.delivery.findFirst({
      where: { id: deliveryId, driver_id: driver.id },
      include: DELIVERY_INCLUDE,
    });
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }
    return delivery;
  }

  private async notifyCustomer(
    userId: string,
    orderId: string,
    deliveryId: string,
    title: string,
    message: string,
  ) {
    await this.notifications.createNotification(userId, title, message, 'delivery_update', {
      relatedOrderId: orderId,
      relatedDeliveryId: deliveryId,
    });
  }

  private format(delivery: DeliveryWithOrder) {
    return {
      id: delivery.id,
      orderId: delivery.order_id,
      status: delivery.status,
      pickupAddress: delivery.pickup_address,
      deliveryAddress: delivery.delivery_address,
      assignedAt: delivery.assigned_at,
      pickedUpAt: delivery.picked_up_at,
      enRouteAt: delivery.en_route_at,
      arrivedAt: delivery.arrived_at,
      deliveredAt: delivery.delivered_at,
      driverEarned: delivery.driver_earned ? Number(delivery.driver_earned) : null,
      order: {
        id: delivery.order.id,
        status: delivery.order.status,
        totalAmount: Number(delivery.order.total_amount),
        paymentMethod: delivery.order.payment_method,
        paymentStatus: delivery.order.payment_status,
        vendorName: delivery.order.vendor.store_name,
      },
    };
  }
}
