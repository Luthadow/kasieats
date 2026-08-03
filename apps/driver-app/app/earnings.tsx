import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { apiData } from '../src/services/api';
import { theme } from '../src/theme';
import type { DeliveryJobDto } from '@kasieats/shared';

const DONE = ['delivered'];
const ACTIVE = ['assigned', 'picked_up', 'en_route', 'arrived'];

const STATUS_LABEL: Record<string, string> = {
  assigned: 'Assigned',
  picked_up: 'Picked up',
  en_route: 'En route',
  arrived: 'Arrived',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function EarningsScreen() {
  const [deliveries, setDeliveries] = useState<DeliveryJobDto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await apiData<DeliveryJobDto[]>('/deliveries/mine').catch(() => []);
      setDeliveries(data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const completed = deliveries.filter((d) => DONE.includes(d.status));
  const totalEarnings = completed.reduce((sum, d) => sum + (d.earnings ?? 0), 0);

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
      contentContainerStyle={{ padding: 16 }}
      data={deliveries}
      keyExtractor={(d) => d.id ?? d.orderId}
      ListHeaderComponent={
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Total earned</Text>
          <Text style={styles.summaryValue}>R{totalEarnings.toFixed(2)}</Text>
          <Text style={styles.summarySub}>{completed.length} completed deliveries</Text>
        </View>
      }
      renderItem={({ item }) => {
        const active = ACTIVE.includes(item.status);
        const content = (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.store}>{item.vendor.storeName}</Text>
              <Text style={[styles.status, active && styles.statusActive]}>
                {STATUS_LABEL[item.status] ?? item.status}
              </Text>
            </View>
            <Text style={styles.addr}>{item.deliveryAddress}</Text>
            {item.earnings != null ? (
              <Text style={styles.earn}>R{item.earnings.toFixed(2)}</Text>
            ) : null}
          </View>
        );
        return active ? (
          <Pressable onPress={() => router.push(`/delivery/${item.id}`)}>{content}</Pressable>
        ) : (
          content
        );
      }}
      ListEmptyComponent={<Text style={styles.empty}>No deliveries yet.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.cream },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.cream },
  summary: {
    backgroundColor: theme.brand,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  summaryLabel: { color: '#FFE9D6', fontWeight: '700' },
  summaryValue: { color: '#fff', fontWeight: '800', fontSize: 34, marginTop: 4 },
  summarySub: { color: '#FFE9D6', marginTop: 4 },
  card: {
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  store: { fontWeight: '800', color: theme.text, fontSize: 16, flex: 1 },
  status: { fontWeight: '700', color: theme.muted, fontSize: 13 },
  statusActive: { color: theme.brandDark },
  addr: { color: theme.muted, marginTop: 6 },
  earn: { fontWeight: '800', color: theme.success, marginTop: 8 },
  empty: { textAlign: 'center', color: theme.muted, marginTop: 24 },
});
