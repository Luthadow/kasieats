import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, router, useFocusEffect } from 'expo-router';
import { apiData } from '../src/services/api';
import { useAuth } from '../src/context/AuthContext';
import { useCart } from '../src/context/CartContext';
import { theme } from '../src/theme';
import type { VendorSummary } from '@kasieats/shared';

// Rustenburg township centre — matches seed vendor coordinates.
const DEFAULT_LAT = -25.6544;
const DEFAULT_LNG = 27.2389;

export default function HomeScreen() {
  const { user } = useAuth();
  const { count } = useCart();
  const [vendors, setVendors] = useState<VendorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    apiData<VendorSummary[]>(
      `/vendors?lat=${DEFAULT_LAT}&lng=${DEFAULT_LNG}&radiusKm=15&openNow=true`,
    )
      .then((data) => setVendors(data ?? []))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Township flavour, delivered</Text>
        <Text style={styles.heroSubtitle}>
          Kotas, shisanyama and home kitchens near you.
        </Text>
        <View style={styles.heroActions}>
          {user ? (
            <Pressable style={styles.heroBtn} onPress={() => router.push('/orders')}>
              <Text style={styles.heroBtnText}>My orders</Text>
            </Pressable>
          ) : (
            <Link href="/login" asChild>
              <Pressable style={styles.heroBtn}>
                <Text style={styles.heroBtnText}>Sign in with phone</Text>
              </Pressable>
            </Link>
          )}
          <Pressable
            style={[styles.heroBtn, styles.heroBtnGhost]}
            onPress={() => router.push('/cart')}
          >
            <Text style={styles.heroBtnGhostText}>Cart{count ? ` (${count})` : ''}</Text>
          </Pressable>
        </View>
        {user ? <Text style={styles.greeting}>Sawubona, {user.firstName} 👋</Text> : null}
      </View>

      {loading && <ActivityIndicator size="large" color={theme.brand} style={{ marginTop: 24 }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={vendors}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Link href={`/vendor/${item.id}`} asChild>
            <Pressable style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.storeName}</Text>
                <Text style={styles.badge}>{item.storeCategory}</Text>
              </View>
              <Text style={styles.meta}>
                {item.distanceKm ?? '?'} km · {item.estimatedDeliveryMinutes ?? 35} min · ★{' '}
                {item.averageRating}
              </Text>
              <Text style={styles.address}>{item.address}</Text>
            </Pressable>
          </Link>
        )}
        ListEmptyComponent={
          !loading && !error ? (
            <Text style={styles.empty}>No vendors open nearby right now.</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  hero: {
    backgroundColor: theme.brand,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 6 },
  heroSubtitle: { color: '#FFE9D6', marginBottom: 16, lineHeight: 20 },
  heroActions: { flexDirection: 'row', gap: 10 },
  heroBtn: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  heroBtnText: { color: theme.brandDark, fontWeight: '800' },
  heroBtnGhost: { backgroundColor: 'rgba(255,255,255,0.18)' },
  heroBtnGhostText: { color: '#fff', fontWeight: '800' },
  greeting: { color: '#FFE9D6', marginTop: 14, fontWeight: '600' },
  list: { gap: 12, paddingBottom: 24 },
  card: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  cardTitle: { fontSize: 18, fontWeight: '700', flex: 1, color: theme.text },
  badge: {
    backgroundColor: theme.badgeBg,
    color: theme.badgeText,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
  },
  meta: { color: theme.muted, marginTop: 8 },
  address: { color: '#4B5563', marginTop: 4 },
  error: { color: theme.danger, marginTop: 16, textAlign: 'center' },
  empty: { textAlign: 'center', color: theme.muted, marginTop: 24 },
});
