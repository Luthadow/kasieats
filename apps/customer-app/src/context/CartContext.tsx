import React, { createContext, useContext, useMemo, useState } from 'react';

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  vendorId: string | null;
  vendorName: string | null;
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (
    vendor: { id: string; name: string },
    item: { menuItemId: string; name: string; price: number },
  ) => { ok: boolean; conflict?: boolean };
  decrement: (menuItemId: string) => void;
  removeItem: (menuItemId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [vendorName, setVendorName] = useState<string | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);

  const value = useMemo<CartState>(() => {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const count = items.reduce((sum, i) => sum + i.quantity, 0);

    return {
      vendorId,
      vendorName,
      items,
      count,
      subtotal,
      addItem: (vendor, item) => {
        // Enforce one vendor per cart.
        if (vendorId && vendorId !== vendor.id && items.length > 0) {
          return { ok: false, conflict: true };
        }
        setVendorId(vendor.id);
        setVendorName(vendor.name);
        setItems((prev) => {
          const existing = prev.find((i) => i.menuItemId === item.menuItemId);
          if (existing) {
            return prev.map((i) =>
              i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + 1 } : i,
            );
          }
          return [...prev, { ...item, quantity: 1 }];
        });
        return { ok: true };
      },
      decrement: (menuItemId) => {
        setItems((prev) => {
          const next = prev
            .map((i) => (i.menuItemId === menuItemId ? { ...i, quantity: i.quantity - 1 } : i))
            .filter((i) => i.quantity > 0);
          if (next.length === 0) {
            setVendorId(null);
            setVendorName(null);
          }
          return next;
        });
      },
      removeItem: (menuItemId) => {
        setItems((prev) => {
          const next = prev.filter((i) => i.menuItemId !== menuItemId);
          if (next.length === 0) {
            setVendorId(null);
            setVendorName(null);
          }
          return next;
        });
      },
      clear: () => {
        setItems([]);
        setVendorId(null);
        setVendorName(null);
      },
    };
  }, [vendorId, vendorName, items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider');
  }
  return ctx;
}
