import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiRequest } from '../src/services/api';

interface DeliveryJob {
  orderId: string;
  vendorName: string;
  pickupAddress: string;
  deliveryAddress: string;
  distanceKm: number;
  estimatedPayout: number;
}

export default function JobsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [jobs, setJobs] = useState<DeliveryJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const loadJobs = () => {
      apiRequest<{ success: boolean; data: DeliveryJob[] }>('/driver/jobs', {}, token)
        .then((response) => setJobs(response.data))
        .finally(() => setLoading(false));
    };

    loadJobs();
    const interval = setInterval(loadJobs, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const acceptJob = async (orderId: string) => {
    if (!token) return;
    setAccepting(orderId);
    try {
      const response = await apiRequest<{ success: boolean; data: { id: string } }>(
        `/driver/jobs/${orderId}/accept`,
        { method: 'POST' },
        token,
      );
      router.replace(`/delivery/${response.data.id}`);
    } catch (error) {
      Alert.alert('Could not accept', error instanceof Error ? error.message : 'Try again');
    } finally {
      setAccepting(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.orderId}
        contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No jobs right now</Text>
            <Text style={styles.emptySubtitle}>
              Orders appear here when vendors mark them ready for pickup.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.vendor}>{item.vendorName}</Text>
            <Text style={styles.meta}>
              {item.distanceKm} km · R{item.estimatedPayout.toFixed(2)} payout
            </Text>
            <Text style={styles.address}>Pickup: {item.pickupAddress}</Text>
            <Text style={styles.address}>Drop-off: {item.deliveryAddress}</Text>
            <Pressable
              style={[styles.acceptButton, accepting === item.orderId && styles.buttonDisabled]}
              onPress={() => acceptJob(item.orderId)}
              disabled={accepting === item.orderId}
            >
              <Text style={styles.acceptButtonText}>
                {accepting === item.orderId ? 'Accepting...' : 'Accept job'}
              </Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { padding: 24, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  emptySubtitle: { color: '#64748b', textAlign: 'center', lineHeight: 22 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  vendor: { fontSize: 18, fontWeight: '800' },
  meta: { color: '#c2410c', fontWeight: '700', marginTop: 6 },
  address: { color: '#64748b', marginTop: 6, lineHeight: 20 },
  acceptButton: {
    backgroundColor: '#0f172a',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  buttonDisabled: { opacity: 0.6 },
  acceptButtonText: { color: '#fff', fontWeight: '800' },
});
