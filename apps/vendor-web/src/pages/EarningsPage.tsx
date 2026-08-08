import { FormEvent, useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface WalletSummary {
  balance: number;
  pendingBalance: number;
  currency: string;
  recentTransactions: TransactionRow[];
}

interface TransactionRow {
  id: string;
  type: string;
  status: string;
  amount: number;
  direction: 'credit' | 'debit';
  description: string | null;
  createdAt: string;
}

export default function EarningsPage() {
  const { token } = useAuth();
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [amount, setAmount] = useState('100');
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadWallet = async () => {
    if (!token) return;
    const response = await apiRequest<{ success: boolean; data: WalletSummary }>(
      '/wallet',
      {},
      token,
    );
    setWallet(response.data);
  };

  useEffect(() => {
    loadWallet().finally(() => setLoading(false));
  }, [token]);

  const withdraw = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setWithdrawing(true);
    setMessage(null);
    try {
      await apiRequest(
        '/wallet/withdraw',
        {
          method: 'POST',
          body: JSON.stringify({ amount: Number(amount) }),
        },
        token,
      );
      setMessage('Withdrawal submitted — admin will process within 24 hours.');
      await loadWallet();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Withdrawal failed');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading || !wallet) {
    return <p>Loading earnings...</p>;
  }

  return (
    <section>
      <div className="page-header">
        <h1>Earnings & payouts</h1>
        <p>Your wallet balance from completed orders.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card highlight">
          <span>Available balance</span>
          <strong>R{wallet.balance.toFixed(2)}</strong>
        </div>
        <div className="stat-card">
          <span>Pending withdrawal</span>
          <strong>R{wallet.pendingBalance.toFixed(2)}</strong>
        </div>
      </div>

      <div className="panel">
        <h2>Request withdrawal</h2>
        <p>Minimum R50. Uses bank details on your vendor profile.</p>
        <form onSubmit={withdraw} className="withdraw-form">
          <label>
            Amount (R)
            <input
              type="number"
              min="50"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={withdrawing}>
            {withdrawing ? 'Submitting...' : 'Request payout'}
          </button>
        </form>
        {message && <p className={message.includes('failed') ? 'error-text' : 'success-text'}>{message}</p>}
      </div>

      <div className="panel">
        <h2>Recent transactions</h2>
        {wallet.recentTransactions.length === 0 && <p className="muted">No transactions yet.</p>}
        {wallet.recentTransactions.map((tx) => (
          <div key={tx.id} className="order-row">
            <div>
              <strong>{tx.description ?? tx.type}</strong>
              <p className="muted">{new Date(tx.createdAt).toLocaleString()}</p>
            </div>
            <div className="order-row-meta">
              <span className="badge">{tx.status}</span>
              <strong className={tx.direction === 'credit' ? 'credit' : 'debit'}>
                {tx.direction === 'credit' ? '+' : '-'}R{tx.amount.toFixed(2)}
              </strong>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
