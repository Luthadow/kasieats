import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { ORDER_STATUS_LABELS } from '@kasieats/shared';
import { useAuth } from '../src/context/AuthContext';
import { apiRequest } from '../src/services/api';

interface OrderSummary {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  vendor: { storeName: string };
}

export default function OrdersScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    apiRequest<{ success: boolean; data: OrderSummary[] }>('/orders', {}, token)
      .then((response) => setOrders(response.data))
      .finally(() => setLoading(false));
  }, [token]);

  if (!token || !user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Your orders</Text>
        <Text style={styles.subtitle}>Sign in to see order history and live tracking.</Text>
        <Link href="/login" asChild>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Sign in</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        ListEmptyComponent={
          <Text style={styles.subtitle}>No orders yet. Your kota journey starts here.</Text>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/order/${item.id}`)}>
            <View>
              <Text style={styles.vendor}>{item.vendor.storeName}</Text>
              <Text style={styles.meta}>
                {ORDER_STATUS_LABELS[item.status] ?? item.status} · R
                {item.totalAmount.toFixed(2)}
              </Text>
              <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: '#64748b', lineHeight: 22, marginBottom: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
  },
  vendor: { fontSize: 16, fontWeight: '800' },
  meta: { color: '#c2410c', marginTop: 6, fontWeight: '600' },
  date: { color: '#64748b', marginTop: 4, fontSize: 12 },
  primaryButton: {
    backgroundColor: '#f97316',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
});
