import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ORDER_STATUS_LABELS } from '@kasieats/shared';
import { useAuth } from '../../src/context/AuthContext';
import { useRealtime } from '../../src/context/RealtimeContext';
import { apiRequest } from '../../src/services/api';

interface OrderDetail {
  id: string;
  status: string;
  totalAmount: number;
  deliveryAddress: string;
  estimatedDeliveryMinutes: number | null;
  vendor: { storeName: string };
  items: Array<{ name: string; quantity: number }>;
  delivery: {
    status: string;
    driver: {
      name: string;
      rating: number;
      vehicleType: string;
      latitude: number | null;
      longitude: number | null;
    } | null;
  } | null;
}

interface TrackingData {
  driver: {
    name: string;
    rating: number;
    vehicleType: string;
    latitude: number | null;
    longitude: number | null;
  } | null;
}

interface ReviewSummary {
  revieweeType: string;
  rating: number;
}

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} onPress={() => onChange(star)}>
          <Text style={[styles.star, star <= value && styles.starActive]}>★</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const { watchOrder, onOrderUpdate } = useRealtime();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [reviews, setReviews] = useState<ReviewSummary[]>([]);
  const [vendorRating, setVendorRating] = useState(5);
  const [driverRating, setDriverRating] = useState(5);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReviews = useCallback(async () => {
    if (!id || !token) return;
    const response = await apiRequest<{ success: boolean; data: ReviewSummary[] }>(
      `/orders/${id}/reviews`,
      {},
      token,
    );
    setReviews(response.data);
  }, [id, token]);

  const fetchAll = useCallback(async () => {
    if (!id || !token) return;
    const [orderResponse, trackingResponse] = await Promise.all([
      apiRequest<{ success: boolean; data: OrderDetail }>(`/orders/${id}`, {}, token),
      apiRequest<{ success: boolean; data: TrackingData }>(`/orders/${id}/tracking`, {}, token),
    ]);
    setOrder(orderResponse.data);
    setTracking(trackingResponse.data);
  }, [id, token]);

  useEffect(() => {
    if (!id || !token) return;

    watchOrder(id);
    fetchAll()
      .catch(() => null)
      .finally(() => setLoading(false));
    loadReviews();

    const unsub = onOrderUpdate((event) => {
      if (event.orderId !== id) return;
      fetchAll().catch(() => null);
      if (event.status === 'delivered') {
        loadReviews().catch(() => null);
      }
    });

    const interval = setInterval(() => {
      fetchAll().catch(() => null);
    }, 60000);

    return () => {
      unsub();
      clearInterval(interval);
      watchOrder(null);
    };
  }, [id, token, fetchAll, loadReviews, watchOrder, onOrderUpdate]);

  const submitReview = async (revieweeType: 'vendor' | 'driver', rating: number) => {
    if (!token || !id) return;
    setSubmitting(revieweeType);
    try {
      await apiRequest(
        `/orders/${id}/reviews`,
        {
          method: 'POST',
          body: JSON.stringify({ revieweeType, rating }),
        },
        token,
      );
      await loadReviews();
      Alert.alert('Thanks!', `Your ${revieweeType} rating was submitted.`);
    } catch (error) {
      Alert.alert('Review failed', error instanceof Error ? error.message : 'Please try again');
    } finally {
      setSubmitting(null);
    }
  };

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

  const driver = tracking?.driver ?? order.delivery?.driver;
  const hasVendorReview = reviews.some((r) => r.revieweeType === 'vendor');
  const hasDriverReview = reviews.some((r) => r.revieweeType === 'driver');

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Order status</Text>
        <Text style={styles.statusValue}>{ORDER_STATUS_LABELS[order.status] ?? order.status}</Text>
        <Text style={styles.meta}>
          {order.vendor.storeName} · ETA {order.estimatedDeliveryMinutes ?? 35} min
        </Text>
      </View>

      {driver && (
        <View style={styles.driverCard}>
          <Text style={styles.panelTitle}>Your driver</Text>
          <Text style={styles.driverName}>{driver.name}</Text>
          <Text style={styles.driverMeta}>
            ★ {driver.rating} · {driver.vehicleType}
          </Text>
          {driver.latitude && driver.longitude ? (
            <Text style={styles.location}>
              Live location: {driver.latitude.toFixed(4)}, {driver.longitude.toFixed(4)}
            </Text>
          ) : (
            <Text style={styles.location}>Driver location updating...</Text>
          )}
        </View>
      )}

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
        <Text style={styles.total}>Total: R{order.totalAmount.toFixed(2)}</Text>
      </View>

      {order.status === 'delivered' && (
        <View style={styles.reviewPanel}>
          <Text style={styles.panelTitle}>Rate your experience</Text>

          <Text style={styles.reviewLabel}>{order.vendor.storeName}</Text>
          {hasVendorReview ? (
            <Text style={styles.reviewDone}>★ {reviews.find((r) => r.revieweeType === 'vendor')?.rating} — Thanks!</Text>
          ) : (
            <>
              <StarRating value={vendorRating} onChange={setVendorRating} />
              <Pressable
                style={styles.reviewButton}
                disabled={submitting === 'vendor'}
                onPress={() => submitReview('vendor', vendorRating)}
              >
                <Text style={styles.reviewButtonText}>
                  {submitting === 'vendor' ? 'Submitting...' : 'Rate vendor'}
                </Text>
              </Pressable>
            </>
          )}

          {driver && (
            <>
              <Text style={[styles.reviewLabel, { marginTop: 16 }]}>{driver.name}</Text>
              {hasDriverReview ? (
                <Text style={styles.reviewDone}>
                  ★ {reviews.find((r) => r.revieweeType === 'driver')?.rating} — Thanks!
                </Text>
              ) : (
                <>
                  <StarRating value={driverRating} onChange={setDriverRating} />
                  <Pressable
                    style={styles.reviewButton}
                    disabled={submitting === 'driver'}
                    onPress={() => submitReview('driver', driverRating)}
                  >
                    <Text style={styles.reviewButtonText}>
                      {submitting === 'driver' ? 'Submitting...' : 'Rate driver'}
                    </Text>
                  </Pressable>
                </>
              )}
            </>
          )}
        </View>
      )}

      <Pressable style={styles.secondaryButton} onPress={() => router.push('/orders')}>
        <Text style={styles.secondaryButtonText}>View all orders</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statusCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  statusLabel: { color: '#94a3b8', marginBottom: 4 },
  statusValue: { color: '#fff', fontSize: 28, fontWeight: '800' },
  meta: { color: '#cbd5e1', marginTop: 8 },
  driverCard: {
    backgroundColor: '#fff7ed',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fdba74',
    marginBottom: 12,
  },
  panel: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 8,
    marginBottom: 12,
  },
  reviewPanel: {
    backgroundColor: '#eef2ff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  panelTitle: { fontWeight: '800', marginBottom: 4 },
  reviewLabel: { fontWeight: '700', marginBottom: 8 },
  reviewDone: { color: '#4338ca', fontWeight: '700' },
  starRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  star: { fontSize: 28, color: '#cbd5e1' },
  starActive: { color: '#f97316' },
  reviewButton: {
    backgroundColor: '#6366f1',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  reviewButtonText: { color: '#fff', fontWeight: '700' },
  driverName: { fontSize: 18, fontWeight: '800' },
  driverMeta: { color: '#c2410c', fontWeight: '600' },
  location: { color: '#64748b', marginTop: 6, fontSize: 13 },
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
