import { useCallback, useEffect, useState } from 'react';
import { ORDER_STATUS_LABELS } from '@kasieats/shared';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';

interface VendorOrder {
  id: string;
  status: string;
  totalAmount: number;
  vendorPayout: number;
  deliveryAddress: string;
  specialInstructions: string | null;
  createdAt: string;
  customer: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    pricePerItem: number;
  }>;
}

export default function OrdersPage() {
  const { token } = useAuth();
  const { onOrderUpdate, onNotification } = useRealtime();
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await apiRequest<{ success: boolean; data: VendorOrder[] }>(
        `/vendor/orders?status=${filter}`,
        {},
        token,
      );
      setOrders(response.data);
    } finally {
      setLoading(false);
    }
  }, [token, filter]);

  useEffect(() => {
    loadOrders();
    const unsubs = [
      onOrderUpdate(() => loadOrders()),
      onNotification(() => loadOrders()),
    ];
    const interval = setInterval(loadOrders, 60000);
    return () => {
      unsubs.forEach((unsub) => unsub());
      clearInterval(interval);
    };
  }, [loadOrders, onOrderUpdate, onNotification]);

  const updateOrder = async (
    orderId: string,
    action: 'accept' | 'reject' | 'mark_ready',
    rejectionReason?: string,
  ) => {
    if (!token) return;
    setActionId(orderId);
    try {
      await apiRequest(
        `/vendor/orders/${orderId}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ action, rejectionReason }),
        },
        token,
      );
      await loadOrders();
    } finally {
      setActionId(null);
    }
  };

  return (
    <section>
      <div className="page-header">
        <h1>Orders</h1>
        <p>Accept, prepare, and mark orders ready for pickup.</p>
      </div>

      <div className="filter-row">
        {['pending', 'preparing', 'ready', 'all'].map((status) => (
          <button
            key={status}
            className={`filter-chip ${filter === status ? 'filter-chip-active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status === 'all' ? 'All' : ORDER_STATUS_LABELS[status] ?? status}
          </button>
        ))}
      </div>

      {loading && <p>Loading orders...</p>}

      {!loading && orders.length === 0 && (
        <div className="panel">
          <strong>No orders in this view</strong>
          <p>New customer orders will appear here automatically.</p>
        </div>
      )}

      <div className="orders-list">
        {orders.map((order) => (
          <article key={order.id} className="panel order-card">
            <div className="order-card-header">
              <div>
                <strong>
                  {order.customer.firstName} {order.customer.lastName}
                </strong>
                <p>{order.customer.phone}</p>
              </div>
              <span className="badge">{ORDER_STATUS_LABELS[order.status] ?? order.status}</span>
            </div>

            <ul className="order-items">
              {order.items.map((item, index) => (
                <li key={`${item.name}-${index}`}>
                  {item.quantity}x {item.name} · R{item.pricePerItem.toFixed(2)}
                </li>
              ))}
            </ul>

            <p>
              <strong>Deliver to:</strong> {order.deliveryAddress}
            </p>
            {order.specialInstructions && (
              <p>
                <strong>Note:</strong> {order.specialInstructions}
              </p>
            )}
            <p>
              Total R{order.totalAmount.toFixed(2)} · Your payout R{order.vendorPayout.toFixed(2)}
            </p>

            <div className="order-actions">
              {order.status === 'pending' && (
                <>
                  <button
                    className="btn btn-primary"
                    disabled={actionId === order.id}
                    onClick={() => updateOrder(order.id, 'accept')}
                  >
                    Accept
                  </button>
                  <button
                    className="btn btn-danger"
                    disabled={actionId === order.id}
                    onClick={() => updateOrder(order.id, 'reject', 'Too busy right now')}
                  >
                    Reject
                  </button>
                </>
              )}
              {order.status === 'preparing' && (
                <button
                  className="btn btn-primary"
                  disabled={actionId === order.id}
                  onClick={() => updateOrder(order.id, 'mark_ready')}
                >
                  Mark ready for pickup
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
