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
