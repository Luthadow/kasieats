import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface PendingDriver {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  vehicleType: string;
  vehiclePlate: string;
  submittedAt: string;
}

export default function DriversPage() {
  const { token } = useAuth();
  const [drivers, setDrivers] = useState<PendingDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadDrivers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await apiRequest<{ success: boolean; data: PendingDriver[] }>(
        '/admin/drivers/pending',
        {},
        token,
      );
      setDrivers(response.data);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

  const approve = async (id: string) => {
    if (!token) return;
    setActionId(id);
    try {
      await apiRequest(`/admin/drivers/${id}/approve`, { method: 'PATCH' }, token);
      await loadDrivers();
    } finally {
      setActionId(null);
    }
  };

  const reject = async (id: string) => {
    if (!token) return;
    setActionId(id);
    try {
      await apiRequest(
        `/admin/drivers/${id}/reject`,
        {
          method: 'PATCH',
          body: JSON.stringify({ reason: 'Vehicle documents not verified' }),
        },
        token,
      );
      await loadDrivers();
    } finally {
      setActionId(null);
    }
  };

  return (
    <section>
      <div className="page-header">
        <h1>Pending drivers</h1>
        <p>Verify delivery partners before they can go online.</p>
      </div>

      {loading && <p>Loading applications...</p>}

      {!loading && drivers.length === 0 && (
        <div className="panel">
          <strong>No pending driver applications</strong>
          <p>New driver sign-ups will appear here.</p>
        </div>
      )}

      <div className="applications-list">
        {drivers.map((driver) => (
          <article key={driver.id} className="panel application-card">
            <div className="application-header">
              <div>
                <strong>
                  {driver.firstName} {driver.lastName}
                </strong>
                <p>{driver.phone}</p>
              </div>
              <span className="badge">{driver.vehicleType}</span>
            </div>
            <p>
              <strong>Plate:</strong> {driver.vehiclePlate}
            </p>
            <p className="muted">Submitted {new Date(driver.submittedAt).toLocaleString()}</p>
            <div className="order-actions">
              <button
                className="btn btn-primary"
                disabled={actionId === driver.id}
                onClick={() => approve(driver.id)}
              >
                Approve
              </button>
              <button
                className="btn btn-danger"
                disabled={actionId === driver.id}
                onClick={() => reject(driver.id)}
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
