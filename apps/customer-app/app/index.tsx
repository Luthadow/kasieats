import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useCart } from '../src/context/CartContext';
import { apiRequest } from '../src/services/api';
import type { VendorSummary } from '@kasieats/shared';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { itemCount } = useCart();
  const [vendors, setVendors] = useState<VendorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<{ success: boolean; data: VendorSummary[] }>(
      '/vendors?latitude=-25.6544&longitude=27.2389&openNow=true',
    )
      .then((response) => setVendors(response.data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Township flavour, delivered</Text>
        <Text style={styles.heroSubtitle}>
          Discover kota stands, shisanyama and home kitchens near you.
        </Text>
        <View style={styles.heroActions}>
          <Link href={user ? '/orders' : '/login'} asChild>
            <Pressable style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>
                {user ? 'My orders' : 'Sign in with phone'}
              </Text>
            </Pressable>
          </Link>
          {itemCount > 0 && (
            <Pressable style={styles.loginButton} onPress={() => router.push('/cart')}>
              <Text style={styles.loginButtonText}>Cart ({itemCount})</Text>
            </Pressable>
          )}
        </View>
      </View>

      {loading && <ActivityIndicator size="large" color="#f97316" />}
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
          !loading ? <Text style={styles.empty}>No vendors found nearby yet.</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  hero: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 8 },
  heroSubtitle: { color: '#cbd5e1', marginBottom: 16, lineHeight: 20 },
  heroActions: { gap: 10 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#475569',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: { color: '#fff', fontWeight: '700' },
  loginButton: {
    backgroundColor: '#f97316',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  loginButtonText: { color: '#fff', fontWeight: '700' },
  list: { gap: 12, paddingBottom: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  cardTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  badge: {
    backgroundColor: '#fff7ed',
    color: '#c2410c',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
  },
  meta: { color: '#64748b', marginTop: 8 },
  address: { color: '#334155', marginTop: 4 },
  error: { color: '#dc2626', marginBottom: 12 },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 24 },
});
