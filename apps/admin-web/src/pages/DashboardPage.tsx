import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';

interface DashboardData {
  customers: number;
  activeVendors: number;
  activeDrivers: number;
  pendingVendors: number;
  pendingDrivers: number;
  ordersToday: number;
  platformRevenueToday: number;
  liveOrders: number;
  pilotCity: string;
}

export default function DashboardPage() {
  const { token } = useAuth();
  const { onOrderUpdate, onNotification } = useRealtime();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    const response = await apiRequest<{ success: boolean; data: DashboardData }>(
      '/admin/dashboard',
      {},
      token,
    );
    setData(response.data);
  }, [token]);

  useEffect(() => {
    if (!token) return;

    load()
      .catch(() => null)
      .finally(() => setLoading(false));

    const unsubs = [
      onOrderUpdate(() => load().catch(() => null)),
      onNotification(() => load().catch(() => null)),
    ];
    const interval = setInterval(() => load().catch(() => null), 60000);

    return () => {
      unsubs.forEach((unsub) => unsub());
      clearInterval(interval);
    };
  }, [token, load, onOrderUpdate, onNotification]);

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  if (!data) {
    return <p>Unable to load dashboard.</p>;
  }

  return (
    <section>
      <div className="page-header">
        <h1>Platform overview</h1>
        <p>
          {data.pilotCity} pilot · {data.liveOrders} live orders right now
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Orders today</span>
          <strong>{data.ordersToday}</strong>
        </div>
        <div className="stat-card">
          <span>Platform revenue</span>
          <strong>R{data.platformRevenueToday.toFixed(2)}</strong>
        </div>
        <div className="stat-card">
          <span>Customers</span>
          <strong>{data.customers}</strong>
        </div>
        <div className="stat-card">
          <span>Active vendors</span>
          <strong>{data.activeVendors}</strong>
        </div>
        <div className="stat-card">
          <span>Active drivers</span>
          <strong>{data.activeDrivers}</strong>
        </div>
        <div className="stat-card highlight">
          <span>Pending approvals</span>
          <strong>{data.pendingVendors + data.pendingDrivers}</strong>
        </div>
      </div>

      <div className="panel-grid">
        <div className="panel">
          <h2>Vendor KYC</h2>
          <p>{data.pendingVendors} applications waiting for review.</p>
          <Link className="btn btn-primary" to="/vendors">
            Review vendors
          </Link>
        </div>
        <div className="panel">
          <h2>Driver onboarding</h2>
          <p>{data.pendingDrivers} drivers waiting for approval.</p>
          <Link className="btn btn-primary" to="/drivers">
            Review drivers
          </Link>
        </div>
      </div>
    </section>
  );
}
