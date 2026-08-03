import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@kasieats/db';
import { PrismaService } from '../prisma/prisma.service';

interface CreateNotificationOptions {
  relatedOrderId?: string;
  relatedDeliveryId?: string;
  actionUrl?: string;
  data?: Record<string, unknown>;
  method?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Best-effort notification creation. Never throws so that it can be safely
   * called from within order/delivery flows without risking the main operation.
   */
  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: string,
    options: CreateNotificationOptions = {},
  ) {
    try {
      const actionUrl =
        options.actionUrl ??
        (options.data ? JSON.stringify(options.data) : undefined);

      return await this.prisma.notification.create({
        data: {
          user_id: userId,
          title,
          message,
          notification_type: type,
          related_order_id: options.relatedOrderId,
          related_delivery_id: options.relatedDeliveryId,
          action_url: actionUrl,
          notification_method: options.method ?? 'in_app',
          sent_at: new Date(),
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to create notification: ${(err as Error).message}`);
      return null;
    }
  }

  async list(userId: string, unreadOnly = false) {
    const where: Prisma.NotificationWhereInput = { user_id: userId };
    if (unreadOnly) {
      where.is_read = false;
    }

    const notifications = await this.prisma.notification.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    const unreadCount = await this.prisma.notification.count({
      where: { user_id: userId, is_read: false },
    });

    return {
      success: true,
      unreadCount,
      data: notifications.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.notification_type,
        relatedOrderId: n.related_order_id,
        relatedDeliveryId: n.related_delivery_id,
        actionUrl: n.action_url,
        isRead: n.is_read,
        createdAt: n.created_at,
      })),
    };
  }

  async markRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, user_id: userId },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.update({
      where: { id },
      data: { is_read: true, read_at: new Date() },
    });

    return { success: true, message: 'Notification marked as read' };
  }
}
