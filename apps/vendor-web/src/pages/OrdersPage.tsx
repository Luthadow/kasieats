import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import type { OrderDto, OrderStatus } from '@kasieats/shared';
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '../types';

const ACTIVE = ['pending', 'accepted', 'preparing', 'ready'];

type OrderAction = { action: string; label: string; kind?: 'danger' };

// Next order-status actions available per status. Endpoint = POST /orders/:id/<action>.
// Accept is only offered once the EFT payment has been verified.
function actionsFor(order: OrderDto): OrderAction[] {
  switch (order.status) {
    case 'pending':
      return order.paymentStatus === 'verified'
        ? [
            { action: 'accept', label: 'Accept' },
            { action: 'reject', label: 'Reject', kind: 'danger' },
          ]
        : [];
    case 'accepted':
      return [{ action: 'preparing', label: 'Start preparing' }];
    case 'preparing':
      return [{ action: 'ready', label: 'Mark ready' }];
    default:
      return [];
  }
}

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
  const actions = actionsFor(order);
  const paymentStatus = order.paymentStatus ?? 'not_applicable';
  const awaitingVerification = ['proof_submitted', 'awaiting_proof'].includes(paymentStatus);
  const showEft = paymentStatus !== 'not_applicable';

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

      {showEft && (
        <div className="eft-block" style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #eee' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>EFT payment</span>
            <span>{PAYMENT_STATUS_LABELS[paymentStatus] ?? paymentStatus}</span>
          </div>
          {order.eftReference && (
            <p style={{ color: '#666', margin: '4px 0' }}>Reference: {order.eftReference}</p>
          )}
          {order.eftProofUrl && (
            <p style={{ margin: '4px 0' }}>
              <a href={order.eftProofUrl} target="_blank" rel="noreferrer">
                View proof of payment
              </a>
            </p>
          )}
          {paymentStatus === 'rejected' && order.eftRejectionReason && (
            <p style={{ color: '#b91c1c', margin: '4px 0' }}>Rejected: {order.eftRejectionReason}</p>
          )}
          {order.deliveryPin && paymentStatus === 'verified' && (
            <p style={{ margin: '4px 0', fontWeight: 700 }}>
              Delivery PIN: <span style={{ letterSpacing: 2 }}>{order.deliveryPin}</span>
            </p>
          )}
          {awaitingVerification && (
            <div className="order-actions" style={{ marginTop: 8 }}>
              <button
                className="btn-primary"
                disabled={busy || paymentStatus === 'awaiting_proof'}
                title={
                  paymentStatus === 'awaiting_proof'
                    ? 'Waiting for the customer to upload EFT proof'
                    : undefined
                }
                onClick={() => onAction(order.id, 'verify-eft')}
              >
                Verify payment
              </button>
              <button
                className="btn-danger"
                disabled={busy}
                onClick={() => onAction(order.id, 'reject-eft')}
              >
                Reject proof
              </button>
            </div>
          )}
        </div>
      )}

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
