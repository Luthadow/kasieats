import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DEFAULT_DELIVERY_FEE_ZAR,
  PLATFORM_COMMISSION_RATE,
  SERVICE_FEE_RATE,
} from '@kasieats/shared';
import { Prisma } from '@kasieats/db';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { formatOrder } from './order.formatter';

const ORDER_INCLUDE = {
  vendor: true,
  order_items: { include: { menu_item: true } },
  delivery: { include: { driver: true } },
} satisfies Prisma.OrderInclude;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async createOrder(customerUserId: string, dto: CreateOrderDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { user_id: customerUserId },
    });

    if (!customer) {
      throw new ForbiddenException('Complete your profile before ordering');
    }

    const vendor = await this.prisma.vendor.findUnique({ where: { id: dto.vendorId } });
    if (!vendor || vendor.status !== 'active') {
      throw new NotFoundException('Vendor not available');
    }

    // Deduplicate menu item ids for validation lookup.
    const uniqueMenuItemIds = [...new Set(dto.items.map((i) => i.menuItemId))];
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: uniqueMenuItemIds }, vendor_id: vendor.id, is_available: true },
    });

    if (menuItems.length !== uniqueMenuItemIds.length) {
      throw new BadRequestException('One or more menu items are unavailable');
    }

    const itemMap = new Map(menuItems.map((item) => [item.id, item]));

    let subtotal = 0;
    const orderItemsData = dto.items.map((item) => {
      const menuItem = itemMap.get(item.menuItemId)!;
      // For MVP we do not trust extra prices sent by the client. Extras are
      // recorded (by name) but never affect pricing.
      const extrasTotal = 0;
      const sanitizedExtras = (item.extras ?? []).map((extra) => ({
        name: extra.name,
        price: 0,
      }));
      const lineTotal = Number(menuItem.price) * item.quantity;
      subtotal += lineTotal;

      return {
        menu_item_id: menuItem.id,
        quantity: item.quantity,
        price_per_item: Number(menuItem.price),
        extras: sanitizedExtras,
        extras_total: extrasTotal,
        special_instructions: item.specialInstructions,
      };
    });

    subtotal = Math.round(subtotal * 100) / 100;
    const deliveryFee = DEFAULT_DELIVERY_FEE_ZAR;
    const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE * 100) / 100;
    const commissionRate = Number(vendor.commission_rate) / 100 || PLATFORM_COMMISSION_RATE;
    const vendorPayout = Math.round(subtotal * (1 - commissionRate) * 100) / 100;
    const totalAmount = Math.round((subtotal + deliveryFee + serviceFee) * 100) / 100;

    const order = await this.prisma.order.create({
      data: {
        customer_id: customer.id,
        vendor_id: vendor.id,
        subtotal,
        delivery_fee: deliveryFee,
        service_fee: serviceFee,
        total_amount: totalAmount,
        commission_rate: commissionRate * 100,
        vendor_payout: vendorPayout,
        payment_method: dto.paymentMethod,
        payment_status: dto.paymentMethod === 'cash' ? 'pending' : 'pending',
        status: 'pending',
        delivery_address: dto.deliveryAddress,
        delivery_latitude: dto.deliveryLatitude,
        delivery_longitude: dto.deliveryLongitude,
        special_instructions: dto.specialInstructions,
        estimated_delivery_minutes: 35,
        order_items: {
          create: orderItemsData.map((item) => ({
            menu_item: { connect: { id: item.menu_item_id } },
            quantity: item.quantity,
            price_per_item: item.price_per_item,
            extras: item.extras as unknown as Prisma.InputJsonValue,
            extras_total: item.extras_total,
            special_instructions: item.special_instructions,
          })),
        },
        payment: {
          create: {
            amount: totalAmount,
            payment_method: dto.paymentMethod,
            status: 'pending',
          },
        },
      },
      include: ORDER_INCLUDE,
    });

    await this.notifications.createNotification(
      vendor.user_id,
      'New order received',
      `You have a new order for R${totalAmount.toFixed(2)}.`,
      'order_placed',
      { relatedOrderId: order.id },
    );

    return {
      success: true,
      data: formatOrder(order),
    };
  }

  async listCustomerOrders(customerUserId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { user_id: customerUserId },
    });

    if (!customer) {
      return { success: true, data: [] };
    }

    const orders = await this.prisma.order.findMany({
      where: { customer_id: customer.id },
      include: ORDER_INCLUDE,
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    return {
      success: true,
      data: orders.map((order) => formatOrder(order)),
    };
  }

  async getOrder(customerUserId: string, orderId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { user_id: customerUserId },
    });

    if (!customer) {
      throw new ForbiddenException();
    }

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customer_id: customer.id },
      include: ORDER_INCLUDE,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return { success: true, data: formatOrder(order) };
  }

  async cancelOrder(customerUserId: string, orderId: string, reason?: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { user_id: customerUserId },
    });
    if (!customer) {
      throw new ForbiddenException();
    }

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customer_id: customer.id },
      include: { vendor: true },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!['pending', 'accepted'].includes(order.status)) {
      throw new BadRequestException('Order can no longer be cancelled');
    }

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'cancelled',
        cancelled_at: new Date(),
        cancellation_reason: reason ?? 'Cancelled by customer',
      },
      include: ORDER_INCLUDE,
    });

    await this.notifications.createNotification(
      order.vendor.user_id,
      'Order cancelled',
      'A customer cancelled their order.',
      'order_cancelled',
      { relatedOrderId: order.id },
    );

    return { success: true, data: formatOrder(updated) };
  }

  async getVendorInbox(vendorUserId: string, status?: string) {
    const vendor = await this.getVendorByUser(vendorUserId);

    const orders = await this.prisma.order.findMany({
      where: {
        vendor_id: vendor.id,
        ...(status && { status }),
      },
      include: ORDER_INCLUDE,
      orderBy: { created_at: 'desc' },
      take: 100,
    });

    return { success: true, data: orders.map((order) => formatOrder(order)) };
  }

  async acceptOrder(vendorUserId: string, orderId: string) {
    const order = await this.getVendorOrder(vendorUserId, orderId);
    if (order.status !== 'pending') {
      throw new BadRequestException('Only pending orders can be accepted');
    }

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: { status: 'accepted', accepted_by_vendor_at: new Date() },
      include: ORDER_INCLUDE,
    });

    await this.notifyCustomer(order.customer_id, order.id, 'Order accepted', 'The vendor accepted your order and will start preparing it.');

    return { success: true, data: formatOrder(updated) };
  }

  async rejectOrder(vendorUserId: string, orderId: string, reason?: string) {
    const order = await this.getVendorOrder(vendorUserId, orderId);
    if (!['pending', 'accepted'].includes(order.status)) {
      throw new BadRequestException('Order can no longer be rejected');
    }

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'rejected',
        rejection_reason: reason ?? 'Rejected by vendor',
        cancelled_at: new Date(),
      },
      include: ORDER_INCLUDE,
    });

    await this.notifyCustomer(order.customer_id, order.id, 'Order rejected', 'Unfortunately the vendor could not accept your order.');

    return { success: true, data: formatOrder(updated) };
  }

  async markPreparing(vendorUserId: string, orderId: string) {
    const order = await this.getVendorOrder(vendorUserId, orderId);
    if (!['accepted', 'preparing'].includes(order.status)) {
      throw new BadRequestException('Order must be accepted before preparing');
    }

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: { status: 'preparing' },
      include: ORDER_INCLUDE,
    });

    await this.notifyCustomer(order.customer_id, order.id, 'Order being prepared', 'The vendor is preparing your order.');

    return { success: true, data: formatOrder(updated) };
  }

  async markReady(vendorUserId: string, orderId: string) {
    const order = await this.getVendorOrder(vendorUserId, orderId);
    if (!['accepted', 'preparing'].includes(order.status)) {
      throw new BadRequestException('Order must be accepted/preparing before it can be ready');
    }

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: { status: 'ready', marked_as_ready_at: new Date() },
      include: ORDER_INCLUDE,
    });

    await this.notifyCustomer(order.customer_id, order.id, 'Order ready', 'Your order is ready and waiting for a driver.');
    await this.notifyAvailableDrivers(order.id, updated.vendor.store_name);

    return { success: true, data: formatOrder(updated) };
  }

  private async notifyAvailableDrivers(orderId: string, storeName: string) {
    const drivers = await this.prisma.driver.findMany({
      where: { status: 'active', is_online: true },
      select: { user_id: true },
      take: 50,
    });

    await Promise.all(
      drivers.map((driver) =>
        this.notifications.createNotification(
          driver.user_id,
          'New delivery available',
          `An order from ${storeName} is ready for pickup.`,
          'delivery_available',
          { relatedOrderId: orderId },
        ),
      ),
    );
  }

  private async notifyCustomer(customerId: string, orderId: string, title: string, message: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { user_id: true },
    });
    if (customer) {
      await this.notifications.createNotification(customer.user_id, title, message, 'order_update', {
        relatedOrderId: orderId,
      });
    }
  }

  private async getVendorByUser(vendorUserId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { user_id: vendorUserId } });
    if (!vendor) {
      throw new ForbiddenException('No vendor profile for this account');
    }
    return vendor;
  }

  private async getVendorOrder(vendorUserId: string, orderId: string) {
    const vendor = await this.getVendorByUser(vendorUserId);
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, vendor_id: vendor.id },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }
}
