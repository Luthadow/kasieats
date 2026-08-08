import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { DELIVERY_STATUS_LABELS } from '@kasieats/shared';
import { useAuth } from '../src/context/AuthContext';
import { apiRequest } from '../src/services/api';

interface DashboardData {
  firstName: string;
  isOnline: boolean;
  deliveriesToday: number;
  earningsToday: number;
  pendingEarnings: number;
  averageRating: number;
  activeDelivery: {
    id: string;
    status: string;
    driverEarned: number;
    order: { vendor: { storeName: string } };
  } | null;
}

export default function DriverHomeScreen() {
  const router = useRouter();
  const { token, user, clearAuth } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  const loadDashboard = useCallback(async () => {
    if (!token) return;
    const response = await apiRequest<{ success: boolean; data: DashboardData }>(
      '/driver/dashboard',
      {},
      token,
    );
    setDashboard(response.data);

    const alerts = await apiRequest<{ unreadCount: number }>(
      '/notifications?unreadOnly=true',
      {},
      token,
    );
    setUnreadAlerts(alerts.unreadCount);
  }, [token]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    loadDashboard()
      .catch(() => null)
      .finally(() => setLoading(false));
    const interval = setInterval(loadDashboard, 8000);
    return () => clearInterval(interval);
  }, [token, loadDashboard]);

  const toggleOnline = async (isOnline: boolean) => {
    if (!token) return;
    await apiRequest(
      '/driver/status',
      {
        method: 'POST',
        body: JSON.stringify({
          isOnline,
          latitude: -25.6544,
          longitude: 27.2389,
        }),
      },
      token,
    );
    await loadDashboard();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  if (!token || !user) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>KasiEats Driver</Text>
        <Text style={styles.subtitle}>Sign in to start earning on deliveries.</Text>
        <Link href="/login" asChild>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Sign in</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  if (loading || !dashboard) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Sawubona, {dashboard.firstName}</Text>
        <Text style={styles.heroSubtitle}>★ {dashboard.averageRating.toFixed(1)} rating</Text>
        {unreadAlerts > 0 && (
          <View style={styles.alertBadge}>
            <Text style={styles.alertBadgeText}>{unreadAlerts} new job alert(s)</Text>
          </View>
        )}
        <View style={styles.onlineRow}>
          <Text style={styles.onlineLabel}>{dashboard.isOnline ? 'Online' : 'Offline'}</Text>
          <Switch
            value={dashboard.isOnline}
            onValueChange={toggleOnline}
            trackColor={{ true: '#f97316' }}
          />
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Today</Text>
          <Text style={styles.statValue}>{dashboard.deliveriesToday}</Text>
          <Text style={styles.statHint}>deliveries</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Earned</Text>
          <Text style={styles.statValue}>R{dashboard.earningsToday.toFixed(0)}</Text>
          <Text style={styles.statHint}>today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Pending</Text>
          <Text style={styles.statValue}>R{dashboard.pendingEarnings.toFixed(0)}</Text>
          <Text style={styles.statHint}>payout</Text>
        </View>
      </View>

      {dashboard.activeDelivery ? (
        <Pressable
          style={styles.activeCard}
          onPress={() => router.push(`/delivery/${dashboard.activeDelivery!.id}`)}
        >
          <Text style={styles.activeTitle}>Active delivery</Text>
          <Text style={styles.activeVendor}>{dashboard.activeDelivery.order.vendor.storeName}</Text>
          <Text style={styles.activeMeta}>
            {DELIVERY_STATUS_LABELS[dashboard.activeDelivery.status] ??
              dashboard.activeDelivery.status}{' '}
            · R{dashboard.activeDelivery.driverEarned.toFixed(2)}
          </Text>
          <Text style={styles.activeLink}>Tap to manage →</Text>
        </Pressable>
      ) : dashboard.isOnline ? (
        <Link href="/jobs" asChild>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Find available jobs</Text>
          </Pressable>
        </Link>
      ) : (
        <View style={styles.panel}>
          <Text>Go online to see delivery jobs near you.</Text>
        </View>
      )}

      <Pressable style={styles.secondaryButton} onPress={clearAuth}>
        <Text style={styles.secondaryButtonText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, padding: 24, justifyContent: 'center', gap: 12 },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { color: '#64748b', lineHeight: 22 },
  hero: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
  heroSubtitle: { color: '#cbd5e1', marginTop: 4, marginBottom: 16 },
  alertBadge: {
    backgroundColor: '#6366f1',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  alertBadgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  onlineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  onlineLabel: { color: '#fff', fontWeight: '700', fontSize: 16 },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
  },
  statLabel: { color: '#64748b', fontSize: 12 },
  statValue: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  statHint: { color: '#64748b', fontSize: 12 },
  activeCard: {
    backgroundColor: '#fff7ed',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fdba74',
  },
  activeTitle: { fontWeight: '800', color: '#c2410c' },
  activeVendor: { fontSize: 18, fontWeight: '800', marginTop: 6 },
  activeMeta: { color: '#64748b', marginTop: 4 },
  activeLink: { color: '#c2410c', fontWeight: '700', marginTop: 10 },
  panel: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#f97316',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  secondaryButtonText: { fontWeight: '700' },
});
