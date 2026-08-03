import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  VENDOR_SUBSCRIPTION_FEE_ZAR,
  VENDOR_SUBSCRIPTION_PERIOD_DAYS,
  VENDOR_TRIAL_PERIOD_DAYS,
  DRIVER_SUBSCRIPTION_FEE_ZAR,
  DRIVER_SUBSCRIPTION_PERIOD_DAYS,
  DRIVER_TRIAL_PERIOD_DAYS,
  SUBSCRIPTION_GRACE_PERIOD_DAYS,
} from '@kasieats/shared';

// ─── Grace-period access helper ──────────────────────────────────────────────
// Active access = status in trialing|active|past_due AND now <= grace_ends_at
// (grace_ends_at = current_period_end + 7 days, Financial Ops Blueprint §Grace)
// Expired: status=expired OR now > grace_ends_at — cannot accept NEW work.

export interface SubscriptionAccessRecord {
  status: string;
  current_period_end: Date;
  grace_ends_at: Date | null;
}

export function hasActiveAccess(subscription: SubscriptionAccessRecord | null): boolean {
  if (!subscription) return false;
  if (!['trialing', 'active', 'past_due'].includes(subscription.status)) return false;
  const now = new Date();
  // Use grace_ends_at when present; fall back to period_end + GRACE for legacy rows
  const graceCutoff =
    subscription.grace_ends_at ??
    new Date(
      subscription.current_period_end.getTime() +
        SUBSCRIPTION_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000,
    );
  return now <= graceCutoff;
}

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // ─── Merchant subscriptions ──────────────────────────────────────────────

  async getMySubscription(vendorUserId: string) {
    const vendor = await this.getVendorByUser(vendorUserId);

    const subscription = await this.prisma.vendorSubscription.findFirst({
      where: { vendor_id: vendor.id },
      orderBy: { created_at: 'desc' },
      include: { payments: { orderBy: { created_at: 'desc' }, take: 5 } },
    });

    if (!subscription) {
      return { success: true, data: null };
    }

    return {
      success: true,
      data: this.formatSubscription(subscription),
    };
  }

  /**
   * Initiate merchant subscription checkout — R350/month (Financial Ops Blueprint §1)
   */
  async initiateCheckout(vendorUserId: string) {
    const vendor = await this.getVendorByUser(vendorUserId);

    let subscription = await this.prisma.vendorSubscription.findFirst({
      where: { vendor_id: vendor.id },
      orderBy: { created_at: 'desc' },
    });

    if (!subscription) {
      // Create a new subscription record pending first payment
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setDate(periodEnd.getDate() + VENDOR_SUBSCRIPTION_PERIOD_DAYS);
      const graceEnd = new Date(periodEnd);
      graceEnd.setDate(graceEnd.getDate() + SUBSCRIPTION_GRACE_PERIOD_DAYS);

      subscription = await this.prisma.vendorSubscription.create({
        data: {
          vendor_id: vendor.id,
          status: 'past_due',
          amount_zar: VENDOR_SUBSCRIPTION_FEE_ZAR,
          current_period_start: now,
          current_period_end: periodEnd,
          grace_ends_at: graceEnd,
        },
      });
    }

    const reference = `sub_mock_${randomUUID().replace(/-/g, '')}`;

    const payment = await this.prisma.subscriptionPayment.create({
      data: {
        subscription_id: subscription.id,
        amount_zar: VENDOR_SUBSCRIPTION_FEE_ZAR,
        status: 'pending',
        gateway: 'mock_ozow',
        transaction_reference: reference,
      },
    });

    return {
      success: true,
      data: {
        reference: payment.transaction_reference,
        amount: VENDOR_SUBSCRIPTION_FEE_ZAR,
        currency: 'ZAR',
        paymentUrl: `/api/v1/subscriptions/mock-checkout/${reference}/confirm`,
        gateway: 'mock_ozow',
        note: 'Ozow is reserved for MTHURA platform subscription billing (future). Food payments are handled directly between customers and vendors via EFT.',
      },
    };
  }

  // ─── Driver subscriptions ────────────────────────────────────────────────

  async getMyDriverSubscription(driverUserId: string) {
    const driver = await this.getDriverByUser(driverUserId);

    const subscription = await this.prisma.driverSubscription.findFirst({
      where: { driver_id: driver.id },
      orderBy: { created_at: 'desc' },
      include: { payments: { orderBy: { created_at: 'desc' }, take: 5 } },
    });

    if (!subscription) {
      return { success: true, data: null };
    }

    return {
      success: true,
      data: this.formatDriverSubscription(subscription),
    };
  }

  /**
   * Initiate driver subscription checkout — R100/month (Financial Ops Blueprint §2)
   */
  async initiateDriverCheckout(driverUserId: string) {
    const driver = await this.getDriverByUser(driverUserId);

    let subscription = await this.prisma.driverSubscription.findFirst({
      where: { driver_id: driver.id },
      orderBy: { created_at: 'desc' },
    });

    if (!subscription) {
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setDate(periodEnd.getDate() + DRIVER_SUBSCRIPTION_PERIOD_DAYS);
      const graceEnd = new Date(periodEnd);
      graceEnd.setDate(graceEnd.getDate() + SUBSCRIPTION_GRACE_PERIOD_DAYS);

      subscription = await this.prisma.driverSubscription.create({
        data: {
          driver_id: driver.id,
          status: 'past_due',
          amount_zar: DRIVER_SUBSCRIPTION_FEE_ZAR,
          current_period_start: now,
          current_period_end: periodEnd,
          grace_ends_at: graceEnd,
        },
      });
    }

    const reference = `dsub_mock_${randomUUID().replace(/-/g, '')}`;

    const payment = await this.prisma.driverSubscriptionPayment.create({
      data: {
        subscription_id: subscription.id,
        amount_zar: DRIVER_SUBSCRIPTION_FEE_ZAR,
        status: 'pending',
        gateway: 'mock_ozow',
        transaction_reference: reference,
      },
    });

    return {
      success: true,
      data: {
        reference: payment.transaction_reference,
        amount: DRIVER_SUBSCRIPTION_FEE_ZAR,
        currency: 'ZAR',
        paymentUrl: `/api/v1/subscriptions/mock-checkout/${reference}/confirm`,
        gateway: 'mock_ozow',
        note: 'Ozow is reserved for MTHURA platform subscription billing (future). This is a sandbox mock confirmation.',
      },
    };
  }

  // ─── Shared mock confirm (handles vendor + driver payment references) ─────

  async confirmMockCheckout(reference: string) {
    const vendorPayment = await this.prisma.subscriptionPayment.findUnique({
      where: { transaction_reference: reference },
      include: { subscription: { include: { vendor: true } } },
    });

    if (vendorPayment) {
      return this.confirmVendorPayment(vendorPayment);
    }

    const driverPayment = await this.prisma.driverSubscriptionPayment.findUnique({
      where: { transaction_reference: reference },
      include: { subscription: { include: { driver: true } } },
    });

    if (driverPayment) {
      return this.confirmDriverPayment(driverPayment);
    }

    throw new NotFoundException('Payment reference not found');
  }

  private async confirmVendorPayment(payment: {
    id: string;
    status: string;
    subscription: {
      id: string;
      current_period_end: Date;
      vendor: { user_id: string };
    };
  }) {
    if (payment.status === 'paid') {
      return { success: true, message: 'Payment already confirmed' };
    }

    const now = new Date();
    const subscription = payment.subscription;
    const baseDate =
      subscription.current_period_end > now ? subscription.current_period_end : now;
    const newPeriodEnd = new Date(baseDate);
    newPeriodEnd.setDate(newPeriodEnd.getDate() + VENDOR_SUBSCRIPTION_PERIOD_DAYS);
    const newGraceEnd = new Date(newPeriodEnd);
    newGraceEnd.setDate(newGraceEnd.getDate() + SUBSCRIPTION_GRACE_PERIOD_DAYS);

    await this.prisma.$transaction([
      this.prisma.subscriptionPayment.update({
        where: { id: payment.id },
        data: { status: 'paid', paid_at: now },
      }),
      this.prisma.vendorSubscription.update({
        where: { id: subscription.id },
        data: {
          status: 'active',
          current_period_end: newPeriodEnd,
          grace_ends_at: newGraceEnd,
          last_payment_at: now,
        },
      }),
    ]);

    await this.notifications.createNotification(
      subscription.vendor.user_id,
      'Subscription activated',
      `Your MTHURA merchant subscription of R${VENDOR_SUBSCRIPTION_FEE_ZAR} has been paid. Active until ${newPeriodEnd.toLocaleDateString('en-ZA')}.`,
      'subscription_paid',
    );

    return {
      success: true,
      message: 'Subscription payment confirmed',
      subscriptionId: subscription.id,
      subscriberType: 'vendor',
      activeUntil: newPeriodEnd,
    };
  }

  private async confirmDriverPayment(payment: {
    id: string;
    status: string;
    subscription: {
      id: string;
      current_period_end: Date;
      driver: { user_id: string };
    };
  }) {
    if (payment.status === 'paid') {
      return { success: true, message: 'Payment already confirmed' };
    }

    const now = new Date();
    const subscription = payment.subscription;
    const baseDate =
      subscription.current_period_end > now ? subscription.current_period_end : now;
    const newPeriodEnd = new Date(baseDate);
    newPeriodEnd.setDate(newPeriodEnd.getDate() + DRIVER_SUBSCRIPTION_PERIOD_DAYS);
    const newGraceEnd = new Date(newPeriodEnd);
    newGraceEnd.setDate(newGraceEnd.getDate() + SUBSCRIPTION_GRACE_PERIOD_DAYS);

    await this.prisma.$transaction([
      this.prisma.driverSubscriptionPayment.update({
        where: { id: payment.id },
        data: { status: 'paid', paid_at: now },
      }),
      this.prisma.driverSubscription.update({
        where: { id: subscription.id },
        data: {
          status: 'active',
          current_period_end: newPeriodEnd,
          grace_ends_at: newGraceEnd,
          last_payment_at: now,
        },
      }),
    ]);

    await this.notifications.createNotification(
      subscription.driver.user_id,
      'Subscription activated',
      `Your MTHURA driver subscription of R${DRIVER_SUBSCRIPTION_FEE_ZAR} has been paid. Active until ${newPeriodEnd.toLocaleDateString('en-ZA')}.`,
      'subscription_paid',
    );

    return {
      success: true,
      message: 'Subscription payment confirmed',
      subscriptionId: subscription.id,
      subscriberType: 'driver',
      activeUntil: newPeriodEnd,
    };
  }

  async handleOzowCallback(body: Record<string, unknown>) {
    // Real Ozow signing verification goes here when PAYMENT_MODE=production.
    // For now in sandbox mode, delegate to mock confirm flow.
    const reference = body['TransactionReference'] as string | undefined;
    const status = body['Status'] as string | undefined;

    if (!reference) {
      return { success: false, message: 'Missing TransactionReference' };
    }

    if (status === 'Complete') {
      try {
        return await this.confirmMockCheckout(reference);
      } catch {
        return { success: false, message: 'Could not process callback' };
      }
    }

    return { success: true, message: `Received callback status: ${status ?? 'unknown'}` };
  }

  /**
   * Create a 30-day trial subscription when a vendor is first approved.
   * Called from AdminService.approveVendor.
   */
  async createTrialSubscription(vendorId: string): Promise<void> {
    const existing = await this.prisma.vendorSubscription.findFirst({
      where: { vendor_id: vendorId },
    });

    if (existing) {
      return; // Already has a subscription record
    }

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + VENDOR_TRIAL_PERIOD_DAYS);
    const graceEnd = new Date(trialEnd);
    graceEnd.setDate(graceEnd.getDate() + SUBSCRIPTION_GRACE_PERIOD_DAYS);

    await this.prisma.vendorSubscription.create({
      data: {
        vendor_id: vendorId,
        status: 'trialing',
        amount_zar: VENDOR_SUBSCRIPTION_FEE_ZAR,
        current_period_start: now,
        current_period_end: trialEnd,
        grace_ends_at: graceEnd,
        trial_ends_at: trialEnd,
      },
    });
  }

  /**
   * Create a 30-day trial subscription when a driver is first approved / registered.
   * Called from AdminService.approveDriver.
   */
  async createDriverTrialSubscription(driverId: string): Promise<void> {
    const existing = await this.prisma.driverSubscription.findFirst({
      where: { driver_id: driverId },
    });

    if (existing) {
      return;
    }

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + DRIVER_TRIAL_PERIOD_DAYS);
    const graceEnd = new Date(trialEnd);
    graceEnd.setDate(graceEnd.getDate() + SUBSCRIPTION_GRACE_PERIOD_DAYS);

    await this.prisma.driverSubscription.create({
      data: {
        driver_id: driverId,
        status: 'trialing',
        amount_zar: DRIVER_SUBSCRIPTION_FEE_ZAR,
        current_period_start: now,
        current_period_end: trialEnd,
        grace_ends_at: graceEnd,
        trial_ends_at: trialEnd,
      },
    });
  }

  private formatSubscription(subscription: {
    id: string;
    vendor_id: string;
    status: string;
    amount_zar: { toNumber: () => number } | number;
    current_period_start: Date;
    current_period_end: Date;
    grace_ends_at: Date | null;
    trial_ends_at: Date | null;
    cancelled_at: Date | null;
    last_payment_at: Date | null;
    created_at: Date;
    payments?: Array<{
      id: string;
      amount_zar: { toNumber: () => number } | number;
      status: string;
      gateway: string;
      transaction_reference: string | null;
      paid_at: Date | null;
      created_at: Date;
    }>;
  }) {
    return {
      id: subscription.id,
      vendorId: subscription.vendor_id,
      status: subscription.status,
      amountZar: this.toNumber(subscription.amount_zar),
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      graceEndsAt: subscription.grace_ends_at,
      trialEndsAt: subscription.trial_ends_at,
      cancelledAt: subscription.cancelled_at,
      lastPaymentAt: subscription.last_payment_at,
      createdAt: subscription.created_at,
      hasActiveAccess: hasActiveAccess(subscription),
      recentPayments: (subscription.payments ?? []).map((p) => ({
        id: p.id,
        amountZar: this.toNumber(p.amount_zar),
        status: p.status,
        gateway: p.gateway,
        reference: p.transaction_reference,
        paidAt: p.paid_at,
        createdAt: p.created_at,
      })),
    };
  }

  private formatDriverSubscription(subscription: {
    id: string;
    driver_id: string;
    status: string;
    amount_zar: { toNumber: () => number } | number;
    current_period_start: Date;
    current_period_end: Date;
    grace_ends_at: Date | null;
    trial_ends_at: Date | null;
    cancelled_at: Date | null;
    last_payment_at: Date | null;
    created_at: Date;
    payments?: Array<{
      id: string;
      amount_zar: { toNumber: () => number } | number;
      status: string;
      gateway: string;
      transaction_reference: string | null;
      paid_at: Date | null;
      created_at: Date;
    }>;
  }) {
    return {
      id: subscription.id,
      driverId: subscription.driver_id,
      status: subscription.status,
      amountZar: this.toNumber(subscription.amount_zar),
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      graceEndsAt: subscription.grace_ends_at,
      trialEndsAt: subscription.trial_ends_at,
      cancelledAt: subscription.cancelled_at,
      lastPaymentAt: subscription.last_payment_at,
      createdAt: subscription.created_at,
      hasActiveAccess: hasActiveAccess(subscription),
      recentPayments: (subscription.payments ?? []).map((p) => ({
        id: p.id,
        amountZar: this.toNumber(p.amount_zar),
        status: p.status,
        gateway: p.gateway,
        reference: p.transaction_reference,
        paidAt: p.paid_at,
        createdAt: p.created_at,
      })),
    };
  }

  private toNumber(value: { toNumber: () => number } | number): number {
    return typeof value === 'number' ? value : value.toNumber();
  }

  private async getVendorByUser(vendorUserId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { user_id: vendorUserId } });
    if (!vendor) {
      throw new ForbiddenException('No vendor profile for this account');
    }
    return vendor;
  }

  private async getDriverByUser(driverUserId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { user_id: driverUserId } });
    if (!driver) {
      throw new ForbiddenException('No driver profile for this account');
    }
    return driver;
  }
}
