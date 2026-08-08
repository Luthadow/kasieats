import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface PendingWithdrawal {
  id: string;
  amount: number;
  referenceCode: string | null;
  createdAt: string;
  userType: string;
  name: string;
}

export default function WithdrawalsPage() {
  const { token } = useAuth();
  const [withdrawals, setWithdrawals] = useState<PendingWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await apiRequest<{ success: boolean; data: PendingWithdrawal[] }>(
        '/admin/withdrawals/pending',
        {},
        token,
      );
      setWithdrawals(response.data);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (id: string) => {
    if (!token) return;
    setActionId(id);
    try {
      await apiRequest(`/admin/withdrawals/${id}/approve`, { method: 'PATCH' }, token);
      await load();
    } finally {
      setActionId(null);
    }
  };

  const reject = async (id: string) => {
    if (!token) return;
    setActionId(id);
    try {
      await apiRequest(
        `/admin/withdrawals/${id}/reject`,
        { method: 'PATCH', body: JSON.stringify({ reason: 'Bank details could not be verified' }) },
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
        <h1>Payout requests</h1>
        <p>Approve vendor and driver withdrawal requests.</p>
      </div>

      {loading && <p>Loading...</p>}

      {!loading && withdrawals.length === 0 && (
        <div className="panel">
          <strong>No pending withdrawals</strong>
        </div>
      )}

      <div className="applications-list">
        {withdrawals.map((item) => (
          <article key={item.id} className="panel application-card">
            <div className="application-header">
              <div>
                <strong>{item.name}</strong>
                <p>{item.userType} · {item.referenceCode}</p>
              </div>
              <span className="badge">R{item.amount.toFixed(2)}</span>
            </div>
            <p className="muted">{new Date(item.createdAt).toLocaleString()}</p>
            <div className="order-actions">
              <button
                className="btn btn-primary"
                disabled={actionId === item.id}
                onClick={() => approve(item.id)}
              >
                Approve payout
              </button>
              <button
                className="btn btn-danger"
                disabled={actionId === item.id}
                onClick={() => reject(item.id)}
              >
                Reject
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
