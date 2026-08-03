import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { OrderDto, SubscriptionDto } from '@kasieats/shared';
import type { VendorProfile } from '../types';

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function subscriptionStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    trialing: 'Free Trial',
    active: 'Active',
    past_due: 'Payment Due',
    cancelled: 'Cancelled',
    expired: 'Expired',
  };
  return labels[status] ?? status;
}

function subscriptionStatusClass(status: string): string {
  if (status === 'active' || status === 'trialing') return 'badge badge-green';
  if (status === 'past_due') return 'badge badge-yellow';
  return 'badge badge-red';
}

export default function DashboardPage() {
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subMessage, setSubMessage] = useState<string | null>(null);

  const load = async () => {
    try {
      const [v, o, s] = await Promise.all([
        api.get<VendorProfile>('/vendors/me'),
        api.get<OrderDto[]>('/orders/vendor/inbox'),
        api.get<SubscriptionDto | null>('/subscriptions/me').catch(() => null),
      ]);
      setVendor(v);
      setOrders(o ?? []);
      setSubscription(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleOpen = async () => {
    if (!vendor) return;
    setToggling(true);
    try {
      const updated = await api.patch<VendorProfile>('/vendors/me', {
        isOpenNow: !vendor.isOpenNow,
      });
      setVendor((prev) => ({ ...(prev as VendorProfile), isOpenNow: updated.isOpenNow }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update status');
    } finally {
      setToggling(false);
    }
  };

  const paySubscription = async () => {
    setPaying(true);
    setSubMessage(null);
    try {
      const checkout = await api.post<{ reference: string; paymentUrl: string; amount: number }>(
        '/subscriptions/checkout',
      );
      // In sandbox mode: auto-confirm immediately
      await api.post(`/subscriptions/mock-checkout/${checkout.reference}/confirm`);
      setSubMessage(`Payment of R${checkout.amount} confirmed! Subscription activated.`);
      // Reload subscription data
      const s = await api.get<SubscriptionDto | null>('/subscriptions/me').catch(() => null);
      setSubscription(s);
    } catch (err) {
      setSubMessage(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const todays = orders.filter((o) => isToday(o.createdAt));
  const facilitated = todays
    .filter((o) => !['cancelled', 'rejected'].includes(o.status))
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const pending = orders.filter((o) => o.status === 'pending').length;

  if (loading) return <div className="loading">Loading dashboard…</div>;

  const periodEnd = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-ZA')
    : null;

  return (
    <section>
      <div className="page-header">
        <h1>{vendor?.storeName ?? 'Your kitchen'}</h1>
        <p>Manage incoming orders and keep your stand online.</p>
      </div>

      {error && <div className="alert">{error}</div>}

      {/* Subscription panel */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <h2>KasiEats Subscription — R350/month</h2>
        <p style={{ color: '#666', marginBottom: 8 }}>
          Your subscription gives customers access to your store. Food payments go directly to you
          — KasiEats does not process food payments.
        </p>
        {subscription ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span className={subscriptionStatusClass(subscription.status)}>
              {subscriptionStatusLabel(subscription.status)}
            </span>
            {periodEnd && (
              <span style={{ color: '#444', fontSize: 14 }}>Active until {periodEnd}</span>
            )}
            {(subscription.status === 'past_due' ||
              subscription.status === 'expired' ||
              subscription.status === 'trialing') && (
              <button className="btn-primary" onClick={paySubscription} disabled={paying}>
                {paying ? 'Processing…' : 'Pay R350 with Ozow (sandbox)'}
              </button>
            )}
          </div>
        ) : (
          <button className="btn-primary" onClick={paySubscription} disabled={paying}>
            {paying ? 'Processing…' : 'Activate subscription — R350/month'}
          </button>
        )}
        {subMessage && (
          <p style={{ marginTop: 8, color: subMessage.includes('failed') ? 'red' : 'green' }}>
            {subMessage}
          </p>
        )}
      </div>

      <div className="panel toggle-panel">
        <div>
          <h2>Store status</h2>
          <p>
            {vendor?.isOpenNow
              ? 'You are online and accepting orders.'
              : 'You are offline. Customers cannot order.'}
          </p>
        </div>
        <button
          className={vendor?.isOpenNow ? 'toggle toggle-on' : 'toggle'}
          onClick={toggleOpen}
          disabled={toggling}
        >
          <span className="toggle-knob" />
          <span className="toggle-label">{vendor?.isOpenNow ? 'Open' : 'Closed'}</span>
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Orders facilitated today</span>
          <strong>{todays.length}</strong>
        </div>
        <div className="stat-card">
          <span>GMV today (paid to you)</span>
          <strong>R{facilitated.toFixed(2)}</strong>
        </div>
        <div className="stat-card">
          <span>Pending orders</span>
          <strong>{pending}</strong>
        </div>
        <div className="stat-card">
          <span>Avg rating</span>
          <strong>{vendor?.averageRating?.toFixed(1) ?? '—'}</strong>
        </div>
      </div>
    </section>
  );
}
