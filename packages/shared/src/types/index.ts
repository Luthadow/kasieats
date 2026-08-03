export type UserType = 'customer' | 'vendor' | 'driver' | 'admin';

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'en_route'
  | 'delivered'
  | 'cancelled'
  | 'rejected';

// Food orders use the MTHURA EFT proof-of-payment model — customers pay the
// vendor via EFT and upload proof. MTHURA never processes food purchase funds.
export type PaymentStatus =
  | 'not_applicable'
  | 'awaiting_proof'
  | 'proof_submitted'
  | 'verified'
  | 'rejected'
  // legacy values retained for backwards compatibility
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'refunded';

export type PaymentMethod = 'eft' | 'pay_vendor_directly' | 'cash';

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'expired';

export type DeliveryStatus =
  | 'assigned'
  | 'picked_up'
  | 'en_route'
  | 'arrived'
  | 'delivered'
  | 'cancelled';

export type VendorStatus =
  | 'pending_approval'
  | 'active'
  | 'suspended'
  | 'rejected'
  | 'offline';

export type DriverStatus =
  | 'pending_approval'
  | 'active'
  | 'suspended'
  | 'rejected'
  | 'offline';

export interface JwtPayload {
  sub: string;
  phone: string;
  userType: UserType;
}

export interface VendorSummary {
  id: string;
  storeName: string;
  storeCategory: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  isOpenNow: boolean;
  averageRating: number;
  ratingCount: number;
  distanceKm?: number;
  estimatedDeliveryMinutes?: number;
}

export interface MenuItemDto {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  price: number;
  isAvailable: boolean;
  imageUrl?: string | null;
  preparationTimeMinutes: number;
}

export interface CreateOrderItemInput {
  menuItemId: string;
  quantity: number;
  extras?: Array<{ name: string; price: number }>;
  specialInstructions?: string;
}

export interface EftProofInput {
  proofUrl: string;
  reference?: string;
}

export interface CreateOrderInput {
  vendorId: string;
  items: CreateOrderItemInput[];
  deliveryAddress: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  specialInstructions?: string;
  // MTHURA launch model: customer pays the vendor via EFT and uploads proof.
  // 'eft' is the default. 'pay_vendor_directly' / 'cash' are legacy aliases.
  paymentMethod?: PaymentMethod;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthUser {
  id: string;
  phone: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  userType: UserType;
}

export interface OrderItemDto {
  name: string;
  quantity: number;
  pricePerItem: number;
  extrasTotal?: number;
  specialInstructions?: string | null;
}

export interface OrderDto {
  id: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  // MTHURA launch model — customer pays vendor via EFT + proof.
  paymentMethod?: PaymentMethod | string;
  // EFT proof-of-payment state
  eftReference?: string | null;
  eftProofUrl?: string | null;
  eftProofUploadedAt?: string | null;
  eftVerifiedAt?: string | null;
  eftVerifiedByVendor?: boolean;
  eftRejectionReason?: string | null;
  // 4-digit delivery PIN generated after EFT verification / when ready
  deliveryPin?: string | null;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  totalAmount: number;
  deliveryAddress: string;
  specialInstructions?: string | null;
  estimatedDeliveryMinutes?: number | null;
  createdAt: string;
  vendor: { id: string; storeName: string };
  customer?: { name?: string; phone?: string } | null;
  items: OrderItemDto[];
  delivery?: {
    status: DeliveryStatus;
    driver?: { name: string; rating: number } | null;
  } | null;
}

export interface AddressDto {
  id: string;
  label?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
  deliveryInstructions?: string | null;
}

export interface DeliveryJobDto {
  id: string;
  orderId: string;
  status: DeliveryStatus;
  pickupAddress?: string | null;
  deliveryAddress: string;
  distanceKm?: number | null;
  earnings?: number | null;
  vendor: { storeName: string; address?: string | null };
  customer?: { name?: string | null; phone?: string | null } | null;
  createdAt?: string;
}

export interface AdminDashboardDto {
  totalOrders: number;
  ordersToday: number;
  // Total subscription revenue collected today (merchant + driver)
  revenueToday: number;
  // Breakdown of subscription revenue today
  merchantRevenueToday?: number;
  driverRevenueToday?: number;
  // GMV facilitated today (informational — not MTHURA revenue)
  gmvToday: number;
  activeVendors: number;
  pendingVendors: number;
  activeDrivers: number;
  pendingDrivers: number;
  totalCustomers: number;
}

export interface SubscriptionDto {
  id: string;
  vendorId: string;
  status: SubscriptionStatus;
  amountZar: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt?: string | null;
  cancelledAt?: string | null;
  lastPaymentAt?: string | null;
  createdAt: string;
}

export interface DriverSubscriptionDto {
  id: string;
  driverId: string;
  status: SubscriptionStatus;
  amountZar: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt?: string | null;
  cancelledAt?: string | null;
  lastPaymentAt?: string | null;
  createdAt: string;
}
