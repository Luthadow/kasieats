import { useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface DashboardData {
  storeName: string;
  isOpenNow: boolean;
  ordersToday: number;
  revenueToday: number;
  pendingOrders: number;
  averageRating: number;
}

export default function DashboardPage() {
  const { token } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    apiRequest<{ success: boolean; data: DashboardData }>('/vendor/dashboard', {}, token)
      .then((response) => setData(response.data))
      .finally(() => setLoading(false));
  }, [token]);

  const toggleStore = async () => {
    if (!token || !data) return;
    const response = await apiRequest<{ success: boolean; data: { isOpenNow: boolean } }>(
      '/vendor/store/toggle',
      {
        method: 'POST',
        body: JSON.stringify({ isOpen: !data.isOpenNow }),
      },
      token,
    );
    setData({ ...data, isOpenNow: response.data.isOpenNow });
  };

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  if (!data) {
    return <p>Unable to load dashboard.</p>;
  }

  return (
    <section>
      <div className="page-header">
        <h1>{data.storeName}</h1>
        <p>Today&apos;s kitchen overview</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Orders today</span>
          <strong>{data.ordersToday}</strong>
        </div>
        <div className="stat-card">
          <span>Revenue today</span>
          <strong>R{data.revenueToday.toFixed(2)}</strong>
        </div>
        <div className="stat-card">
          <span>Pending orders</span>
          <strong>{data.pendingOrders}</strong>
        </div>
        <div className="stat-card">
          <span>Avg rating</span>
          <strong>{data.averageRating.toFixed(1)}</strong>
        </div>
      </div>

      <div className="panel panel-row">
        <div>
          <h2>Store status</h2>
          <p>{data.isOpenNow ? 'You are online and receiving orders.' : 'You are offline.'}</p>
        </div>
        <button className="btn btn-primary" onClick={toggleStore}>
          {data.isOpenNow ? 'Go offline' : 'Go online'}
        </button>
      </div>
    </section>
  );
}
