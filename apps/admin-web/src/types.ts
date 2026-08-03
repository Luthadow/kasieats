export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready',
  picked_up: 'Picked Up',
  en_route: 'On the Way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

export interface PendingVendor {
  id: string;
  storeName: string;
  storeCategory?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  createdAt?: string;
}

export interface PendingDriver {
  id: string;
  firstName: string;
  lastName: string;
  vehicleType?: string | null;
  vehiclePlate?: string | null;
  phone?: string | null;
  createdAt?: string;
}

export interface AdminOrderRow {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  vendor?: { storeName?: string | null } | null;
  customer?: { name?: string | null } | null;
}
