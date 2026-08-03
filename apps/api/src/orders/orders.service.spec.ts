import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface PrismaMock {
  customer: { findUnique: any };
  vendor: { findUnique: any };
  menuItem: { findMany: any };
  order: { create: any };
  vendorSubscription: { findFirst: any };
}

function buildCreatedOrder(data: any) {
  return {
    id: 'order-1',
    status: data.status ?? 'pending',
    payment_status: data.payment_status,
    payment_method: data.payment_method,
    subtotal: data.subtotal,
    delivery_fee: data.delivery_fee,
    service_fee: data.service_fee,
    total_amount: data.total_amount,
    delivery_address: data.delivery_address,
    special_instructions: data.special_instructions ?? null,
    estimated_delivery_minutes: data.estimated_delivery_minutes,
    created_at: new Date(),
    accepted_by_vendor_at: null,
    marked_as_ready_at: null,
    picked_up_by_driver_at: null,
    delivered_at: null,
    cancelled_at: null,
    cancellation_reason: null,
    rejection_reason: null,
    vendor: { id: 'vendor-1', store_name: 'Test Vendor' },
    order_items: data.order_items.create.map((item: any, idx: number) => ({
      menu_item_id: item.menu_item.connect.id,
      quantity: item.quantity,
      price_per_item: item.price_per_item,
      extras_total: item.extras_total,
      special_instructions: item.special_instructions ?? null,
      menu_item: { name: `Item ${idx + 1}` },
    })),
    delivery: null,
  };
}

const activeSubscription = {
  id: 'sub-1',
  vendor_id: 'vendor-1',
  status: 'active',
  current_period_end: new Date(Date.now() + 86400000 * 30),
};

describe('OrdersService.createOrder', () => {
  let service: OrdersService;
  let prisma: PrismaMock;
  let notifications: { createNotification: any };

  const activeVendor = {
    id: 'vendor-1',
    status: 'active',
    commission_rate: 0,
    user_id: 'vendor-user-1',
  };

  beforeEach(() => {
    prisma = {
      customer: { findUnique: jest.fn().mockResolvedValue({ id: 'customer-1', user_id: 'cust-user' }) },
      vendor: { findUnique: jest.fn().mockResolvedValue(activeVendor) },
      menuItem: { findMany: jest.fn() },
      order: { create: jest.fn().mockImplementation(({ data }) => Promise.resolve(buildCreatedOrder(data))) },
      vendorSubscription: { findFirst: jest.fn().mockResolvedValue(activeSubscription) },
    };
    notifications = { createNotification: jest.fn().mockResolvedValue(null) };

    service = new OrdersService(prisma as any, notifications as any);
  });

  it('computes subtotal with zero service fee and total correctly', async () => {
    prisma.menuItem.findMany.mockResolvedValue([
      { id: 'item-1', price: 35, vendor_id: 'vendor-1', is_available: true },
      { id: 'item-2', price: 15, vendor_id: 'vendor-1', is_available: true },
    ]);

    const dto: CreateOrderDto = {
      vendorId: 'vendor-1',
      items: [
        { menuItemId: 'item-1', quantity: 2 },
        { menuItemId: 'item-2', quantity: 1 },
      ],
      deliveryAddress: '123 Test Street',
    };

    const result = await service.createOrder('cust-user', dto);

    const created = prisma.order.create.mock.calls[0][0].data;
    // subtotal = 35*2 + 15 = 85
    expect(created.subtotal).toBe(85);
    // No service fee — platform takes no cut of orders
    expect(created.service_fee).toBe(0);
    // delivery fee (default) = 25 (informational — paid to vendor/driver)
    expect(created.delivery_fee).toBe(25);
    // total = 85 + 25 = 110
    expect(created.total_amount).toBe(110);
    expect(result.data.totalAmount).toBe(110);
  });

  it('sets payment_status to awaiting_proof and payment_method to eft (MTHURA launch model)', async () => {
    prisma.menuItem.findMany.mockResolvedValue([
      { id: 'item-1', price: 35, vendor_id: 'vendor-1', is_available: true },
    ]);

    const dto: CreateOrderDto = {
      vendorId: 'vendor-1',
      items: [{ menuItemId: 'item-1', quantity: 1 }],
      deliveryAddress: '123 Test Street',
    };

    await service.createOrder('cust-user', dto);

    const created = prisma.order.create.mock.calls[0][0].data;
    expect(created.payment_status).toBe('awaiting_proof');
    expect(created.payment_method).toBe('eft');
    // No Payment row created — EFT proof state lives on the order
    expect(created.payment).toBeUndefined();
  });

  it('ignores client-supplied extra prices (extras_total forced to 0)', async () => {
    prisma.menuItem.findMany.mockResolvedValue([
      { id: 'item-1', price: 35, vendor_id: 'vendor-1', is_available: true },
    ]);

    const dto: CreateOrderDto = {
      vendorId: 'vendor-1',
      items: [
        {
          menuItemId: 'item-1',
          quantity: 1,
          extras: [{ name: 'Extra cheese', price: 1000 }],
        },
      ],
      deliveryAddress: '123 Test Street',
    };

    await service.createOrder('cust-user', dto);

    const created = prisma.order.create.mock.calls[0][0].data;
    expect(created.subtotal).toBe(35);
    expect(created.order_items.create[0].extras_total).toBe(0);
  });

  it('deduplicates menu item ids when validating availability', async () => {
    prisma.menuItem.findMany.mockResolvedValue([
      { id: 'item-1', price: 35, vendor_id: 'vendor-1', is_available: true },
    ]);

    const dto: CreateOrderDto = {
      vendorId: 'vendor-1',
      items: [
        { menuItemId: 'item-1', quantity: 1 },
        { menuItemId: 'item-1', quantity: 1 },
      ],
      deliveryAddress: '123 Test Street',
    };

    await service.createOrder('cust-user', dto);

    const where = prisma.menuItem.findMany.mock.calls[0][0].where;
    expect(where.id.in).toEqual(['item-1']);
    const created = prisma.order.create.mock.calls[0][0].data;
    expect(created.subtotal).toBe(70);
  });

  it('throws when a requested menu item is unavailable', async () => {
    prisma.menuItem.findMany.mockResolvedValue([
      { id: 'item-1', price: 35, vendor_id: 'vendor-1', is_available: true },
    ]);

    const dto: CreateOrderDto = {
      vendorId: 'vendor-1',
      items: [
        { menuItemId: 'item-1', quantity: 1 },
        { menuItemId: 'item-missing', quantity: 1 },
      ],
      deliveryAddress: '123 Test Street',
    };

    await expect(service.createOrder('cust-user', dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws when the vendor is not active', async () => {
    prisma.vendor.findUnique.mockResolvedValue({ ...activeVendor, status: 'suspended' });

    const dto: CreateOrderDto = {
      vendorId: 'vendor-1',
      items: [{ menuItemId: 'item-1', quantity: 1 }],
      deliveryAddress: '123 Test Street',
    };

    await expect(service.createOrder('cust-user', dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws ForbiddenException when vendor has no active subscription', async () => {
    prisma.vendorSubscription.findFirst.mockResolvedValue(null);
    prisma.menuItem.findMany.mockResolvedValue([
      { id: 'item-1', price: 35, vendor_id: 'vendor-1', is_available: true },
    ]);

    const dto: CreateOrderDto = {
      vendorId: 'vendor-1',
      items: [{ menuItemId: 'item-1', quantity: 1 }],
      deliveryAddress: '123 Test Street',
    };

    await expect(service.createOrder('cust-user', dto)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
