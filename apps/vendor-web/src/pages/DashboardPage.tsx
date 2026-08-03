import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { OrderDto } from '@kasieats/shared';
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

export default function DashboardPage() {
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const [v, o] = await Promise.all([
        api.get<VendorProfile>('/vendors/me'),
        api.get<OrderDto[]>('/orders/vendor/inbox'),
      ]);
      setVendor(v);
      setOrders(o ?? []);
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

  const todays = orders.filter((o) => isToday(o.createdAt));
  const revenue = todays
    .filter((o) => !['cancelled', 'rejected'].includes(o.status))
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const pending = orders.filter((o) => o.status === 'pending').length;

  if (loading) return <div className="loading">Loading dashboard…</div>;

  return (
    <section>
      <div className="page-header">
        <h1>{vendor?.storeName ?? 'Your kitchen'}</h1>
        <p>Manage incoming orders and keep your stand online.</p>
      </div>

      {error && <div className="alert">{error}</div>}

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
          <span>Orders today</span>
          <strong>{todays.length}</strong>
        </div>
        <div className="stat-card">
          <span>Revenue today</span>
          <strong>R{revenue.toFixed(2)}</strong>
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
