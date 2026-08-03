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

export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded';

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

export interface CreateOrderInput {
  vendorId: string;
  items: CreateOrderItemInput[];
  deliveryAddress: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  specialInstructions?: string;
  paymentMethod: 'card' | 'cash';
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
  paymentMethod?: 'card' | 'cash';
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
  revenueToday: number;
  activeVendors: number;
  pendingVendors: number;
  activeDrivers: number;
  pendingDrivers: number;
  totalCustomers: number;
}
