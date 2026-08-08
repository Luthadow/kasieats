import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ConfirmPaymentDto, InitiatePaymentDto, PaymentProvider } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async initiate(customerUserId: string, dto: InitiatePaymentDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { user_id: customerUserId },
    });

    if (!customer) {
      throw new ForbiddenException();
    }

    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, customer_id: customer.id },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.payment_method !== 'card' && order.payment_method !== 'ozow') {
      throw new BadRequestException('Order is not an online payment');
    }

    if (order.payment_status === 'paid') {
      throw new BadRequestException('Order already paid');
    }

    const reference = `KE-${order.id.slice(-8).toUpperCase()}-${Date.now()}`;
    const isSandbox = this.configService.get<string>('PAYMENTS_SANDBOX', 'true') === 'true';

    const payment = await this.prisma.payment.update({
      where: { order_id: order.id },
      data: {
        payment_gateway: dto.provider,
        transaction_reference: reference,
        status: 'processing',
      },
    });

    const providerMeta = this.buildProviderPayload(dto.provider, reference, Number(order.total_amount));

    return {
      success: true,
      data: {
        paymentId: payment.id,
        orderId: order.id,
        amount: Number(order.total_amount),
        currency: 'ZAR',
        provider: dto.provider,
        reference,
        sandbox: isSandbox,
        ...providerMeta,
      },
    };
  }

  async confirm(customerUserId: string, dto: ConfirmPaymentDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { user_id: customerUserId },
    });

    if (!customer) {
      throw new ForbiddenException();
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: dto.paymentId },
      include: { order: true },
    });

    if (!payment || payment.order.customer_id !== customer.id) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === 'paid') {
      return { success: true, data: { status: 'paid', orderId: payment.order_id } };
    }

    const isSandbox = this.configService.get<string>('PAYMENTS_SANDBOX', 'true') === 'true';
    if (!isSandbox && !dto.transactionReference) {
      throw new BadRequestException('Transaction reference required');
    }

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'paid',
          processed_at: new Date(),
          settled_at: new Date(),
          transaction_reference: dto.transactionReference ?? payment.transaction_reference,
        },
      }),
      this.prisma.order.update({
        where: { id: payment.order_id },
        data: { payment_status: 'paid' },
      }),
    ]);

    return {
      success: true,
      data: {
        status: 'paid',
        orderId: payment.order_id,
        amount: Number(payment.amount),
      },
    };
  }

  async handleWebhook(provider: string, reference: string, status: string, signature?: string) {
    this.verifyWebhookSignature(provider, reference, status, signature);

    const payment = await this.prisma.payment.findFirst({
      where: { transaction_reference: reference },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (status.toLowerCase() === 'success' || status.toLowerCase() === 'paid') {
      await this.prisma.$transaction([
        this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'paid',
            payment_gateway: provider,
            processed_at: new Date(),
            settled_at: new Date(),
          },
        }),
        this.prisma.order.update({
          where: { id: payment.order_id },
          data: { payment_status: 'paid' },
        }),
      ]);
    }

    return { success: true };
  }

  private buildProviderPayload(provider: PaymentProvider, reference: string, amount: number) {
    const isSandbox = this.configService.get<string>('PAYMENTS_SANDBOX', 'true') === 'true';

    if (provider === PaymentProvider.OZOW) {
      const siteCode = this.configService.get<string>('OZOW_SITE_CODE', 'TEST-SITE');
      return {
        paymentUrl: isSandbox
          ? `https://pay.ozow.com/sandbox?SiteCode=${siteCode}&Amount=${amount}&TransactionReference=${reference}`
          : `https://pay.ozow.com/?SiteCode=${siteCode}&Amount=${amount}&TransactionReference=${reference}`,
        instructions: 'Redirect customer to Ozow to complete EFT payment',
      };
    }

    const yocoKey = this.configService.get<string>('YOCO_PUBLIC_KEY', 'pk_test_kasieats');
    return {
      paymentUrl: isSandbox ? null : `https://pay.yoco.com/checkout/${reference}`,
      publicKey: yocoKey,
      instructions: isSandbox
        ? 'Sandbox mode: call /payments/confirm after initiate'
        : 'Use Yoco Web SDK with the public key',
    };
  }

  private verifyWebhookSignature(
    provider: string,
    reference: string,
    status: string,
    signature?: string,
  ) {
    const isSandbox = this.configService.get<string>('PAYMENTS_SANDBOX', 'true') === 'true';
    if (isSandbox) {
      return;
    }

    const secret =
      provider === 'ozow'
        ? this.configService.get<string>('OZOW_PRIVATE_KEY')
        : this.configService.get<string>('YOCO_SECRET_KEY');

    if (!secret) {
      throw new BadRequestException('Payment webhook secret not configured');
    }

    if (!signature) {
      throw new BadRequestException('Missing webhook signature');
    }

    const payload = `${reference}:${status}:${provider}`;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    if (signature !== expected && signature !== `sha256=${expected}`) {
      throw new BadRequestException('Invalid webhook signature');
    }
  }
}
