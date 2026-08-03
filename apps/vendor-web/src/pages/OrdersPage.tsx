import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import type { OrderDto, OrderStatus } from '@kasieats/shared';
import { ORDER_STATUS_LABELS } from '../types';

const ACTIVE = ['pending', 'accepted', 'preparing', 'ready'];

// Next actions available per status. Endpoint = POST /orders/:id/<action>.
const ACTIONS: Record<string, { action: string; label: string; kind?: 'danger' }[]> = {
  pending: [
    { action: 'accept', label: 'Accept' },
    { action: 'reject', label: 'Reject', kind: 'danger' },
  ],
  accepted: [{ action: 'preparing', label: 'Start preparing' }],
  preparing: [{ action: 'ready', label: 'Mark ready' }],
  ready: [],
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = async () => {
    try {
      const data = await api.get<OrderDto[]>('/orders/vendor/inbox');
      setOrders(data ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 12000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const runAction = async (id: string, action: string) => {
    setBusyId(id);
    try {
      await api.post(`/orders/${id}/${action}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div className="loading">Loading orders…</div>;

  const active = orders.filter((o) => ACTIVE.includes(o.status));
  const done = orders.filter((o) => !ACTIVE.includes(o.status));

  return (
    <section>
      <div className="page-header">
        <h1>Orders</h1>
        <p>Accept, prepare, and mark orders ready for pickup.</p>
      </div>

      {error && <div className="alert">{error}</div>}

      <h2 className="section-title">Active ({active.length})</h2>
      {active.length === 0 ? (
        <div className="panel muted-row">No active orders right now.</div>
      ) : (
        active.map((order) => (
          <OrderCard key={order.id} order={order} busy={busyId === order.id} onAction={runAction} />
        ))
      )}

      {done.length > 0 && (
        <>
          <h2 className="section-title">Recent</h2>
          {done.slice(0, 10).map((order) => (
            <OrderCard key={order.id} order={order} busy={false} onAction={runAction} />
          ))}
        </>
      )}
    </section>
  );
}

function OrderCard({
  order,
  busy,
  onAction,
}: {
  order: OrderDto;
  busy: boolean;
  onAction: (id: string, action: string) => void;
}) {
  const actions = ACTIONS[order.status] ?? [];
  return (
    <div className="panel order-card">
      <div className="order-card-head">
        <div>
          <strong>#{order.id.slice(0, 8)}</strong>
          <span className="order-time">
            {new Date(order.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <span className={`status status-${order.status}`}>
          {ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status}
        </span>
      </div>

      <ul className="order-items">
        {order.items.map((item, i) => (
          <li key={i}>
            <span>
              {item.quantity}× {item.name}
            </span>
            <span>R{(item.pricePerItem * item.quantity).toFixed(2)}</span>
          </li>
        ))}
      </ul>

      <div className="order-card-foot">
        <strong>Total R{order.totalAmount.toFixed(2)}</strong>
        <div className="order-actions">
          {actions.map((a) => (
            <button
              key={a.action}
              className={a.kind === 'danger' ? 'btn-danger' : 'btn-primary'}
              disabled={busy}
              onClick={() => onAction(order.id, a.action)}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
