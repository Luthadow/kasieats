import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderEventsService } from '../realtime/order-events.service';
import { PushService } from './push.service';
import type { RegisterDeviceDto } from './dto/register-device.dto';

interface NotifyInput {
  userId: string;
  title: string;
  message: string;
  notificationType: string;
  relatedOrderId?: string;
  relatedDeliveryId?: string;
  actionUrl?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderEvents: OrderEventsService,
    private readonly pushService: PushService,
  ) {}

  async notify(input: NotifyInput) {
    const notification = await this.prisma.notification.create({
      data: {
        user_id: input.userId,
        title: input.title,
        message: input.message,
        notification_type: input.notificationType,
        related_order_id: input.relatedOrderId,
        related_delivery_id: input.relatedDeliveryId,
        action_url: input.actionUrl,
        notification_method: 'in_app',
        sent_at: new Date(),
      },
    });

    // Push to registered Expo devices (background alerts)
    await this.pushService.sendToUser({
      userId: input.userId,
      title: input.title,
      message: input.message,
      data: {
        type: input.notificationType,
        ...(input.relatedOrderId ? { orderId: input.relatedOrderId } : {}),
      },
    });

    this.orderEvents.emitNotification({
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.notificationType,
    });

    return notification;
  }

  async notifyVendorByVendorId(
    vendorId: string,
    title: string,
    message: string,
    notificationType: string,
    relatedOrderId?: string,
  ) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) return null;
    return this.notify({
      userId: vendor.user_id,
      title,
      message,
      notificationType,
      relatedOrderId,
      actionUrl: relatedOrderId ? `/orders` : undefined,
    });
  }

  async notifyOnlineDrivers(title: string, message: string, relatedOrderId?: string) {
    const drivers = await this.prisma.driver.findMany({
      where: { status: 'active', is_online: true },
      select: { user_id: true },
    });

    return Promise.all(
      drivers.map((driver) =>
        this.notify({
          userId: driver.user_id,
          title,
          message,
          notificationType: 'delivery_job',
          relatedOrderId,
          actionUrl: '/jobs',
        }),
      ),
    );
  }

  async registerDevice(userId: string, dto: RegisterDeviceDto) {
    await this.prisma.devicePushToken.upsert({
      where: { token: dto.token },
      update: { user_id: userId, platform: dto.platform },
      create: {
        user_id: userId,
        token: dto.token,
        platform: dto.platform,
      },
    });
    return { success: true };
  }

  async listForUser(userId: string, unreadOnly = false) {
    const notifications = await this.prisma.notification.findMany({
      where: {
        user_id: userId,
        ...(unreadOnly ? { is_read: false } : {}),
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    return {
      success: true,
      data: notifications.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.notification_type,
        relatedOrderId: n.related_order_id,
        isRead: n.is_read,
        createdAt: n.created_at,
      })),
      unreadCount: notifications.filter((n) => !n.is_read).length,
    };
  }

  async markRead(userId: string, notificationId: string) {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, user_id: userId },
      data: { is_read: true, read_at: new Date() },
    });
    return { success: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true, read_at: new Date() },
    });
    return { success: true };
  }
}
