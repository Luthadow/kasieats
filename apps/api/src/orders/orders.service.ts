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
import { CreateOrderDto } from './dto/create-order.dto';

type OrderWithDetails = Prisma.OrderGetPayload<{
  include: {
    vendor: true;
    order_items: { include: { menu_item: true } };
    delivery: { include: { driver: true } };
  };
}>;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

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

    const menuItemIds = dto.items.map((i) => i.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, vendor_id: vendor.id, is_available: true },
    });

    if (menuItems.length !== menuItemIds.length) {
      throw new BadRequestException('One or more menu items are unavailable');
    }

    const itemMap = new Map(menuItems.map((item) => [item.id, item]));

    let subtotal = 0;
    const orderItemsData = dto.items.map((item) => {
      const menuItem = itemMap.get(item.menuItemId)!;
      const extrasTotal =
        item.extras?.reduce((sum, extra) => sum + extra.price, 0) ?? 0;
      const lineTotal = (Number(menuItem.price) + extrasTotal) * item.quantity;
      subtotal += lineTotal;

      return {
        menu_item_id: menuItem.id,
        quantity: item.quantity,
        price_per_item: Number(menuItem.price),
        extras: item.extras ?? [],
        extras_total: extrasTotal,
        special_instructions: item.specialInstructions,
      };
    });

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
        payment_status: dto.paymentMethod === 'cash' ? 'pending' : 'processing',
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
            status: dto.paymentMethod === 'cash' ? 'pending' : 'processing',
          },
        },
      },
      include: {
        order_items: { include: { menu_item: true } },
        vendor: true,
      },
    });

    return {
      success: true,
      data: this.formatOrder(order),
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
      include: { vendor: true, order_items: { include: { menu_item: true } } },
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    return {
      success: true,
      data: orders.map((order) => this.formatOrder(order)),
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
      include: {
        vendor: true,
        order_items: { include: { menu_item: true } },
        delivery: { include: { driver: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return { success: true, data: this.formatOrder(order) };
  }

  private formatOrder(order: OrderWithDetails | Omit<OrderWithDetails, 'delivery'> & { delivery?: OrderWithDetails['delivery'] | null }) {
    return {
      id: order.id,
      status: order.status,
      paymentStatus: order.payment_status,
      subtotal: Number(order.subtotal),
      deliveryFee: Number(order.delivery_fee),
      serviceFee: Number(order.service_fee),
      totalAmount: Number(order.total_amount),
      deliveryAddress: order.delivery_address,
      specialInstructions: order.special_instructions,
      estimatedDeliveryMinutes: order.estimated_delivery_minutes,
      createdAt: order.created_at,
      vendor: {
        id: order.vendor.id,
        storeName: order.vendor.store_name,
      },
      items: order.order_items.map((item) => ({
        name: item.menu_item.name,
        quantity: item.quantity,
        pricePerItem: Number(item.price_per_item),
        extrasTotal: Number(item.extras_total),
        specialInstructions: item.special_instructions,
      })),
      delivery: order.delivery
        ? {
            status: order.delivery.status,
            driver: order.delivery.driver
              ? {
                  name: `${order.delivery.driver.first_name} ${order.delivery.driver.last_name}`,
                  rating: Number(order.delivery.driver.average_rating),
                }
              : null,
          }
        : null,
    };
  }
}
