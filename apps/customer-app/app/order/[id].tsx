import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { apiData, apiRequest, json } from '../../src/services/api';
import { statusColor, theme } from '../../src/theme';
import { ORDER_STATUS_LABELS, type OrderDto } from '@kasieats/shared';

const ACTIVE_STATUSES = ['pending', 'accepted', 'preparing', 'ready', 'picked_up', 'en_route'];
const CANCELLABLE = ['pending', 'accepted'];

const TIMELINE: { key: string; label: string }[] = [
  { key: 'pending', label: 'Order placed' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'en_route', label: 'On the way' },
  { key: 'delivered', label: 'Delivered' },
];

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await apiData<OrderDto>(`/orders/${id}`);
      setOrder(data);
    } catch {
      // ignore transient errors
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    pollRef.current = setInterval(() => {
      setOrder((current) => {
        if (!current || ACTIVE_STATUSES.includes(current.status)) load();
        return current;
      });
    }, 10000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [load]);

  const cancelOrder = () => {
    Alert.alert('Cancel order?', 'This cannot be undone.', [
      { text: 'Keep order', style: 'cancel' },
      {
        text: 'Cancel order',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await apiRequest(`/orders/${id}/cancel`, { method: 'POST' });
            await load();
          } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Could not cancel');
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const submitReview = async (rating: number) => {
    setBusy(true);
    try {
      await apiRequest('/reviews', {
        method: 'POST',
        ...json({ orderId: id, vendorRating: rating, driverRating: rating, comment: 'Great order!' }),
      });
      setReviewed(true);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Could not submit review');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.brand} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Text>Order not found</Text>
      </View>
    );
  }

  const currentIndex = TIMELINE.findIndex((t) => t.key === order.status);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.headerRow}>
        <Text style={styles.store}>{order.vendor.storeName}</Text>
        <Text style={[styles.status, { color: statusColor[order.status] ?? theme.muted }]}>
          {ORDER_STATUS_LABELS[order.status] ?? order.status}
        </Text>
      </View>

      {order.status !== 'cancelled' && order.status !== 'rejected' ? (
        <View style={styles.panel}>
          {TIMELINE.map((step, i) => {
            const done = currentIndex >= 0 && i <= currentIndex;
            return (
              <View key={step.key} style={styles.timelineRow}>
                <View style={[styles.dot, done && styles.dotDone]} />
                <Text style={[styles.timelineLabel, done && styles.timelineLabelDone]}>
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}

      {order.delivery?.driver ? (
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Your driver</Text>
          <Text style={styles.body}>
            {order.delivery.driver.name} · ★ {order.delivery.driver.rating}
          </Text>
        </View>
      ) : null}

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Items</Text>
        {order.items.map((item, i) => (
          <View key={i} style={styles.itemRow}>
            <Text style={styles.body}>
              {item.quantity}× {item.name}
            </Text>
            <Text style={styles.body}>R{(item.pricePerItem * item.quantity).toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.itemRow}>
          <Text style={styles.body}>Delivery</Text>
          <Text style={styles.body}>R{order.deliveryFee.toFixed(2)}</Text>
        </View>
        <View style={styles.itemRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalLabel}>R{order.totalAmount.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Delivery address</Text>
        <Text style={styles.body}>{order.deliveryAddress}</Text>
      </View>

      {CANCELLABLE.includes(order.status) ? (
        <Pressable style={styles.cancelBtn} onPress={cancelOrder} disabled={busy}>
          <Text style={styles.cancelBtnText}>Cancel order</Text>
        </Pressable>
      ) : null}

      {order.status === 'delivered' && !reviewed ? (
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Rate your order</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => submitReview(n)} disabled={busy}>
                <Text style={styles.star}>★</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {reviewed ? <Text style={styles.thanks}>Thanks for your feedback! 🎉</Text> : null}

      <Pressable style={styles.linkBtn} onPress={() => router.replace('/orders')}>
        <Text style={styles.linkBtnText}>Back to orders</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.cream },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.cream,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  store: { fontSize: 20, fontWeight: '800', color: theme.text, flex: 1 },
  status: { fontWeight: '800', fontSize: 14 },
  panel: {
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sectionTitle: { fontWeight: '800', color: theme.text, marginBottom: 8 },
  body: { color: '#374151', fontSize: 15 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: theme.border,
    backgroundColor: '#fff',
  },
  dotDone: { backgroundColor: theme.brand, borderColor: theme.brand },
  timelineLabel: { color: theme.muted },
  timelineLabelDone: { color: theme.text, fontWeight: '700' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  divider: { height: 1, backgroundColor: theme.border, marginVertical: 8 },
  totalLabel: { fontWeight: '800', color: theme.text, fontSize: 16 },
  cancelBtn: {
    borderWidth: 1,
    borderColor: theme.danger,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  cancelBtnText: { color: theme.danger, fontWeight: '800' },
  starsRow: { flexDirection: 'row', gap: 8 },
  star: { fontSize: 34, color: theme.brand },
  thanks: { textAlign: 'center', color: theme.success, fontWeight: '700', marginBottom: 12 },
  linkBtn: { alignItems: 'center', padding: 12, marginBottom: 24 },
  linkBtnText: { color: theme.brandDark, fontWeight: '700' },
});
