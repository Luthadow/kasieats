import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WalletService } from '../wallet/wallet.service';
import { RejectApplicationDto } from './dto/admin.dto';

@Injectable()
export class AdminPortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly walletService: WalletService,
  ) {}

  async getDashboard() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      customers,
      vendors,
      drivers,
      pendingVendors,
      pendingDrivers,
      ordersToday,
      revenueToday,
      liveOrders,
    ] = await Promise.all([
      this.prisma.customer.count(),
      this.prisma.vendor.count({ where: { status: 'active' } }),
      this.prisma.driver.count({ where: { status: 'active' } }),
      this.prisma.vendor.count({ where: { status: 'pending_approval' } }),
      this.prisma.driver.count({ where: { status: 'pending_approval' } }),
      this.prisma.order.count({ where: { created_at: { gte: startOfDay } } }),
      this.prisma.order.aggregate({
        where: { created_at: { gte: startOfDay }, status: { notIn: ['cancelled', 'rejected'] } },
        _sum: { service_fee: true },
      }),
      this.prisma.order.count({
        where: { status: { in: ['pending', 'preparing', 'ready', 'picked_up', 'en_route'] } },
      }),
    ]);

    return {
      success: true,
      data: {
        customers,
        activeVendors: vendors,
        activeDrivers: drivers,
        pendingVendors,
        pendingDrivers,
        ordersToday,
        platformRevenueToday: Number(revenueToday._sum.service_fee ?? 0),
        liveOrders,
        pilotCity: 'Rustenburg',
      },
    };
  }

  async listPendingVendors() {
    const vendors = await this.prisma.vendor.findMany({
      where: { status: 'pending_approval' },
      include: { user: true },
      orderBy: { created_at: 'asc' },
    });

    return {
      success: true,
      data: vendors.map((v) => ({
        id: v.id,
        storeName: v.store_name,
        category: v.store_category,
        phone: v.phone,
        address: v.address,
        city: v.city,
        submittedAt: v.created_at,
      })),
    };
  }

  async listPendingDrivers() {
    const drivers = await this.prisma.driver.findMany({
      where: { status: 'pending_approval' },
      include: { user: true },
      orderBy: { created_at: 'asc' },
    });

    return {
      success: true,
      data: drivers.map((d) => ({
        id: d.id,
        firstName: d.first_name,
        lastName: d.last_name,
        phone: d.user.phone,
        vehicleType: d.vehicle_type,
        vehiclePlate: d.vehicle_plate,
        submittedAt: d.created_at,
      })),
    };
  }

  async listRecentOrders() {
    const orders = await this.prisma.order.findMany({
      include: { vendor: true, customer: true },
      orderBy: { created_at: 'desc' },
      take: 30,
    });

    return {
      success: true,
      data: orders.map((o) => ({
        id: o.id,
        status: o.status,
        totalAmount: Number(o.total_amount),
        vendorName: o.vendor.store_name,
        customerName: `${o.customer.first_name} ${o.customer.last_name}`,
        createdAt: o.created_at,
      })),
    };
  }

  async approveVendor(vendorId: string, adminUserId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor || vendor.status !== 'pending_approval') {
      throw new NotFoundException('Pending vendor not found');
    }

    const updated = await this.prisma.vendor.update({
      where: { id: vendorId },
      data: {
        status: 'active',
        approved_at: new Date(),
        approved_by_admin_id: adminUserId,
      },
    });

    await this.notifications.notify({
      userId: vendor.user_id,
      title: 'Store approved!',
      message: `${vendor.store_name} is now live on KasiEats. You can start receiving orders.`,
      notificationType: 'vendor_approved',
    });

    await this.prisma.auditLog.create({
      data: {
        user_id: adminUserId,
        user_type: 'admin',
        action: 'approve',
        table_name: 'vendors',
        record_id: vendorId,
      },
    });

    return { success: true, data: { id: updated.id, status: updated.status } };
  }

  async rejectVendor(vendorId: string, adminUserId: string, dto: RejectApplicationDto) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor || vendor.status !== 'pending_approval') {
      throw new NotFoundException('Pending vendor not found');
    }

    const updated = await this.prisma.vendor.update({
      where: { id: vendorId },
      data: {
        status: 'rejected',
        approval_reason_if_rejected: dto.reason ?? 'Application rejected',
      },
    });

    await this.notifications.notify({
      userId: vendor.user_id,
      title: 'Application update',
      message: dto.reason ?? 'Your vendor application was not approved at this time.',
      notificationType: 'vendor_rejected',
    });

    return { success: true, data: { id: updated.id, status: updated.status } };
  }

  async approveDriver(driverId: string, adminUserId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver || driver.status !== 'pending_approval') {
      throw new NotFoundException('Pending driver not found');
    }

    const updated = await this.prisma.driver.update({
      where: { id: driverId },
      data: {
        status: 'active',
        approved_at: new Date(),
        approved_by_admin_id: adminUserId,
      },
    });

    await this.notifications.notify({
      userId: driver.user_id,
      title: 'Driver application approved',
      message: 'You can now go online and accept delivery jobs on KasiEats.',
      notificationType: 'driver_approved',
    });

    return { success: true, data: { id: updated.id, status: updated.status } };
  }

  async rejectDriver(driverId: string, adminUserId: string, dto: RejectApplicationDto) {
    const driver = await this.prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver || driver.status !== 'pending_approval') {
      throw new NotFoundException('Pending driver not found');
    }

    const updated = await this.prisma.driver.update({
      where: { id: driverId },
      data: {
        status: 'rejected',
        approval_reason_if_rejected: dto.reason ?? 'Application rejected',
      },
    });

    await this.notifications.notify({
      userId: driver.user_id,
      title: 'Application update',
      message: dto.reason ?? 'Your driver application was not approved at this time.',
      notificationType: 'driver_rejected',
    });

    return { success: true, data: { id: updated.id, status: updated.status } };
  }

  listPendingWithdrawals() {
    return this.walletService.listPendingWithdrawals();
  }

  approveWithdrawal(withdrawalId: string, adminUserId: string) {
    return this.walletService.approveWithdrawal(withdrawalId, adminUserId);
  }

  rejectWithdrawal(withdrawalId: string, adminUserId: string, dto: RejectApplicationDto) {
    return this.walletService.rejectWithdrawal(withdrawalId, adminUserId, dto.reason);
  }
}
