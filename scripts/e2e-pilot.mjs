#!/usr/bin/env node
/**
 * KasiEats pilot smoke test — run against a live API (default http://localhost:3000/api/v1)
 *
 * Usage: node scripts/e2e-pilot.mjs [baseUrl]
 */

const BASE = process.argv[2] ?? 'http://localhost:3000/api/v1';

async function request(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message ?? `${options.method ?? 'GET'} ${path} → ${response.status}`);
  }
  return body;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  console.log(`KasiEats pilot smoke test → ${BASE}\n`);

  const health = await request('/health');
  assert(health.status === 'ok', 'Health check failed');
  console.log('✓ Health');

  const vendors = await request('/vendors?latitude=-25.6544&longitude=27.2389');
  assert(vendors.data?.length > 0, 'No vendors returned');
  console.log(`✓ Vendors (${vendors.data.length} active)`);

  await request('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ phone: '0761234567' }),
  });
  const customerAuth = await request('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone: '0761234567', otp: '123456' }),
  });
  assert(customerAuth.token, 'Customer login failed');
  console.log('✓ Customer auth');

  const adminAuth = await request('/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@kasieats.co.za', password: 'Admin123!' }),
  });
  assert(adminAuth.token, 'Admin login failed');
  console.log('✓ Admin auth');

  const dashboard = await request('/admin/dashboard', {
    headers: { Authorization: `Bearer ${adminAuth.token}` },
  });
  assert(dashboard.data?.pilotCity === 'Rustenburg', 'Admin dashboard missing pilot data');
  console.log(`✓ Admin dashboard (${dashboard.data.pendingVendors} pending vendors)`);

  await request('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ phone: '0831234567' }),
  });
  const vendorAuth = await request('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone: '0831234567', otp: '123456' }),
  });
  assert(vendorAuth.token, 'Vendor login failed');

  const menu = await request('/vendor/menu', {
    headers: { Authorization: `Bearer ${vendorAuth.token}` },
  });
  assert(Array.isArray(menu.data), 'Vendor menu failed');
  console.log(`✓ Vendor menu (${menu.data.length} items)`);

  const vendor = vendors.data[0];
  const vendorDetail = await request(`/vendors/${vendor.id}`);
  assert(vendorDetail.data?.menuItems?.length > 0, 'Vendor has no menu items');
  const menuItem = vendorDetail.data.menuItems[0];

  const order = await request('/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${customerAuth.token}` },
    body: JSON.stringify({
      vendorId: vendor.id,
      items: [{ menuItemId: menuItem.id, quantity: 1 }],
      deliveryAddress: '123 Zuma Street, Rustenburg',
      deliveryLatitude: -25.6544,
      deliveryLongitude: 27.2389,
      paymentMethod: 'cash',
    }),
  });
  assert(order.data?.id, 'Order creation failed');
  console.log(`✓ Order placed (${order.data.id.slice(0, 8)}…)`);

  const notifications = await request('/notifications?unreadOnly=true', {
    headers: { Authorization: `Bearer ${vendorAuth.token}` },
  });
  assert(Array.isArray(notifications.data), 'Notifications failed');
  console.log(`✓ Notifications (${notifications.unreadCount} unread for vendor)`);

  const addresses = await request('/customers/addresses', {
    headers: { Authorization: `Bearer ${customerAuth.token}` },
  });
  assert(Array.isArray(addresses.data), 'Customer addresses failed');
  console.log(`✓ Customer addresses (${addresses.data.length} saved)`);

  console.log('\nAll pilot smoke checks passed.');
}

main().catch((error) => {
  console.error('\n✗', error.message);
  console.error('\nMake sure Postgres is running and seeded: yarn db:migrate && yarn db:seed');
  process.exit(1);
});
