import { Injectable } from '@nestjs/common';
import { OrderUpdateEvent, NotificationEvent } from '@kasieats/shared';

type OrderListener = (event: OrderUpdateEvent) => void;
type NotificationListener = (event: NotificationEvent) => void;

@Injectable()
export class OrderEventsService {
  private orderListeners = new Set<OrderListener>();
  private notificationListeners = new Set<NotificationListener>();

  subscribe(listener: OrderListener) {
    this.orderListeners.add(listener);
    return () => this.orderListeners.delete(listener);
  }

  subscribeNotifications(listener: NotificationListener) {
    this.notificationListeners.add(listener);
    return () => this.notificationListeners.delete(listener);
  }

  emitOrderUpdate(
    orderId: string,
    status: string,
    vendorUserId?: string,
    customerUserId?: string,
    driverUserId?: string,
  ) {
    const event: OrderUpdateEvent = {
      orderId,
      status,
      vendorUserId,
      customerUserId,
      driverUserId,
      timestamp: new Date().toISOString(),
    };

    for (const listener of this.orderListeners) {
      listener(event);
    }
  }

  emitNotification(event: NotificationEvent) {
    for (const listener of this.notificationListeners) {
      listener(event);
    }
  }
}
