// KasiEats takes NO cut of food orders.
// The only money KasiEats collects is the vendor subscription of R350/month.
// These rates are kept at 0 for informational/legacy reasons only.
export const PLATFORM_COMMISSION_RATE = 0; // unused — platform takes no order commission
export const SERVICE_FEE_RATE = 0; // unused — no service fee on orders

// Vendor subscription billing (the only KasiEats revenue)
export const VENDOR_SUBSCRIPTION_FEE_ZAR = 350;
export const VENDOR_SUBSCRIPTION_PERIOD_DAYS = 30;
export const VENDOR_TRIAL_PERIOD_DAYS = 7;

// Informational suggested delivery amount — customer pays vendor/driver directly
export const DEFAULT_DELIVERY_FEE_ZAR = 25;

export const OTP_EXPIRY_SECONDS = 60;

export const VENDOR_CATEGORIES = [
  'Kota',
  'Shisanyama',
  'Braai',
  'Home Meals',
  'Chicken',
  'Mogodu',
  'Burgers',
  'Desserts',
  'Drinks',
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

export const SOUTH_AFRICA_COUNTRY_CODE = '27';

export const DEFAULT_CITY = 'Rustenburg';

export const DRIVER_EARNINGS_SHARE = 0.6;
