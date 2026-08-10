import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  userName: string;
  userPhone: string;
  userType: string;
  createdAt: string;
}

export default function SupportPage() {
  const { token } = useAuth();
  const { onNotification } = useRealtime();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filter, setFilter] = useState('open');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await apiRequest<{ success: boolean; data: SupportTicket[] }>(
        `/admin/support/tickets?status=${filter}`,
        {},
        token,
      );
      setTickets(response.data);
    } finally {
      setLoading(false);
    }
  }, [token, filter]);

  useEffect(() => {
    load();

    const unsub = onNotification(() => load().catch(() => null));
    const interval = setInterval(() => load().catch(() => null), 60000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [load, onNotification]);

  const resolve = async (id: string) => {
    if (!token) return;
    setActionId(id);
    try {
      await apiRequest(
        `/admin/support/tickets/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'resolved',
            resolutionNotes: 'Issue resolved by support team.',
          }),
        },
        token,
      );
      await load();
    } finally {
      setActionId(null);
    }
  };

  return (
    <section>
      <div className="page-header">
        <h1>Support tickets</h1>
        <p>Customer, vendor, and driver help requests.</p>
      </div>

      <div className="filter-row">
        {['open', 'in_progress', 'resolved', 'all'].map((status) => (
          <button
            key={status}
            className={`filter-chip ${filter === status ? 'filter-chip-active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading && <p>Loading...</p>}

      <div className="applications-list">
        {tickets.map((ticket) => (
          <article key={ticket.id} className="panel application-card">
            <div className="application-header">
              <div>
                <strong>{ticket.subject}</strong>
                <p>
                  {ticket.userName} · {ticket.userPhone} · {ticket.userType}
                </p>
              </div>
              <span className="badge">{ticket.priority}</span>
            </div>
            <p>{ticket.description}</p>
            <p className="muted">
              {ticket.category} · {ticket.status} · {new Date(ticket.createdAt).toLocaleString()}
            </p>
            {ticket.status === 'open' && (
              <div className="order-actions">
                <button
                  className="btn btn-primary"
                  disabled={actionId === ticket.id}
                  onClick={() => resolve(ticket.id)}
                >
                  Mark resolved
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
