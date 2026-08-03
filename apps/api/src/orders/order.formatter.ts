import { Prisma } from '@kasieats/db';
import { DELIVERY_FEE_SETTLEMENT_MODEL } from '@kasieats/shared';

export type OrderWithDetails = Prisma.OrderGetPayload<{
  include: {
    vendor: true;
    order_items: { include: { menu_item: true } };
    delivery: { include: { driver: true } };
  };
}>;

type OrderWithOptionalDelivery =
  | OrderWithDetails
  | (Omit<OrderWithDetails, 'delivery'> & {
      delivery?: OrderWithDetails['delivery'] | null;
    });

/**
 * Mask bank account number — show only last 4 digits for customer safety.
 * Full number retained at the merchant side; customers only need the last 4
 * to confirm the transfer landed in the right account.
 */
function maskAccountNumber(accountNumber: string | null): string | null {
  if (!accountNumber) return null;
  if (accountNumber.length <= 4) return accountNumber;
  return `****${accountNumber.slice(-4)}`;
}

/**
 * Shared serializer that converts a Prisma order (with vendor/items/delivery)
 * into the camelCase API shape used by every controller that returns orders.
 *
 * Includes merchant banking details for Model A EFT checkout display.
 * Financial Ops Blueprint §Food Payment Flow / §Checkout display
 */
export function formatOrder(order: OrderWithOptionalDelivery) {
  const vendor = order.vendor as OrderWithDetails['vendor'] & {
    bank_name?: string | null;
    bank_account_holder?: string | null;
    bank_account_number?: string | null;
    bank_code?: string | null;
  };

  const hasBanking =
    vendor.bank_account_number ||
    vendor.bank_account_holder ||
    vendor.bank_code;

  return {
    id: order.id,
    status: order.status,
    paymentStatus: order.payment_status,
    paymentMethod: order.payment_method,
    eftReference: order.eft_reference,
    eftProofUrl: order.eft_proof_url,
    eftProofUploadedAt: order.eft_proof_uploaded_at,
    eftVerifiedAt: order.eft_verified_at,
    eftVerifiedByVendor: order.eft_verified_by_vendor,
    eftRejectionReason: order.eft_rejection_reason,
    deliveryPin: order.delivery_pin,
    // Merchant banking block — customer pays food + delivery to merchant in one EFT (Model A)
    merchantBanking: hasBanking
      ? {
          bankName: vendor.bank_name ?? null,
          accountHolder: vendor.bank_account_holder ?? null,
          accountNumberMasked: maskAccountNumber(vendor.bank_account_number ?? null),
          branchCode: vendor.bank_code ?? null,
        }
      : null,
    // Delivery fee settlement model annotation (informational)
    deliveryFeeSettlement:
      order.payment_method === 'eft' ? `merchant_collects_model_${DELIVERY_FEE_SETTLEMENT_MODEL}` : null,
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.delivery_fee),
    serviceFee: Number(order.service_fee),
    totalAmount: Number(order.total_amount),
    deliveryAddress: order.delivery_address,
    specialInstructions: order.special_instructions,
    estimatedDeliveryMinutes: order.estimated_delivery_minutes,
    createdAt: order.created_at,
    acceptedAt: order.accepted_by_vendor_at,
    readyAt: order.marked_as_ready_at,
    pickedUpAt: order.picked_up_by_driver_at,
    deliveredAt: order.delivered_at,
    cancelledAt: order.cancelled_at,
    cancellationReason: order.cancellation_reason,
    rejectionReason: order.rejection_reason,
    vendor: {
      id: vendor.id,
      storeName: vendor.store_name,
    },
    items: order.order_items.map((item) => ({
      menuItemId: item.menu_item_id,
      name: item.menu_item.name,
      quantity: item.quantity,
      pricePerItem: Number(item.price_per_item),
      extrasTotal: Number(item.extras_total),
      specialInstructions: item.special_instructions,
    })),
    delivery: order.delivery
      ? {
          status: order.delivery.status,
          driver: order.delivery.driver
            ? {
                name: `${order.delivery.driver.first_name} ${order.delivery.driver.last_name}`,
                rating: Number(order.delivery.driver.average_rating),
              }
            : null,
        }
      : null,
  };
}
