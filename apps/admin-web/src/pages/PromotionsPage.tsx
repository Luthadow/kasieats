import { FormEvent, useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Promotion {
  id: string;
  code: string;
  name: string;
  discountType: string;
  discountValue: number;
  minOrderAmount: number;
  usageCount: number;
  isActive: boolean;
  endDate: string;
}

export default function PromotionsPage() {
  const { token } = useAuth();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    code: 'KASI15',
    name: '',
    discountType: 'percentage',
    discountValue: '10',
    minOrderAmount: '50',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!token) return;
    const response = await apiRequest<{ success: boolean; data: Promotion[] }>(
      '/promotions',
      {},
      token,
    );
    setPromotions(response.data);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [token]);

  const createPromo = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      await apiRequest(
        '/promotions',
        {
          method: 'POST',
          body: JSON.stringify({
            code: form.code,
            name: form.name || form.code,
            discountType: form.discountType,
            discountValue: Number(form.discountValue),
            minOrderAmount: Number(form.minOrderAmount),
            startDate: form.startDate,
            endDate: form.endDate,
          }),
        },
        token,
      );
      await load();
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (id: string) => {
    if (!token) return;
    await apiRequest(`/promotions/${id}/deactivate`, { method: 'PATCH' }, token);
    await load();
  };

  return (
    <section>
      <div className="page-header">
        <h1>Promotions</h1>
        <p>Manage pilot discount codes for Rustenburg customers.</p>
      </div>

      <div className="panel menu-form">
        <h2>Create promotion</h2>
        <form onSubmit={createPromo}>
          <div className="form-grid">
            <label>
              Code
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                required
              />
            </label>
            <label>
              Name
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Launch special"
              />
            </label>
            <label>
              Discount %
              <input
                type="number"
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
              />
            </label>
            <label>
              Min order (R)
              <input
                type="number"
                value={form.minOrderAmount}
                onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
              />
            </label>
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Creating...' : 'Create promo'}
          </button>
        </form>
      </div>

      {loading && <p>Loading...</p>}

      <div className="applications-list">
        {promotions.map((promo) => (
          <article key={promo.id} className="panel application-card">
            <div className="application-header">
              <div>
                <strong>{promo.code}</strong>
                <p>{promo.name}</p>
              </div>
              <span className={`badge ${promo.isActive ? '' : 'badge-offline'}`}>
                {promo.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p>
              {promo.discountType === 'percentage'
                ? `${promo.discountValue}% off`
                : `R${promo.discountValue} off`}{' '}
              · min R{promo.minOrderAmount} · used {promo.usageCount}x
            </p>
            {promo.isActive && (
              <button className="btn btn-danger" onClick={() => deactivate(promo.id)}>
                Deactivate
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
