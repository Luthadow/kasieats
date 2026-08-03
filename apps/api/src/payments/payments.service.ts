import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async initiate(customerUserId: string, orderId: string) {
    const order = await this.getCustomerOrder(customerUserId, orderId);

    if (order.payment_method !== 'card') {
      throw new BadRequestException('Only card orders require online payment');
    }

    const payment = await this.prisma.payment.findUnique({ where: { order_id: order.id } });
    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }
    if (payment.status === 'paid') {
      throw new BadRequestException('Order is already paid');
    }

    const reference = `mock_${randomUUID().replace(/-/g, '')}`;

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        payment_gateway: 'mock_paystack',
        transaction_reference: reference,
        status: 'processing',
      },
    });

    await this.prisma.order.update({
      where: { id: order.id },
      data: { payment_status: 'processing' },
    });

    return {
      success: true,
      data: {
        reference,
        gateway: 'mock_paystack',
        amount: Number(payment.amount),
        paymentUrl: `/api/v1/payments/mock-checkout/${reference}`,
      },
    };
  }

  async confirmMockCheckout(reference: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { transaction_reference: reference },
      include: { order: { include: { customer: true } } },
    });

    if (!payment) {
      throw new NotFoundException('Payment reference not found');
    }
    if (payment.status === 'paid') {
      return { success: true, message: 'Payment already confirmed' };
    }

    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'paid', processed_at: now },
      }),
      this.prisma.order.update({
        where: { id: payment.order_id },
        data: { payment_status: 'paid' },
      }),
    ]);

    await this.notifications.createNotification(
      payment.order.customer.user_id,
      'Payment successful',
      `Your payment of R${Number(payment.amount).toFixed(2)} was successful.`,
      'payment_confirmed',
      { relatedOrderId: payment.order_id },
    );

    return { success: true, message: 'Payment confirmed', orderId: payment.order_id };
  }

  async getPaymentStatus(customerUserId: string, orderId: string) {
    const order = await this.getCustomerOrder(customerUserId, orderId);
    const payment = await this.prisma.payment.findUnique({ where: { order_id: order.id } });

    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    return {
      success: true,
      data: {
        orderId: order.id,
        amount: Number(payment.amount),
        paymentMethod: payment.payment_method,
        gateway: payment.payment_gateway,
        reference: payment.transaction_reference,
        status: payment.status,
        processedAt: payment.processed_at,
      },
    };
  }

  private async getCustomerOrder(customerUserId: string, orderId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { user_id: customerUserId },
    });
    if (!customer) {
      throw new ForbiddenException('Complete your profile first');
    }
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customer_id: customer.id },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }
}
