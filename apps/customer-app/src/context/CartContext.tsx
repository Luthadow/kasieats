import React, { createContext, useContext, useMemo, useState } from 'react';
import { DEFAULT_DELIVERY_FEE_ZAR, SERVICE_FEE_RATE } from '@kasieats/shared';

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartContextValue {
  vendorId: string | null;
  vendorName: string | null;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  addItem: (
    vendorId: string,
    vendorName: string,
    item: Omit<CartItem, 'quantity'>,
    quantity?: number,
  ) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  removeItem: (menuItemId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [vendorName, setVendorName] = useState<string | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = items.length > 0 ? DEFAULT_DELIVERY_FEE_ZAR : 0;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE * 100) / 100;
  const total = Math.round((subtotal + deliveryFee + serviceFee) * 100) / 100;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const value = useMemo<CartContextValue>(
    () => ({
      vendorId,
      vendorName,
      items,
      itemCount,
      subtotal,
      deliveryFee,
      serviceFee,
      total,
      addItem: (nextVendorId, nextVendorName, item, quantity = 1) => {
        setVendorId(nextVendorId);
        setVendorName(nextVendorName);
        setItems((current) => {
          const sameVendor = !vendorId || vendorId === nextVendorId;
          const base = sameVendor ? current : [];
          const existing = base.find((entry) => entry.menuItemId === item.menuItemId);

          if (existing) {
            return base.map((entry) =>
              entry.menuItemId === item.menuItemId
                ? { ...entry, quantity: entry.quantity + quantity }
                : entry,
            );
          }

          return [...base, { ...item, quantity }];
        });
      },
      updateQuantity: (menuItemId, quantity) => {
        if (quantity <= 0) {
          setItems((current) => {
            const next = current.filter((entry) => entry.menuItemId !== menuItemId);
            if (next.length === 0) {
              setVendorId(null);
              setVendorName(null);
            }
            return next;
          });
          return;
        }

        setItems((current) =>
          current.map((entry) =>
            entry.menuItemId === menuItemId ? { ...entry, quantity } : entry,
          ),
        );
      },
      removeItem: (menuItemId) => {
        setItems((current) => {
          const next = current.filter((entry) => entry.menuItemId !== menuItemId);
          if (next.length === 0) {
            setVendorId(null);
            setVendorName(null);
          }
          return next;
        });
      },
      clearCart: () => {
        setVendorId(null);
        setVendorName(null);
        setItems([]);
      },
    }),
    [vendorId, vendorName, items, itemCount, subtotal, deliveryFee, serviceFee, total],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
