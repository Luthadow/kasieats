import { useCallback, useEffect, useState } from 'react';
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

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
}

export default function OrdersScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!token) return;
    const [ordersResponse, alertsResponse] = await Promise.all([
      apiRequest<{ success: boolean; data: OrderSummary[] }>('/orders', {}, token),
      apiRequest<{ success: boolean; data: NotificationItem[] }>(
        '/notifications?unreadOnly=true',
        {},
        token,
      ),
    ]);
    setOrders(ordersResponse.data);
    setNotifications(alertsResponse.data.slice(0, 3));
  }, [token]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    loadData()
      .finally(() => setLoading(false));

    const interval = setInterval(() => {
      loadData().catch(() => null);
    }, 12000);
    return () => clearInterval(interval);
  }, [token, loadData]);

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
      {notifications.length > 0 && (
        <View style={styles.alertsPanel}>
          <Text style={styles.alertsTitle}>Updates</Text>
          {notifications.map((item) => (
            <View key={item.id} style={styles.alertItem}>
              <Text style={styles.alertHeading}>{item.title}</Text>
              <Text style={styles.alertMessage}>{item.message}</Text>
            </View>
          ))}
        </View>
      )}
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
  alertsPanel: {
    backgroundColor: '#eef2ff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  alertsTitle: { fontWeight: '800', color: '#4338ca', marginBottom: 8 },
  alertItem: { marginBottom: 8 },
  alertHeading: { fontWeight: '700' },
  alertMessage: { color: '#64748b', marginTop: 2, fontSize: 13 },
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
