import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { DELIVERY_STATUS_LABELS, ORDER_STATUS_LABELS } from '@kasieats/shared';
import { useAuth } from '../../src/context/AuthContext';
import { apiRequest } from '../../src/services/api';

interface DeliveryDetail {
  id: string;
  status: string;
  driverEarned: number;
  pickupAddress: string;
  deliveryAddress: string;
  order: {
    status: string;
    specialInstructions: string | null;
    vendor: { storeName: string; phone: string };
    customer: { firstName: string; lastName: string; phone: string };
    items: Array<{ name: string; quantity: number }>;
  };
}

type DeliveryAction = 'collect' | 'start_delivery' | 'complete';

export default function DeliveryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const [delivery, setDelivery] = useState<DeliveryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const loadDelivery = async () => {
    if (!token) return;
    const response = await apiRequest<{ success: boolean; data: DeliveryDetail | null }>(
      '/driver/deliveries/active',
      {},
      token,
    );
    if (response.data && response.data.id === id) {
      setDelivery(response.data);
    } else if (response.data) {
      setDelivery(response.data);
    }
  };

  useEffect(() => {
    if (!token || !id) return;
    loadDelivery()
      .catch(() => null)
      .finally(() => setLoading(false));
    const interval = setInterval(loadDelivery, 5000);
    return () => clearInterval(interval);
  }, [token, id]);

  const performAction = async (action: DeliveryAction) => {
    if (!token || !delivery) return;
    setActing(true);
    try {
      await apiRequest(
        `/driver/deliveries/${delivery.id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ action }),
        },
        token,
      );

      if (action === 'complete') {
        Alert.alert('Delivery complete', `You earned R${delivery.driverEarned.toFixed(2)}`);
        router.replace('/');
        return;
      }

      await apiRequest(
        '/driver/location',
        {
          method: 'POST',
          body: JSON.stringify({ latitude: -25.66, longitude: 27.24 }),
        },
        token,
      );
      await loadDelivery();
    } catch (error) {
      Alert.alert('Action failed', error instanceof Error ? error.message : 'Try again');
    } finally {
      setActing(false);
    }
  };

  const nextAction = (): { label: string; action: DeliveryAction } | null => {
    if (!delivery) return null;
    switch (delivery.status) {
      case 'assigned':
        return { label: 'Collect order from vendor', action: 'collect' };
      case 'picked_up':
        return { label: 'Start delivery to customer', action: 'start_delivery' };
      case 'en_route':
        return { label: 'Complete delivery', action: 'complete' };
      default:
        return null;
    }
  };

  if (loading || !delivery) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  const action = nextAction();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Delivery status</Text>
        <Text style={styles.statusValue}>
          {DELIVERY_STATUS_LABELS[delivery.status] ?? delivery.status}
        </Text>
        <Text style={styles.payout}>Payout: R{delivery.driverEarned.toFixed(2)}</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Vendor pickup</Text>
        <Text style={styles.bold}>{delivery.order.vendor.storeName}</Text>
        <Text>{delivery.pickupAddress}</Text>
        <Text style={styles.phone}>{delivery.order.vendor.phone}</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Customer drop-off</Text>
        <Text style={styles.bold}>
          {delivery.order.customer.firstName} {delivery.order.customer.lastName}
        </Text>
        <Text>{delivery.deliveryAddress}</Text>
        <Text style={styles.phone}>{delivery.order.customer.phone}</Text>
        {delivery.order.specialInstructions && (
          <Text style={styles.note}>Note: {delivery.order.specialInstructions}</Text>
        )}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Order items</Text>
        {delivery.order.items.map((item, index) => (
          <Text key={`${item.name}-${index}`}>
            {item.quantity}x {item.name}
          </Text>
        ))}
        <Text style={styles.orderStatus}>
          Order: {ORDER_STATUS_LABELS[delivery.order.status] ?? delivery.order.status}
        </Text>
      </View>

      {action && (
        <Pressable
          style={[styles.primaryButton, acting && styles.buttonDisabled]}
          onPress={() => performAction(action.action)}
          disabled={acting}
        >
          <Text style={styles.primaryButtonText}>{acting ? 'Updating...' : action.label}</Text>
        </Pressable>
      )}
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
  statusLabel: { color: '#94a3b8' },
  statusValue: { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 4 },
  payout: { color: '#fdba74', marginTop: 8, fontWeight: '700' },
  panel: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    gap: 6,
  },
  panelTitle: { fontWeight: '800', marginBottom: 4 },
  bold: { fontWeight: '700' },
  phone: { color: '#c2410c', fontWeight: '600' },
  note: { color: '#64748b', marginTop: 4 },
  orderStatus: { marginTop: 8, fontWeight: '600', color: '#64748b' },
  primaryButton: {
    backgroundColor: '#f97316',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
