export const PLATFORM_COMMISSION_RATE = 0.15;

export const DEFAULT_DELIVERY_FEE_ZAR = 25;

export const SERVICE_FEE_RATE = 0.05;

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

export const DELIVERY_STATUS_LABELS: Record<string, string> = {
  assigned: 'Assigned',
  picked_up: 'Collected',
  en_route: 'On the Way',
  arrived: 'Arrived',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const SOUTH_AFRICA_COUNTRY_CODE = '27';

export const DEFAULT_CITY = 'Rustenburg';

export const DRIVER_EARNINGS_SHARE = 0.6;
