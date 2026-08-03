import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { AdminDashboardDto } from '@kasieats/shared';

export default function DashboardPage() {
  const [data, setData] = useState<AdminDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<AdminDashboardDto>('/admin/dashboard')
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard…</div>;

  const cards: { label: string; value: string | number; note?: string }[] = [
    {
      label: 'Subscription revenue today',
      value: `R${(data?.revenueToday ?? 0).toFixed(2)}`,
      note: 'R350/month vendor subscriptions',
    },
    {
      label: 'GMV facilitated today',
      value: `R${(data?.gmvToday ?? 0).toFixed(2)}`,
      note: 'Paid directly to vendors — not KasiEats revenue',
    },
    { label: 'Orders facilitated today', value: data?.ordersToday ?? 0 },
    { label: 'Total orders facilitated', value: data?.totalOrders ?? 0 },
    { label: 'Customers', value: data?.totalCustomers ?? 0 },
    { label: 'Active vendors', value: data?.activeVendors ?? 0 },
    { label: 'Pending vendors', value: data?.pendingVendors ?? 0 },
    { label: 'Active drivers', value: data?.activeDrivers ?? 0 },
    { label: 'Pending drivers', value: data?.pendingDrivers ?? 0 },
  ];

  return (
    <section>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>
          Platform health at a glance. KasiEats earns R350/month per vendor subscription.
          Food payments go directly to vendors — KasiEats does not process food payments.
        </p>
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="stats-grid">
        {cards.map((c) => (
          <div className="stat-card" key={c.label}>
            <span>{c.label}</span>
            <strong>{c.value}</strong>
            {c.note && <small style={{ color: '#888', display: 'block', marginTop: 4 }}>{c.note}</small>}
          </div>
        ))}
      </div>
    </section>
  );
}
