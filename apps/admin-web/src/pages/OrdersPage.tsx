import { useEffect, useState } from 'react';
import { ORDER_STATUS_LABELS } from '@kasieats/shared';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface AdminOrder {
  id: string;
  status: string;
  totalAmount: number;
  vendorName: string;
  customerName: string;
  createdAt: string;
}

export default function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    apiRequest<{ success: boolean; data: AdminOrder[] }>('/admin/orders', {}, token)
      .then((response) => setOrders(response.data))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <section>
      <div className="page-header">
        <h1>Recent orders</h1>
        <p>Latest activity across the Rustenburg pilot.</p>
      </div>

      {loading && <p>Loading orders...</p>}

      {!loading && orders.length === 0 && (
        <div className="panel">
          <strong>No orders yet</strong>
          <p>Orders will appear here as customers place them.</p>
        </div>
      )}

      <div className="panel">
        {orders.map((order) => (
          <div key={order.id} className="order-row">
            <div>
              <strong>{order.vendorName}</strong>
              <p className="muted">
                {order.customerName} · {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="order-row-meta">
              <span className="badge">{ORDER_STATUS_LABELS[order.status] ?? order.status}</span>
              <strong>R{order.totalAmount.toFixed(2)}</strong>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
