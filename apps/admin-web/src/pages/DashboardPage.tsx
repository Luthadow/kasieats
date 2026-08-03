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

  const cards: { label: string; value: string | number }[] = [
    { label: 'Orders today', value: data?.ordersToday ?? 0 },
    { label: 'Revenue today', value: `R${(data?.revenueToday ?? 0).toFixed(2)}` },
    { label: 'Total orders', value: data?.totalOrders ?? 0 },
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
        <p>Platform health at a glance.</p>
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="stats-grid">
        {cards.map((c) => (
          <div className="stat-card" key={c.label}>
            <span>{c.label}</span>
            <strong>{c.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
