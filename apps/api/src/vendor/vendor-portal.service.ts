import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@kasieats/db';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UpdateVendorOrderStatusDto, VendorOrderAction } from './dto/update-vendor-order-status.dto';

type VendorOrderWithDetails = Prisma.OrderGetPayload<{
  include: {
    customer: { include: { user: true } };
    order_items: { include: { menu_item: true } };
  };
}>;

@Injectable()
export class VendorPortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async getDashboard(vendorUserId: string) {
    const vendor = await this.getVendorForUser(vendorUserId);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayOrders = await this.prisma.order.findMany({
      where: {
        vendor_id: vendor.id,
        created_at: { gte: startOfDay },
        status: { notIn: ['rejected', 'cancelled'] },
      },
    });

    const pendingCount = await this.prisma.order.count({
      where: { vendor_id: vendor.id, status: 'pending' },
    });

    const revenueToday = todayOrders.reduce((sum, order) => sum + Number(order.vendor_payout ?? 0), 0);

    return {
      success: true,
      data: {
        storeName: vendor.store_name,
        isOpenNow: vendor.is_open_now,
        ordersToday: todayOrders.length,
        revenueToday: Math.round(revenueToday * 100) / 100,
        pendingOrders: pendingCount,
        averageRating: Number(vendor.average_rating),
      },
    };
  }

  async listOrders(vendorUserId: string, status?: string) {
    const vendor = await this.getVendorForUser(vendorUserId);

    const orders = await this.prisma.order.findMany({
      where: {
        vendor_id: vendor.id,
        ...(status && status !== 'all' ? { status } : {}),
      },
      include: {
        customer: { include: { user: true } },
        order_items: { include: { menu_item: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 100,
    });

    return {
      success: true,
      data: orders.map((order) => this.formatVendorOrder(order)),
    };
  }

  async updateOrderStatus(vendorUserId: string, orderId: string, dto: UpdateVendorOrderStatusDto) {
    const vendor = await this.getVendorForUser(vendorUserId);

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, vendor_id: vendor.id },
      include: {
        customer: { include: { user: true } },
        order_items: { include: { menu_item: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const updates = this.resolveStatusUpdate(order.status, dto);

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: updates,
      include: {
        customer: { include: { user: true } },
        order_items: { include: { menu_item: true } },
      },
    });

    if (dto.action === VendorOrderAction.MARK_READY) {
      await this.notifications.notify({
        userId: updated.customer.user_id,
        title: 'Order ready for pickup',
        message: 'Your order is ready. A driver will collect it soon.',
        notificationType: 'order_ready',
        relatedOrderId: orderId,
      });
      await this.notifications.notifyOnlineDrivers(
        'New delivery job',
        `Order ready at ${vendor.store_name}. Tap to accept.`,
        orderId,
      );
    }

    if (dto.action === VendorOrderAction.ACCEPT) {
      await this.notifications.notify({
        userId: updated.customer.user_id,
        title: 'Order accepted',
        message: `${vendor.store_name} is preparing your order.`,
        notificationType: 'order_accepted',
        relatedOrderId: orderId,
      });
    }

    return {
      success: true,
      data: this.formatVendorOrder(updated),
    };
  }

  async toggleStoreStatus(vendorUserId: string, isOpen: boolean) {
    const vendor = await this.getVendorForUser(vendorUserId);

    const updated = await this.prisma.vendor.update({
      where: { id: vendor.id },
      data: { is_open_now: isOpen },
    });

    return {
      success: true,
      data: { isOpenNow: updated.is_open_now },
    };
  }

  private resolveStatusUpdate(currentStatus: string, dto: UpdateVendorOrderStatusDto) {
    switch (dto.action) {
      case VendorOrderAction.ACCEPT:
        if (currentStatus !== 'pending') {
          throw new BadRequestException('Only pending orders can be accepted');
        }
        return {
          status: 'preparing',
          accepted_by_vendor_at: new Date(),
        };
      case VendorOrderAction.REJECT:
        if (currentStatus !== 'pending') {
          throw new BadRequestException('Only pending orders can be rejected');
        }
        return {
          status: 'rejected',
          rejection_reason: dto.rejectionReason ?? 'Vendor unavailable',
          cancelled_at: new Date(),
        };
      case VendorOrderAction.MARK_READY:
        if (!['preparing', 'accepted'].includes(currentStatus)) {
          throw new BadRequestException('Order must be preparing before marking ready');
        }
        return {
          status: 'ready',
          marked_as_ready_at: new Date(),
        };
      default:
        throw new BadRequestException('Invalid action');
    }
  }

  private async getVendorForUser(vendorUserId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { user_id: vendorUserId },
    });

    if (!vendor || vendor.status !== 'active') {
      throw new ForbiddenException('Vendor account not active');
    }

    return vendor;
  }

  private formatVendorOrder(order: VendorOrderWithDetails) {
    return {
      id: order.id,
      status: order.status,
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method,
      subtotal: Number(order.subtotal),
      deliveryFee: Number(order.delivery_fee),
      serviceFee: Number(order.service_fee),
      totalAmount: Number(order.total_amount),
      vendorPayout: Number(order.vendor_payout ?? 0),
      deliveryAddress: order.delivery_address,
      specialInstructions: order.special_instructions,
      estimatedDeliveryMinutes: order.estimated_delivery_minutes,
      createdAt: order.created_at,
      acceptedAt: order.accepted_by_vendor_at,
      readyAt: order.marked_as_ready_at,
      customer: {
        firstName: order.customer.first_name,
        lastName: order.customer.last_name,
        phone: order.customer.user.phone,
      },
      items: order.order_items.map((item) => ({
        name: item.menu_item.name,
        quantity: item.quantity,
        pricePerItem: Number(item.price_per_item),
        extrasTotal: Number(item.extras_total),
        specialInstructions: item.special_instructions,
      })),
    };
  }
}
