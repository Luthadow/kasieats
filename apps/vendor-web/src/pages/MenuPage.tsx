import { FormEvent, useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  isAvailable: boolean;
  preparationTimeMinutes: number;
}

const emptyForm = {
  name: '',
  description: '',
  category: 'Main',
  price: '',
  preparationTimeMinutes: '15',
};

export default function MenuPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMenu = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await apiRequest<{ success: boolean; data: MenuItem[] }>(
        '/vendor/menu',
        {},
        token,
      );
      setItems(response.data);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
  };

  const startEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description ?? '',
      category: item.category ?? 'Main',
      price: item.price.toString(),
      preparationTimeMinutes: item.preparationTimeMinutes.toString(),
    });
  };

  const saveItem = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;

    setSaving(true);
    setError(null);

    const payload = {
      name: form.name,
      description: form.description || undefined,
      category: form.category,
      price: Number(form.price),
      preparationTimeMinutes: Number(form.preparationTimeMinutes),
    };

    try {
      if (editingId) {
        await apiRequest(`/vendor/menu/items/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        }, token);
      } else {
        await apiRequest('/vendor/menu/items', {
          method: 'POST',
          body: JSON.stringify(payload),
        }, token);
      }
      resetForm();
      await loadMenu();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    if (!token) return;
    await apiRequest(
      `/vendor/menu/items/${item.id}/toggle`,
      {
        method: 'PATCH',
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      },
      token,
    );
    await loadMenu();
  };

  const removeItem = async (itemId: string) => {
    if (!token || !window.confirm('Remove this menu item?')) return;
    await apiRequest(`/vendor/menu/items/${itemId}/delete`, { method: 'POST' }, token);
    await loadMenu();
  };

  return (
    <section>
      <div className="page-header">
        <h1>Menu management</h1>
        <p>Add, edit, and toggle availability for your items.</p>
      </div>

      <div className="panel menu-form">
        <h2>{editingId ? 'Edit item' : 'Add new item'}</h2>
        <form onSubmit={saveItem}>
          <div className="form-grid">
            <label>
              Name
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>
            <label>
              Category
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </label>
            <label>
              Price (R)
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </label>
            <label>
              Prep time (min)
              <input
                type="number"
                min="1"
                value={form.preparationTimeMinutes}
                onChange={(e) => setForm({ ...form, preparationTimeMinutes: e.target.value })}
              />
            </label>
          </div>
          <label>
            Description
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
            />
          </label>
          {error && <p className="error-text">{error}</p>}
          <div className="order-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update item' : 'Add item'}
            </button>
            {editingId && (
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {loading && <p>Loading menu...</p>}

      <div className="menu-list">
        {items.map((item) => (
          <article key={item.id} className="panel menu-item-card">
            <div className="menu-item-header">
              <div>
                <strong>{item.name}</strong>
                <p className="muted">{item.category ?? 'Main'}</p>
              </div>
              <span className={`badge ${item.isAvailable ? '' : 'badge-offline'}`}>
                {item.isAvailable ? 'Available' : 'Unavailable'}
              </span>
            </div>
            {item.description && <p>{item.description}</p>}
            <p>
              R{item.price.toFixed(2)} · {item.preparationTimeMinutes} min prep
            </p>
            <div className="order-actions">
              <button className="btn btn-primary" onClick={() => startEdit(item)}>
                Edit
              </button>
              <button className="btn btn-secondary" onClick={() => toggleAvailability(item)}>
                {item.isAvailable ? 'Mark unavailable' : 'Mark available'}
              </button>
              <button className="btn btn-danger" onClick={() => removeItem(item.id)}>
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
