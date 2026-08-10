import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface PendingVendor {
  id: string;
  storeName: string;
  category: string;
  phone: string;
  address: string;
  city: string;
  submittedAt: string;
}

export default function VendorsPage() {
  const { token } = useAuth();
  const [vendors, setVendors] = useState<PendingVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadVendors = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await apiRequest<{ success: boolean; data: PendingVendor[] }>(
        '/admin/vendors/pending',
        {},
        token,
      );
      setVendors(response.data);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  const approve = async (id: string) => {
    if (!token) return;
    setActionId(id);
    try {
      await apiRequest(`/admin/vendors/${id}/approve`, { method: 'PATCH' }, token);
      await loadVendors();
    } finally {
      setActionId(null);
    }
  };

  const reject = async (id: string) => {
    if (!token) return;
    setActionId(id);
    try {
      await apiRequest(
        `/admin/vendors/${id}/reject`,
        {
          method: 'PATCH',
          body: JSON.stringify({ reason: 'Incomplete documentation' }),
        },
        token,
      );
      await loadVendors();
    } finally {
      setActionId(null);
    }
  };

  return (
    <section>
      <div className="page-header">
        <h1>Pending vendors</h1>
        <p>Approve new township food outlets for the Rustenburg pilot.</p>
      </div>

      {loading && <p>Loading applications...</p>}

      {!loading && vendors.length === 0 && (
        <div className="panel">
          <strong>No pending vendor applications</strong>
          <p>All caught up — new sign-ups will appear here.</p>
        </div>
      )}

      <div className="applications-list">
        {vendors.map((vendor) => (
          <article key={vendor.id} className="panel application-card">
            <div className="application-header">
              <div>
                <strong>{vendor.storeName}</strong>
                <p>{vendor.category}</p>
              </div>
              <span className="badge">{vendor.city}</span>
            </div>
            <p>
              <strong>Phone:</strong> {vendor.phone}
            </p>
            <p>
              <strong>Address:</strong> {vendor.address}
            </p>
            <p className="muted">Submitted {new Date(vendor.submittedAt).toLocaleString()}</p>
            <div className="order-actions">
              <button
                className="btn btn-primary"
                disabled={actionId === vendor.id}
                onClick={() => approve(vendor.id)}
              >
                Approve
              </button>
              <button
                className="btn btn-danger"
                disabled={actionId === vendor.id}
                onClick={() => reject(vendor.id)}
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
