import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { apiData, apiRequest, json } from '../../src/services/api';
import { theme } from '../../src/theme';
import type { DeliveryJobDto } from '@kasieats/shared';

// status -> next action button. endpoint POST /deliveries/:id/<action>
const NEXT: Record<string, { action: string; label: string }> = {
  assigned: { action: 'pickup', label: 'Confirm pickup' },
  picked_up: { action: 'en-route', label: 'Start delivery (en route)' },
  en_route: { action: 'arrived', label: 'Mark arrived' },
  arrived: { action: 'deliver', label: 'Complete delivery' },
};

const STEPS = [
  { key: 'assigned', label: 'Assigned' },
  { key: 'picked_up', label: 'Picked up' },
  { key: 'en_route', label: 'En route' },
  { key: 'arrived', label: 'Arrived' },
  { key: 'delivered', label: 'Delivered' },
];

export default function DeliveryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [delivery, setDelivery] = useState<DeliveryJobDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pin, setPin] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const mine = await apiData<DeliveryJobDto[]>('/deliveries/mine').catch(() => []);
      setDelivery((mine ?? []).find((d) => d.id === id) ?? null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const advance = async (action: string) => {
    if (action === 'deliver' && pin.trim().length !== 4) {
      Alert.alert('PIN required', 'Ask the customer for their 4-digit delivery PIN.');
      return;
    }
    setBusy(true);
    try {
      await apiRequest(`/deliveries/${id}/${action}`, {
        method: 'POST',
        ...(action === 'deliver' ? json({ pin: pin.trim() }) : {}),
      });
      await load();
      if (action === 'deliver') {
        Alert.alert('Delivered!', 'Nice work. Earnings added.', [
          { text: 'Back home', onPress: () => router.replace('/') },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Could not update');
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

  if (!delivery) {
    return (
      <View style={styles.center}>
        <Text>Delivery not found.</Text>
        <Pressable style={styles.linkBtn} onPress={() => router.replace('/')}>
          <Text style={styles.linkText}>Back home</Text>
        </Pressable>
      </View>
    );
  }

  const next = NEXT[delivery.status];
  const currentIndex = STEPS.findIndex((s) => s.key === delivery.status);

  return (
    <View style={styles.container}>
      <View style={styles.panel}>
        <Text style={styles.vendor}>{delivery.vendor.storeName}</Text>
        <Text style={styles.label}>Pickup</Text>
        <Text style={styles.value}>{delivery.vendor.address ?? '—'}</Text>
        <Text style={styles.label}>Drop-off</Text>
        <Text style={styles.value}>{delivery.deliveryAddress}</Text>
        {delivery.customer?.name ? (
          <>
            <Text style={styles.label}>Customer</Text>
            <Text style={styles.value}>
              {delivery.customer.name}
              {delivery.customer.phone ? ` · ${delivery.customer.phone}` : ''}
            </Text>
          </>
        ) : null}
        {delivery.earnings != null ? (
          <Text style={styles.earn}>Earnings: R{delivery.earnings.toFixed(2)}</Text>
        ) : null}
      </View>

      <View style={styles.panel}>
        {STEPS.map((step, i) => {
          const done = currentIndex >= 0 && i <= currentIndex;
          return (
            <View key={step.key} style={styles.stepRow}>
              <View style={[styles.dot, done && styles.dotDone]} />
              <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>{step.label}</Text>
            </View>
          );
        })}
      </View>

      {next?.action === 'deliver' ? (
        <View style={styles.panel}>
          <Text style={styles.label}>Delivery PIN</Text>
          <Text style={styles.pinHint}>Ask the customer for their 4-digit delivery PIN.</Text>
          <TextInput
            style={styles.pinInput}
            value={pin}
            onChangeText={setPin}
            placeholder="0000"
            keyboardType="number-pad"
            maxLength={4}
          />
        </View>
      ) : null}

      {next ? (
        <Pressable
          style={[styles.actionBtn, busy && { opacity: 0.6 }]}
          onPress={() => advance(next.action)}
          disabled={busy}
        >
          <Text style={styles.actionText}>{busy ? 'Please wait…' : next.label}</Text>
        </Pressable>
      ) : (
        <Text style={styles.doneText}>This delivery is complete. 🎉</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.cream },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.cream },
  panel: {
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },
  vendor: { fontSize: 18, fontWeight: '800', color: theme.text, marginBottom: 8 },
  label: { color: theme.muted, fontSize: 13, marginTop: 8, fontWeight: '700' },
  value: { color: theme.text, fontSize: 15, marginTop: 2 },
  earn: { color: theme.brandDark, fontWeight: '800', marginTop: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: theme.border,
    backgroundColor: '#fff',
  },
  dotDone: { backgroundColor: theme.brand, borderColor: theme.brand },
  stepLabel: { color: theme.muted },
  stepLabelDone: { color: theme.text, fontWeight: '700' },
  pinHint: { color: theme.muted, fontSize: 13, marginTop: 2, marginBottom: 8 },
  pinInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 22,
    letterSpacing: 8,
    textAlign: 'center',
    color: theme.text,
  },
  actionBtn: {
    backgroundColor: theme.brand,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  doneText: { textAlign: 'center', color: theme.success, fontWeight: '800', marginTop: 8 },
  linkBtn: { marginTop: 16 },
  linkText: { color: theme.brandDark, fontWeight: '700' },
});
