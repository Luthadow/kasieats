import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, router, useFocusEffect } from 'expo-router';
import { apiData } from '../src/services/api';
import { useAuth } from '../src/context/AuthContext';
import { statusColor, theme } from '../src/theme';
import { ORDER_STATUS_LABELS, type OrderDto } from '@kasieats/shared';

const ACTIVE_STATUSES = ['pending', 'accepted', 'preparing', 'ready', 'picked_up', 'en_route'];

export default function OrdersScreen() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = await apiData<OrderDto[]>('/orders');
      setOrders(data ?? []);
    } catch {
      // keep previous data on transient errors
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
      // Poll every 10s while any order is active.
      pollRef.current = setInterval(() => {
        setOrders((current) => {
          if (current.some((o) => ACTIVE_STATUSES.includes(o.status))) {
            load();
          }
          return current;
        });
      }, 10000);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }, [load]),
  );

  if (!token) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Your orders</Text>
        <Text style={styles.subtitle}>Sign in to see live order tracking.</Text>
        <Pressable style={styles.primaryBtn} onPress={() => router.push('/login')}>
          <Text style={styles.primaryBtnText}>Sign in</Text>
        </Pressable>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.brand} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={orders}
      keyExtractor={(o) => o.id}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          tintColor={theme.brand}
        />
      }
      renderItem={({ item }) => (
        <Link href={`/order/${item.id}`} asChild>
          <Pressable style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.store}>{item.vendor.storeName}</Text>
              <Text style={[styles.status, { color: statusColor[item.status] ?? theme.muted }]}>
                {ORDER_STATUS_LABELS[item.status] ?? item.status}
              </Text>
            </View>
            <Text style={styles.items}>
              {item.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
            </Text>
            <Text style={styles.total}>R{item.totalAmount.toFixed(2)}</Text>
          </Pressable>
        </Link>
      )}
      ListEmptyComponent={<Text style={styles.subtitle}>No orders yet. Time for a kota!</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.cream },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: theme.cream,
  },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8, color: theme.text },
  subtitle: { color: theme.muted, lineHeight: 22, textAlign: 'center' },
  card: {
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  store: { fontSize: 16, fontWeight: '800', color: theme.text, flex: 1 },
  status: { fontWeight: '800', fontSize: 13 },
  items: { color: theme.muted, marginTop: 8 },
  total: { fontWeight: '800', marginTop: 8, color: theme.text },
  primaryBtn: {
    backgroundColor: theme.brand,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    marginTop: 20,
  },
  primaryBtnText: { color: '#fff', fontWeight: '800' },
});
