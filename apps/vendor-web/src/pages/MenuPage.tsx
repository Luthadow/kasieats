import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { MenuItemDto } from '@kasieats/shared';

export default function MenuPage() {
  const [items, setItems] = useState<MenuItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await api.get<MenuItemDto[]>('/vendors/me/menu');
      setItems(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleAvailable = async (item: MenuItemDto) => {
    setBusyId(item.id);
    try {
      const updated = await api.patch<MenuItemDto>(`/vendors/me/menu-items/${item.id}`, {
        isAvailable: !item.isAvailable,
      });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isAvailable: updated.isAvailable } : i)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update item');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div className="loading">Loading menu…</div>;

  return (
    <section>
      <div className="page-header">
        <h1>Menu</h1>
        <p>Toggle items on or off as you run out.</p>
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="panel">
        {items.length === 0 ? (
          <div className="muted-row">No menu items yet.</div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="menu-row">
              <div>
                <strong>{item.name}</strong>
                {item.description && <p className="menu-desc">{item.description}</p>}
                <span className="menu-price">R{item.price.toFixed(2)}</span>
              </div>
              <button
                className={item.isAvailable ? 'toggle toggle-on' : 'toggle'}
                disabled={busyId === item.id}
                onClick={() => toggleAvailable(item)}
              >
                <span className="toggle-knob" />
                <span className="toggle-label">{item.isAvailable ? 'Available' : 'Sold out'}</span>
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
