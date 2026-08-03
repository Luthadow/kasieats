import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { apiData, apiRequest, json } from '../src/services/api';
import { useAuth } from '../src/context/AuthContext';
import { theme } from '../src/theme';
import type { DeliveryJobDto, DriverSubscriptionDto } from '@kasieats/shared';

// Default location (Rustenburg) — a real app would use GPS.
const LAT = -25.6544;
const LNG = 27.2389;

const IN_PROGRESS = ['assigned', 'picked_up', 'en_route', 'arrived'];

const SUB_STATUS_LABEL: Record<string, string> = {
  trialing: 'Free Trial',
  active: 'Active',
  past_due: 'Payment Due',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

export default function DriverHome() {
  const { token, user, hydrating, clearAuth } = useAuth();
  const [online, setOnline] = useState(false);
  const [jobs, setJobs] = useState<DeliveryJobDto[]>([]);
  const [active, setActive] = useState<DeliveryJobDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<DriverSubscriptionDto | null>(null);
  const [paying, setPaying] = useState(false);
  const [subMessage, setSubMessage] = useState<string | null>(null);

  const loadSubscription = useCallback(async () => {
    if (!token) return;
    const sub = await apiData<DriverSubscriptionDto | null>('/subscriptions/driver/me').catch(
      () => null,
    );
    setSubscription(sub ?? null);
  }, [token]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [available, mine] = await Promise.all([
        apiData<DeliveryJobDto[]>('/deliveries/available').catch(() => []),
        apiData<DeliveryJobDto[]>('/deliveries/mine').catch(() => []),
      ]);
      setJobs(available ?? []);
      setActive((mine ?? []).find((d) => IN_PROGRESS.includes(d.status)) ?? null);
      await loadSubscription();
    } finally {
      setLoading(false);
    }
  }, [token, loadSubscription]);

  const paySubscription = async () => {
    setPaying(true);
    setSubMessage(null);
    try {
      const checkout = await apiData<{ reference: string; amount: number }>(
        '/subscriptions/driver/checkout',
        { method: 'POST' },
      );
      await apiRequest(`/subscriptions/mock-checkout/${checkout.reference}/confirm`, {
        method: 'POST',
      });
      setSubMessage(`Payment of R${checkout.amount} confirmed! Subscription activated.`);
      await loadSubscription();
    } catch (error) {
      setSubMessage(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (hydrating) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.brand} />
      </View>
    );
  }

  if (!token) return <Redirect href="/login" />;

  const toggleOnline = async (value: boolean) => {
    setOnline(value);
    try {
      await apiRequest('/deliveries/driver/status', {
        method: 'PATCH',
        ...json({ isOnline: value, latitude: LAT, longitude: LNG }),
      });
      if (value) load();
      else setJobs([]);
    } catch (error) {
      setOnline(!value);
      Alert.alert('Error', error instanceof Error ? error.message : 'Could not update status');
    }
  };

  const claim = async (job: DeliveryJobDto) => {
    setBusyId(job.orderId);
    try {
      await apiRequest(`/deliveries/${job.orderId}/claim`, { method: 'POST' });
      await load();
      Alert.alert('Job claimed', 'Head to the vendor for pickup.');
    } catch (error) {
      Alert.alert('Could not claim', error instanceof Error ? error.message : 'Try again');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusCard}>
        <View>
          <Text style={styles.hello}>Hi {user?.firstName ?? 'driver'} 👋</Text>
          <Text style={styles.statusText}>{online ? 'You are online' : 'You are offline'}</Text>
        </View>
        <Switch
          value={online}
          onValueChange={toggleOnline}
          trackColor={{ true: theme.brand, false: '#cbd5e1' }}
          thumbColor="#fff"
        />
      </View>

      <View style={styles.navRow}>
        <Pressable style={styles.navBtn} onPress={() => router.push('/earnings')}>
          <Text style={styles.navBtnText}>My deliveries & earnings</Text>
        </Pressable>
        <Pressable style={[styles.navBtn, styles.navBtnGhost]} onPress={() => clearAuth()}>
          <Text style={styles.navBtnGhostText}>Sign out</Text>
        </Pressable>
      </View>

      <View style={styles.subCard}>
        <Text style={styles.subTitle}>MTHURA Driver Subscription — R100/month</Text>
        {subscription ? (
          <>
            <Text style={styles.subStatus}>
              {SUB_STATUS_LABEL[subscription.status] ?? subscription.status}
              {subscription.currentPeriodEnd
                ? ` · until ${new Date(subscription.currentPeriodEnd).toLocaleDateString('en-ZA')}`
                : ''}
            </Text>
            {['past_due', 'expired', 'trialing', 'cancelled'].includes(subscription.status) ? (
              <Pressable
                style={[styles.payBtn, paying && { opacity: 0.6 }]}
                onPress={paySubscription}
                disabled={paying}
              >
                <Text style={styles.payBtnText}>
                  {paying ? 'Processing…' : 'Pay R100 (sandbox)'}
                </Text>
              </Pressable>
            ) : null}
          </>
        ) : (
          <Pressable
            style={[styles.payBtn, paying && { opacity: 0.6 }]}
            onPress={paySubscription}
            disabled={paying}
          >
            <Text style={styles.payBtnText}>
              {paying ? 'Processing…' : 'Activate subscription — R100/month'}
            </Text>
          </Pressable>
        )}
        {subMessage ? <Text style={styles.subMessage}>{subMessage}</Text> : null}
      </View>

      {active ? (
        <Pressable style={styles.activeBanner} onPress={() => router.push(`/delivery/${active.id}`)}>
          <Text style={styles.activeTitle}>Active delivery in progress</Text>
          <Text style={styles.activeSub}>
            {active.vendor.storeName} → {active.deliveryAddress}
          </Text>
          <Text style={styles.activeCta}>Tap to continue →</Text>
        </Pressable>
      ) : null}

      <Text style={styles.sectionTitle}>Available jobs</Text>

      {!online ? (
        <Text style={styles.hint}>Go online to see nearby delivery jobs.</Text>
      ) : loading ? (
        <ActivityIndicator color={theme.brand} style={{ marginTop: 16 }} />
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id ?? item.orderId}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View style={styles.jobCard}>
              <Text style={styles.jobVendor}>{item.vendor.storeName}</Text>
              <Text style={styles.jobRow}>Pickup: {item.vendor.address ?? '—'}</Text>
              <Text style={styles.jobRow}>Drop-off: {item.deliveryAddress}</Text>
              <View style={styles.jobFoot}>
                <Text style={styles.jobEarn}>
                  {item.earnings != null ? `R${item.earnings.toFixed(2)}` : ''}
                  {item.distanceKm != null ? `  ·  ${item.distanceKm} km` : ''}
                </Text>
                <Pressable
                  style={styles.claimBtn}
                  onPress={() => claim(item)}
                  disabled={busyId === item.orderId}
                >
                  <Text style={styles.claimBtnText}>
                    {busyId === item.orderId ? '…' : 'Claim'}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.hint}>No jobs available right now.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.cream },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.cream },
  statusCard: {
    backgroundColor: theme.brand,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hello: { color: '#fff', fontWeight: '800', fontSize: 18 },
  statusText: { color: '#FFE9D6', marginTop: 4 },
  navRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  navBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  navBtnText: { color: theme.brandDark, fontWeight: '700' },
  navBtnGhost: { flex: 0, paddingHorizontal: 18 },
  navBtnGhostText: { color: theme.muted, fontWeight: '700' },
  subCard: {
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  subTitle: { fontWeight: '800', color: theme.text },
  subStatus: { color: theme.muted, marginTop: 6, fontWeight: '600' },
  payBtn: {
    backgroundColor: theme.brand,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  payBtnText: { color: '#fff', fontWeight: '800' },
  subMessage: { marginTop: 8, color: theme.brandDark, fontWeight: '600' },
  activeBanner: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 16,
    marginTop: 14,
  },
  activeTitle: { color: '#fff', fontWeight: '800' },
  activeSub: { color: '#CBD5E1', marginTop: 4 },
  activeCta: { color: theme.brand, fontWeight: '800', marginTop: 8 },
  sectionTitle: { fontWeight: '800', fontSize: 16, marginTop: 20, marginBottom: 8, color: theme.text },
  hint: { color: theme.muted, marginTop: 12 },
  jobCard: {
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  jobVendor: { fontWeight: '800', fontSize: 16, color: theme.text, marginBottom: 6 },
  jobRow: { color: '#374151', marginTop: 2 },
  jobFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  jobEarn: { fontWeight: '800', color: theme.brandDark },
  claimBtn: {
    backgroundColor: theme.brand,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  claimBtnText: { color: '#fff', fontWeight: '800' },
});
