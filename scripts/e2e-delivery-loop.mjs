#!/usr/bin/env node
/**
 * Full local delivery loop + WebSocket smoke test.
 * Usage: node scripts/e2e-delivery-loop.mjs [apiBaseUrl]
 */

import { io } from 'socket.io-client';

const BASE = process.argv[2] ?? 'http://localhost:3000/api/v1';
const REALTIME = BASE.replace(/\/api\/v1\/?$/, '');

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
    const message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    throw new Error(message ?? `${options.method ?? 'GET'} ${path} → ${response.status}`);
  }
  return body;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function userIdFromToken(token) {
  const segment = token.split('.')[1];
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/');
  const json = Buffer.from(padded, 'base64').toString('utf8');
  return JSON.parse(json).sub;
}

function waitForEvent(socket, event, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, handler);
      reject(new Error(`Timed out waiting for ${event}`));
    }, timeoutMs);

    function handler(payload) {
      clearTimeout(timer);
      resolve(payload);
    }

    socket.on(event, handler);
  });
}

async function loginOtp(phone) {
  await request('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
  const auth = await request('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, otp: '123456' }),
  });
  assert(auth.token, `${phone} login failed`);
  return auth.token;
}

async function main() {
  console.log(`KasiEats delivery loop test → ${BASE}\n`);

  const customerToken = await loginOtp('0761234567');
  console.log('✓ Customer auth');

  const vendorToken = await loginOtp('0831234567');
  console.log('✓ Vendor auth (Mama Lindiwe)');

  const driverToken = await loginOtp('0851234567');
  console.log('✓ Driver auth');

  const vendors = await request('/vendors?latitude=-25.6544&longitude=27.2389');
  const vendor = vendors.data.find((v) => v.storeName.includes("Mama Lindiwe"));
  assert(vendor, 'Mama Lindiwe vendor not found in listing');

  const vendorDetail = await request(`/vendors/${vendor.id}`);
  const menuItem = vendorDetail.data.menuItems[0];

  const customerUserId = userIdFromToken(customerToken);
  const socket = io(`${REALTIME}/orders`, { transports: ['websocket'] });

  await new Promise((resolve, reject) => {
    socket.on('connect', resolve);
    socket.on('connect_error', reject);
    setTimeout(() => reject(new Error('WebSocket connect timeout')), 5000);
  });
  socket.emit('subscribe', { userId: customerUserId });
  console.log('✓ WebSocket connected');

  const orderPromise = waitForEvent(socket, 'order:update');

  const order = await request('/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${customerToken}` },
    body: JSON.stringify({
      vendorId: vendor.id,
      items: [{ menuItemId: menuItem.id, quantity: 2 }],
      deliveryAddress: '123 Zuma Street, Rustenburg',
      deliveryLatitude: -25.6544,
      deliveryLongitude: 27.2389,
      paymentMethod: 'cash',
      promoCode: 'KASI10',
    }),
  });
  assert(order.data?.id, 'Order creation failed');
  const orderId = order.data.id;
  console.log(`✓ Order placed (${orderId.slice(-6)}) with KASI10 promo`);

  const wsEvent = await orderPromise;
  assert(wsEvent.orderId === orderId, 'WebSocket event orderId mismatch');
  console.log(`✓ WebSocket order:update (${wsEvent.status})`);

  await request(`/vendor/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${vendorToken}` },
    body: JSON.stringify({ action: 'accept' }),
  });
  console.log('✓ Vendor accepted order');

  await request(`/vendor/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${vendorToken}` },
    body: JSON.stringify({ action: 'mark_ready' }),
  });
  console.log('✓ Vendor marked order ready');

  await request('/driver/status', {
    method: 'POST',
    headers: { Authorization: `Bearer ${driverToken}` },
    body: JSON.stringify({ isOnline: true, latitude: -25.6544, longitude: 27.2389 }),
  });
  console.log('✓ Driver online');

  const accept = await request(`/driver/jobs/${orderId}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${driverToken}` },
  });
  const deliveryId = accept.data.id;
  console.log(`✓ Driver accepted job (${deliveryId.slice(-6)})`);

  for (const action of ['collect', 'start_delivery', 'complete']) {
    await request(`/driver/deliveries/${deliveryId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: JSON.stringify({ action }),
    });
    console.log(`✓ Driver ${action.replace('_', ' ')}`);
  }

  const finalOrder = await request(`/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  assert(finalOrder.data.status === 'delivered', `Expected delivered, got ${finalOrder.data.status}`);
  console.log('✓ Customer sees delivered status');

  const review = await request(`/orders/${orderId}/reviews`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${customerToken}` },
    body: JSON.stringify({ revieweeType: 'vendor', rating: 5 }),
  });
  assert(review.success, 'Review submission failed');
  console.log('✓ Customer review submitted');

  socket.disconnect();
  console.log('\nFull delivery loop passed.');
}

main().catch((error) => {
  console.error('\n✗', error.message);
  process.exit(1);
});
