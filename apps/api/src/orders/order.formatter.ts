import { Prisma } from '@kasieats/db';

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
 * Shared serializer that converts a Prisma order (with vendor/items/delivery)
 * into the camelCase API shape used by every controller that returns orders.
 */
export function formatOrder(order: OrderWithOptionalDelivery) {
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
      id: order.vendor.id,
      storeName: order.vendor.store_name,
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
