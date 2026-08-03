import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { ORDER_STATUS_LABELS, type AdminOrderRow } from '../types';

export default function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<AdminOrderRow[]>('/admin/orders')
      .then((data) => setOrders(data ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading orders…</div>;

  return (
    <section>
      <div className="page-header">
        <h1>Orders</h1>
        <p>All orders across the platform.</p>
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="panel table-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Vendor</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Total</th>
              <th>Placed</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted-row">
                  No orders yet.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id}>
                  <td>#{o.id.slice(0, 8)}</td>
                  <td>{o.vendor?.storeName ?? '—'}</td>
                  <td>{o.customer?.name ?? '—'}</td>
                  <td>
                    <span className={`status status-${o.status}`}>
                      {ORDER_STATUS_LABELS[o.status] ?? o.status}
                    </span>
                  </td>
                  <td>R{o.totalAmount.toFixed(2)}</td>
                  <td>{new Date(o.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
