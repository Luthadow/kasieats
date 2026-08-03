import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async getDashboard() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      users,
      vendors,
      drivers,
      ordersToday,
      revenueToday,
      pendingVendors,
      pendingDrivers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.vendor.count(),
      this.prisma.driver.count(),
      this.prisma.order.count({ where: { created_at: { gte: startOfToday } } }),
      this.prisma.order.aggregate({
        _sum: { total_amount: true },
        where: { created_at: { gte: startOfToday }, status: 'delivered' },
      }),
      this.prisma.vendor.count({ where: { status: 'pending_approval' } }),
      this.prisma.driver.count({ where: { status: 'pending_approval' } }),
    ]);

    return {
      success: true,
      data: {
        users,
        vendors,
        drivers,
        ordersToday,
        revenueToday: Number(revenueToday._sum.total_amount ?? 0),
        pendingApprovals: {
          vendors: pendingVendors,
          drivers: pendingDrivers,
          total: pendingVendors + pendingDrivers,
        },
      },
    };
  }

  async getPendingVendors() {
    const vendors = await this.prisma.vendor.findMany({
      where: { status: 'pending_approval' },
      orderBy: { created_at: 'asc' },
    });

    return {
      success: true,
      data: vendors.map((v) => ({
        id: v.id,
        storeName: v.store_name,
        storeCategory: v.store_category,
        phone: v.phone,
        address: v.address,
        city: v.city,
        createdAt: v.created_at,
      })),
    };
  }

  async approveVendor(adminUserId: string, vendorId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const updated = await this.prisma.vendor.update({
      where: { id: vendorId },
      data: {
        status: 'active',
        approved_at: new Date(),
        approved_by_admin_id: adminUserId,
        approval_reason_if_rejected: null,
      },
    });

    await this.notifications.createNotification(
      vendor.user_id,
      'Store approved',
      'Congratulations! Your store has been approved and is now live.',
      'vendor_approved',
    );

    return { success: true, data: { id: updated.id, status: updated.status } };
  }

  async rejectVendor(vendorId: string, reason?: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const updated = await this.prisma.vendor.update({
      where: { id: vendorId },
      data: {
        status: 'rejected',
        approval_reason_if_rejected: reason ?? 'Rejected by admin',
      },
    });

    await this.notifications.createNotification(
      vendor.user_id,
      'Store application rejected',
      reason ?? 'Your store application was not approved.',
      'vendor_rejected',
    );

    return { success: true, data: { id: updated.id, status: updated.status } };
  }

  async getPendingDrivers() {
    const drivers = await this.prisma.driver.findMany({
      where: { status: 'pending_approval' },
      orderBy: { created_at: 'asc' },
    });

    return {
      success: true,
      data: drivers.map((d) => ({
        id: d.id,
        name: `${d.first_name} ${d.last_name}`,
        vehicleType: d.vehicle_type,
        vehiclePlate: d.vehicle_plate,
        createdAt: d.created_at,
      })),
    };
  }

  async approveDriver(adminUserId: string, driverId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const updated = await this.prisma.driver.update({
      where: { id: driverId },
      data: {
        status: 'active',
        approved_at: new Date(),
        approved_by_admin_id: adminUserId,
        approval_reason_if_rejected: null,
      },
    });

    await this.notifications.createNotification(
      driver.user_id,
      'Driver approved',
      'Your driver application has been approved. You can now go online.',
      'driver_approved',
    );

    return { success: true, data: { id: updated.id, status: updated.status } };
  }

  async rejectDriver(driverId: string, reason?: string) {
    const driver = await this.prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const updated = await this.prisma.driver.update({
      where: { id: driverId },
      data: {
        status: 'rejected',
        approval_reason_if_rejected: reason ?? 'Rejected by admin',
      },
    });

    await this.notifications.createNotification(
      driver.user_id,
      'Driver application rejected',
      reason ?? 'Your driver application was not approved.',
      'driver_rejected',
    );

    return { success: true, data: { id: updated.id, status: updated.status } };
  }

  async listOrders(query: ListOrdersQueryDto) {
    const orders = await this.prisma.order.findMany({
      where: {
        ...(query.status && { status: query.status }),
        ...(query.vendorId && { vendor_id: query.vendorId }),
      },
      include: { vendor: true, customer: true },
      orderBy: { created_at: 'desc' },
      take: query.limit ?? 50,
    });

    return {
      success: true,
      data: orders.map((order) => ({
        id: order.id,
        status: order.status,
        paymentStatus: order.payment_status,
        paymentMethod: order.payment_method,
        totalAmount: Number(order.total_amount),
        vendorName: order.vendor.store_name,
        customerName: `${order.customer.first_name} ${order.customer.last_name}`,
        createdAt: order.created_at,
      })),
    };
  }

  async cancelOrder(orderId: string, reason?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true, vendor: true },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'cancelled',
        cancelled_at: new Date(),
        cancellation_reason: reason ?? 'Cancelled by admin',
      },
    });

    await this.notifications.createNotification(
      order.customer.user_id,
      'Order cancelled',
      reason ?? 'Your order was cancelled by support.',
      'order_cancelled',
      { relatedOrderId: order.id },
    );

    return { success: true, data: { id: updated.id, status: updated.status } };
  }
}
