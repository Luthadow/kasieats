import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ORDER_STATUS_LABELS } from '@kasieats/shared';
import { useAuth } from '../../src/context/AuthContext';
import { apiRequest } from '../../src/services/api';

interface OrderDetail {
  id: string;
  status: string;
  totalAmount: number;
  deliveryAddress: string;
  estimatedDeliveryMinutes: number | null;
  vendor: { storeName: string };
  items: Array<{ name: string; quantity: number }>;
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !token) return;

    const fetchOrder = () => {
      apiRequest<{ success: boolean; data: OrderDetail }>(`/orders/${id}`, {}, token)
        .then((response) => setOrder(response.data))
        .finally(() => setLoading(false));
    };

    fetchOrder();
    const interval = setInterval(fetchOrder, 10000);
    return () => clearInterval(interval);
  }, [id, token]);

  if (!token) {
    return (
      <View style={styles.center}>
        <Text>Sign in to track your order.</Text>
      </View>
    );
  }

  if (loading || !order) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Order status</Text>
        <Text style={styles.statusValue}>{ORDER_STATUS_LABELS[order.status] ?? order.status}</Text>
        <Text style={styles.meta}>
          {order.vendor.storeName} · ETA {order.estimatedDeliveryMinutes ?? 35} min
        </Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Items</Text>
        {order.items.map((item, index) => (
          <Text key={`${item.name}-${index}`} style={styles.itemLine}>
            {item.quantity}x {item.name}
          </Text>
        ))}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Delivery</Text>
        <Text>{order.deliveryAddress}</Text>
        <Text style={styles.total}>Total paid: R{order.totalAmount.toFixed(2)}</Text>
      </View>

      <Pressable style={styles.secondaryButton} onPress={() => router.push('/orders')}>
        <Text style={styles.secondaryButtonText}>View all orders</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statusCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 20,
  },
  statusLabel: { color: '#94a3b8', marginBottom: 4 },
  statusValue: { color: '#fff', fontSize: 28, fontWeight: '800' },
  meta: { color: '#cbd5e1', marginTop: 8 },
  panel: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  panelTitle: { fontWeight: '800', marginBottom: 4 },
  itemLine: { color: '#334155' },
  total: { fontWeight: '800', marginTop: 8 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: { fontWeight: '700' },
});
