// MTHURA takes NO cut of food orders.
// MTHURA revenue comes from platform subscriptions:
//   - Merchants: R350/month (after a 30-day trial)  — Financial Ops Blueprint §1
//   - Drivers:   R100/month (after a 30-day trial)  — Financial Ops Blueprint §2
// These order rates are kept at 0 for informational/legacy reasons only.
export const PLATFORM_COMMISSION_RATE = 0; // unused — platform takes no order commission
export const SERVICE_FEE_RATE = 0; // unused — no service fee on orders

// Merchant subscription billing — R350/month (Financial Ops Blueprint §Revenue §1)
export const VENDOR_SUBSCRIPTION_FEE_ZAR = 350;
export const VENDOR_SUBSCRIPTION_PERIOD_DAYS = 30;
export const VENDOR_TRIAL_PERIOD_DAYS = 30;

// Driver subscription billing — R100/month (Financial Ops Blueprint §Revenue §2)
export const DRIVER_SUBSCRIPTION_FEE_ZAR = 100;
export const DRIVER_SUBSCRIPTION_PERIOD_DAYS = 30;
export const DRIVER_TRIAL_PERIOD_DAYS = 30;

// 7-day grace period after period end — merchant/driver can still complete existing
// work but cannot accept NEW orders/deliveries (Financial Ops Blueprint §Subscription Reminders)
export const SUBSCRIPTION_GRACE_PERIOD_DAYS = 7;

// Delivery fee settlement model for Phase 1 launch.
// Model A: customer pays food + delivery in a single EFT to the merchant;
// merchant settles agreed delivery margin with MTHURA on a weekly/monthly cycle.
// Financial Ops Blueprint §Delivery Fee — Operational Model
export const DELIVERY_FEE_SETTLEMENT_MODEL = 'A' as const;

// Informational suggested delivery amount — customer pays vendor directly via EFT
export const DEFAULT_DELIVERY_FEE_ZAR = 25;

export const OTP_EXPIRY_SECONDS = 60;

// Phase 1 — Food (Launch) marketplace categories (MTHURA Master Blueprint §3)
export const VENDOR_CATEGORIES = [
  'Kota',
  'Braai',
  'Shisanyama',
  'Chicken',
  'Burgers',
  'Pap & Meat',
  'Fish',
  'Pizza',
  'Breakfast',
  'Bakery',
  'Desserts',
  'Drinks',
  'Ice Cream',
  'Family Meals',
  'Specials',
] as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Order Received',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready for Pickup',
  picked_up: 'Picked Up',
  en_route: 'On the Way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

// EFT proof-of-payment states for food orders (MTHURA launch payment model).
// Customer pays the vendor via EFT and uploads proof; the vendor verifies before
// the kitchen starts. MTHURA never processes food purchase funds.
// States: awaiting_proof → proof_submitted → verified (Payment Confirmed) | rejected
export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  not_applicable: 'Not applicable',
  awaiting_proof: 'Awaiting EFT proof',
  proof_submitted: 'Proof submitted',
  verified: 'Payment Confirmed',
  rejected: 'Proof rejected',
};

// Alias for explicit import — verified = Payment Confirmed (Financial Ops Blueprint)
export const ORDER_PAYMENT_STATUS_LABELS = PAYMENT_STATUS_LABELS;

export const SOUTH_AFRICA_COUNTRY_CODE = '27';

export const DEFAULT_CITY = 'Rustenburg';

export const DRIVER_EARNINGS_SHARE = 0.6;

// Brand / company constants (MTHURA Master Blueprint)
export const BRAND_NAME = 'MTHURA';
export const BRAND_TAGLINE = 'Built for the Township Economy';
export const COMPANY_LEGAL_NAME = 'Nkanyezi Tech Solutions (Pty) Ltd';
