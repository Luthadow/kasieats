import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { PendingDriver } from '../types';

export default function DriversPage() {
  const [drivers, setDrivers] = useState<PendingDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await api.get<PendingDriver[]>('/admin/drivers/pending');
      setDrivers(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const decide = async (id: string, action: 'approve' | 'reject') => {
    setBusyId(id);
    try {
      await api.post(`/admin/drivers/${id}/${action}`);
      setDrivers((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div className="loading">Loading drivers…</div>;

  return (
    <section>
      <div className="page-header">
        <h1>Drivers pending approval</h1>
        <p>Approve drivers before they can accept deliveries.</p>
      </div>

      {error && <div className="alert">{error}</div>}

      {drivers.length === 0 ? (
        <div className="panel muted-row">No drivers awaiting approval.</div>
      ) : (
        drivers.map((d) => (
          <div className="panel approval-row" key={d.id}>
            <div>
              <strong>
                {d.firstName} {d.lastName}
              </strong>
              <p className="approval-meta">
                {[d.vehicleType, d.vehiclePlate, d.phone].filter(Boolean).join(' · ')}
              </p>
            </div>
            <div className="approval-actions">
              <button
                className="btn-primary"
                disabled={busyId === d.id}
                onClick={() => decide(d.id, 'approve')}
              >
                Approve
              </button>
              <button
                className="btn-danger"
                disabled={busyId === d.id}
                onClick={() => decide(d.id, 'reject')}
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </section>
  );
}
