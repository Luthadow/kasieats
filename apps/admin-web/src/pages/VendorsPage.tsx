import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { PendingVendor } from '../types';

export default function VendorsPage() {
  const [vendors, setVendors] = useState<PendingVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await api.get<PendingVendor[]>('/admin/vendors/pending');
      setVendors(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vendors');
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
      await api.post(`/admin/vendors/${id}/${action}`);
      setVendors((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div className="loading">Loading vendors…</div>;

  return (
    <section>
      <div className="page-header">
        <h1>Vendors pending approval</h1>
        <p>Review and approve new kitchens joining KasiEats.</p>
      </div>

      {error && <div className="alert">{error}</div>}

      {vendors.length === 0 ? (
        <div className="panel muted-row">No vendors awaiting approval.</div>
      ) : (
        vendors.map((v) => (
          <div className="panel approval-row" key={v.id}>
            <div>
              <strong>{v.storeName}</strong>
              <p className="approval-meta">
                {[v.storeCategory, v.city, v.phone].filter(Boolean).join(' · ')}
              </p>
              {v.address && <p className="approval-meta">{v.address}</p>}
            </div>
            <div className="approval-actions">
              <button
                className="btn-primary"
                disabled={busyId === v.id}
                onClick={() => decide(v.id, 'approve')}
              >
                Approve
              </button>
              <button
                className="btn-danger"
                disabled={busyId === v.id}
                onClick={() => decide(v.id, 'reject')}
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
