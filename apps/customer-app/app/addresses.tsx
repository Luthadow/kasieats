import { FormEvent, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiRequest } from '../src/services/api';

interface Address {
  id: string;
  label: string;
  formatted: string;
  isDefault: boolean;
  latitude: number;
  longitude: number;
  deliveryInstructions: string | null;
}

export default function AddressesScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [addressLine1, setAddressLine1] = useState('');
  const [label, setLabel] = useState<'home' | 'work' | 'other'>('home');
  const [saving, setSaving] = useState(false);

  const loadAddresses = async () => {
    if (!token) return;
    const response = await apiRequest<{ success: boolean; data: Address[] }>(
      '/customers/addresses',
      {},
      token,
    );
    setAddresses(response.data);
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    loadAddresses().finally(() => setLoading(false));
  }, [token]);

  const addAddress = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await apiRequest(
        '/customers/addresses',
        {
          method: 'POST',
          body: JSON.stringify({
            label,
            addressLine1,
            city: 'Rustenburg',
            latitude: -25.6544,
            longitude: 27.2389,
            isDefault: addresses.length === 0,
          }),
        },
        token,
      );
      setAddressLine1('');
      setShowForm(false);
      await loadAddresses();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Could not save address');
    } finally {
      setSaving(false);
    }
  };

  const setDefault = async (id: string) => {
    if (!token) return;
    await apiRequest(
      `/customers/addresses/${id}`,
      { method: 'PATCH', body: JSON.stringify({ isDefault: true }) },
      token,
    );
    await loadAddresses();
  };

  const removeAddress = async (id: string) => {
    if (!token) return;
    await apiRequest(`/customers/addresses/${id}`, { method: 'DELETE' }, token);
    await loadAddresses();
  };

  if (!token || !user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Saved addresses</Text>
        <Link href="/login" asChild>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Sign in</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <Text style={styles.subtitle}>Manage delivery addresses for faster checkout.</Text>

      <FlatList
        data={addresses}
        scrollEnabled={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12, marginBottom: 16 }}
        ListEmptyComponent={<Text style={styles.subtitle}>No saved addresses yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.label}>{item.label.toUpperCase()}</Text>
              {item.isDefault && <Text style={styles.defaultBadge}>Default</Text>}
            </View>
            <Text style={styles.address}>{item.formatted}</Text>
            {item.deliveryInstructions && (
              <Text style={styles.hint}>{item.deliveryInstructions}</Text>
            )}
            <View style={styles.actions}>
              {!item.isDefault && (
                <Pressable onPress={() => setDefault(item.id)}>
                  <Text style={styles.link}>Set default</Text>
                </Pressable>
              )}
              <Pressable onPress={() => removeAddress(item.id)}>
                <Text style={styles.linkDanger}>Remove</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      {showForm ? (
        <View style={styles.form}>
          <Text style={styles.formTitle}>New address</Text>
          <View style={styles.chipRow}>
            {(['home', 'work', 'other'] as const).map((option) => (
              <Pressable
                key={option}
                style={[styles.chip, label === option && styles.chipActive]}
                onPress={() => setLabel(option)}
              >
                <Text style={[styles.chipText, label === option && styles.chipTextActive]}>
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.input}
            value={addressLine1}
            onChangeText={setAddressLine1}
            placeholder="Street address"
          />
          <Pressable
            style={[styles.primaryButton, saving && styles.buttonDisabled]}
            onPress={addAddress}
            disabled={saving || !addressLine1}
          >
            <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Save address'}</Text>
          </Pressable>
          <Pressable onPress={() => setShowForm(false)}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable style={styles.primaryButton} onPress={() => setShowForm(true)}>
          <Text style={styles.primaryButtonText}>Add address</Text>
        </Pressable>
      )}

      <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
        <Text style={styles.secondaryButtonText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: '#64748b', marginBottom: 16, lineHeight: 22 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontWeight: '800', color: '#c2410c' },
  defaultBadge: { color: '#4338ca', fontWeight: '700', fontSize: 12 },
  address: { fontSize: 16, fontWeight: '600' },
  hint: { color: '#64748b', marginTop: 6, fontSize: 13 },
  actions: { flexDirection: 'row', gap: 16, marginTop: 12 },
  link: { color: '#6366f1', fontWeight: '700' },
  linkDanger: { color: '#dc2626', fontWeight: '700' },
  form: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 16, gap: 12 },
  formTitle: { fontWeight: '800', fontSize: 16 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: { backgroundColor: '#fff7ed', borderColor: '#fdba74' },
  chipText: { fontWeight: '600', textTransform: 'capitalize' },
  chipTextActive: { color: '#c2410c' },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#f97316',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: '#fff', fontWeight: '800' },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: { fontWeight: '700' },
  cancel: { textAlign: 'center', color: '#64748b', marginTop: 8 },
});
