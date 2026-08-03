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

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  not_applicable: 'Not applicable',
  awaiting_proof: 'Awaiting EFT proof',
  proof_submitted: 'Proof submitted',
  verified: 'Payment verified',
  rejected: 'Proof rejected',
};

export interface VendorProfile {
  id: string;
  storeName: string;
  storeDescription?: string | null;
  storeCategory: string;
  address: string;
  city: string;
  phone?: string | null;
  isOpenNow: boolean;
  status: string;
  averageRating: number;
  ratingCount: number;
}
