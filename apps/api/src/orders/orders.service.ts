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
import { CreateReviewDto } from './dto/create-review.dto';

type OrderWithDetails = Prisma.OrderGetPayload<{
  include: {
    vendor: true;
    order_items: { include: { menu_item: true } };
    delivery: { include: { driver: true } };
  };
}>;

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

    await this.notifications.notifyVendorByVendorId(
      vendor.id,
      'New order received!',
      `You have a new order for R${totalAmount.toFixed(2)}. Accept it now.`,
      'new_order',
      order.id,
    );

    await this.notifications.notify({
      userId: customerUserId,
      title: 'Order placed',
      message: `Your order from ${vendor.store_name} has been sent to the kitchen.`,
      notificationType: 'order_placed',
      relatedOrderId: order.id,
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

  async getOrderTracking(customerUserId: string, orderId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { user_id: customerUserId },
    });

    if (!customer) {
      throw new ForbiddenException();
    }

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customer_id: customer.id },
      include: {
        delivery: {
          include: {
            driver: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const driver = order.delivery?.driver;

    return {
      success: true,
      data: {
        orderId: order.id,
        orderStatus: order.status,
        deliveryStatus: order.delivery?.status ?? null,
        driver: driver
          ? {
              name: `${driver.first_name} ${driver.last_name}`,
              rating: Number(driver.average_rating),
              vehicleType: driver.vehicle_type,
              latitude: driver.current_latitude ? Number(driver.current_latitude) : null,
              longitude: driver.current_longitude ? Number(driver.current_longitude) : null,
              locationUpdatedAt: driver.location_updated_at,
            }
          : null,
      },
    };
  }

  async getOrderReviews(customerUserId: string, orderId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { user_id: customerUserId },
    });

    if (!customer) {
      throw new ForbiddenException();
    }

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customer_id: customer.id },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const reviews = await this.prisma.review.findMany({
      where: { order_id: orderId },
    });

    return {
      success: true,
      data: reviews.map((r) => ({
        id: r.id,
        revieweeType: r.reviewee_type,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.created_at,
      })),
    };
  }

  async submitReview(customerUserId: string, orderId: string, dto: CreateReviewDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { user_id: customerUserId },
    });

    if (!customer) {
      throw new ForbiddenException();
    }

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customer_id: customer.id },
      include: { delivery: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'delivered') {
      throw new BadRequestException('You can only review delivered orders');
    }

    if (dto.revieweeType === 'driver' && !order.driver_id) {
      throw new BadRequestException('No driver assigned to this order');
    }

    const existing = await this.prisma.review.findFirst({
      where: { order_id: orderId, reviewee_type: dto.revieweeType },
    });

    if (existing) {
      throw new BadRequestException(`You already reviewed the ${dto.revieweeType} for this order`);
    }

    const review = await this.prisma.review.create({
      data: {
        order_id: orderId,
        reviewer_id: customer.id,
        reviewer_type: 'customer',
        reviewee_type: dto.revieweeType,
        vendor_id: dto.revieweeType === 'vendor' ? order.vendor_id : null,
        driver_id: dto.revieweeType === 'driver' ? order.driver_id : null,
        rating: dto.rating,
        comment: dto.comment,
      },
    });

    if (dto.revieweeType === 'vendor') {
      await this.updateVendorRating(order.vendor_id);
    } else if (order.driver_id) {
      await this.updateDriverRating(order.driver_id);
    }

    return {
      success: true,
      data: {
        id: review.id,
        revieweeType: review.reviewee_type,
        rating: review.rating,
        comment: review.comment,
      },
    };
  }

  private async updateVendorRating(vendorId: string) {
    const agg = await this.prisma.review.aggregate({
      where: { vendor_id: vendorId, reviewee_type: 'vendor' },
      _avg: { rating: true },
      _count: true,
    });

    await this.prisma.vendor.update({
      where: { id: vendorId },
      data: {
        average_rating: agg._avg.rating ?? 0,
        rating_count: agg._count,
      },
    });
  }

  private async updateDriverRating(driverId: string) {
    const agg = await this.prisma.review.aggregate({
      where: { driver_id: driverId, reviewee_type: 'driver' },
      _avg: { rating: true },
      _count: true,
    });

    await this.prisma.driver.update({
      where: { id: driverId },
      data: {
        average_rating: agg._avg.rating ?? 0,
        rating_count: agg._count,
      },
    });
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
            id: order.delivery.id,
            status: order.delivery.status,
            driver: order.delivery.driver
              ? {
                  name: `${order.delivery.driver.first_name} ${order.delivery.driver.last_name}`,
                  rating: Number(order.delivery.driver.average_rating),
                  vehicleType: order.delivery.driver.vehicle_type,
                  latitude: order.delivery.driver.current_latitude
                    ? Number(order.delivery.driver.current_latitude)
                    : null,
                  longitude: order.delivery.driver.current_longitude
                    ? Number(order.delivery.driver.current_longitude)
                    : null,
                }
              : null,
          }
        : null,
    };
  }
}
