import { Injectable } from '@nestjs/common';

export interface OrderUpdateEvent {
  orderId: string;
  status: string;
  vendorUserId?: string;
  customerUserId?: string;
  driverUserId?: string;
  timestamp: string;
}

type OrderListener = (event: OrderUpdateEvent) => void;

@Injectable()
export class OrderEventsService {
  private listeners = new Set<OrderListener>();

  subscribe(listener: OrderListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
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

    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
