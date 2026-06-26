export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  DRIVER = 'DRIVER',
  VENDOR_OWNER = 'VENDOR_OWNER',
  VENDOR_STAFF = 'VENDOR_STAFF',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
  DELETED = 'deleted',
}

export enum AuthProvider {
  PHONE = 'phone',
  EMAIL = 'email',
  FIREBASE = 'firebase',
}

export enum OrderStatus {
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAYMENT_VERIFIED = 'PAYMENT_VERIFIED',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DRIVER_ASSIGNED = 'DRIVER_ASSIGNED',
  PICKED_UP = 'PICKED_UP',
  ON_ROUTE = 'ON_ROUTE',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  EFT = 'EFT',
  OZOW = 'OZOW',
  PAYFAST = 'PAYFAST',
  PEACH = 'PEACH',
  YOCO = 'YOCO',
  APPLE_PAY = 'APPLE_PAY',
  GOOGLE_PAY = 'GOOGLE_PAY',
}

export enum PaymentStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum VendorStatus {
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

export enum DriverStatus {
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

export enum DeliveryStatus {
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  EN_ROUTE = 'en_route',
  ARRIVED = 'arrived',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

export enum Language {
  EN = 'en',
  TN = 'tn',
  ZU = 'zu',
  ST = 'st',
  XH = 'xh',
}

export enum AddressLabel {
  HOME = 'home',
  WORK = 'work',
  OTHER = 'other',
}

export const DEFAULT_CITY = 'Rustenburg';
export const DEFAULT_COUNTRY_CODE = 'ZA';
export const DEFAULT_TIMEZONE = 'Africa/Johannesburg';
export const DEFAULT_COMMISSION_RATE = 12;
export const MIN_DELIVERY_FEE = 15;
export const MAX_DELIVERY_FEE = 35;

export const SUPPORTED_LANGUAGES = [
  { code: Language.EN, name: 'English' },
  { code: Language.TN, name: 'Setswana' },
  { code: Language.ZU, name: 'isiZulu' },
  { code: Language.ST, name: 'Sesotho' },
  { code: Language.XH, name: 'isiXhosa' },
];

export const VENDOR_CATEGORIES = [
  'shisanyama',
  'kota',
  'takeaway',
  'street_food',
  'fast_food',
  'traditional',
  'beverages',
  'bakery',
] as const;

export type VendorCategory = (typeof VENDOR_CATEGORIES)[number];

export interface JwtPayload {
  sub: string;
  email: string;
  phone: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export function calculateDeliveryFee(distanceKm: number): number {
  const fee = MIN_DELIVERY_FEE + Math.ceil(distanceKm) * 2;
  return Math.min(fee, MAX_DELIVERY_FEE);
}

export function calculateCommission(orderTotal: number, rate: number = DEFAULT_COMMISSION_RATE): number {
  return Math.round(orderTotal * (rate / 100) * 100) / 100;
}

export function calculateVendorPayout(orderTotal: number, commission: number): number {
  return Math.round((orderTotal - commission) * 100) / 100;
}
