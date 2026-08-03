// MTHURA takes NO cut of food orders.
// MTHURA revenue comes from platform subscriptions:
//   - Merchants: R150/month (after a 30-day trial)
//   - Drivers:   R80/month  (after a 30-day trial)
// These order rates are kept at 0 for informational/legacy reasons only.
export const PLATFORM_COMMISSION_RATE = 0; // unused — platform takes no order commission
export const SERVICE_FEE_RATE = 0; // unused — no service fee on orders

// Merchant subscription billing
export const VENDOR_SUBSCRIPTION_FEE_ZAR = 150;
export const VENDOR_SUBSCRIPTION_PERIOD_DAYS = 30;
export const VENDOR_TRIAL_PERIOD_DAYS = 30;

// Driver subscription billing
export const DRIVER_SUBSCRIPTION_FEE_ZAR = 80;
export const DRIVER_SUBSCRIPTION_PERIOD_DAYS = 30;
export const DRIVER_TRIAL_PERIOD_DAYS = 30;

// Informational suggested delivery amount — customer pays vendor/driver directly
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
export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  not_applicable: 'Not applicable',
  awaiting_proof: 'Awaiting EFT proof',
  proof_submitted: 'Proof submitted',
  verified: 'Payment verified',
  rejected: 'Proof rejected',
};

export const SOUTH_AFRICA_COUNTRY_CODE = '27';

export const DEFAULT_CITY = 'Rustenburg';

export const DRIVER_EARNINGS_SHARE = 0.6;

// Brand / company constants (MTHURA Master Blueprint)
export const BRAND_NAME = 'MTHURA';
export const BRAND_TAGLINE = 'Built for the Township Economy';
export const COMPANY_LEGAL_NAME = 'Nkanyezi Tech Solutions (Pty) Ltd';
