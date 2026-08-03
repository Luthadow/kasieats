import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { apiData, json } from '../src/services/api';
import { useAuth } from '../src/context/AuthContext';
import { useCart } from '../src/context/CartContext';
import { theme } from '../src/theme';
import type { AddressDto } from '@kasieats/shared';

export default function CartScreen() {
  const { token } = useAuth();
  const cart = useCart();
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [manualAddress, setManualAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoadingAddresses(true);
    apiData<AddressDto[]>('/addresses')
      .then((data) => {
        setAddresses(data ?? []);
        const preferred = data?.find((a) => a.isDefault) ?? data?.[0];
        if (preferred) setSelectedAddressId(preferred.id);
      })
      .catch(() => setAddresses([]))
      .finally(() => setLoadingAddresses(false));
  }, [token]);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) ?? null;

  const deliveryFee = 25;
  const total = cart.subtotal + (cart.count > 0 ? deliveryFee : 0);

  const placeOrder = async () => {
    if (!token) {
      Alert.alert('Sign in required', 'Please sign in to place your order.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign in', onPress: () => router.push('/login') },
      ]);
      return;
    }
    if (cart.count === 0 || !cart.vendorId) {
      Alert.alert('Empty cart', 'Add some items before checking out.');
      return;
    }

    const addressText = selectedAddress
      ? [selectedAddress.addressLine1, selectedAddress.city].filter(Boolean).join(', ')
      : manualAddress.trim();

    if (!addressText) {
      Alert.alert('Delivery address', 'Please choose or enter a delivery address.');
      return;
    }

    setPlacing(true);
    try {
      await apiData<{ id: string }>('/orders', {
        method: 'POST',
        ...json({
          vendorId: cart.vendorId,
          items: cart.items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
          deliveryAddress: addressText,
          deliveryLatitude: selectedAddress?.latitude ?? undefined,
          deliveryLongitude: selectedAddress?.longitude ?? undefined,
          paymentMethod: 'pay_vendor_directly',
          specialInstructions: notes.trim() || undefined,
        }),
      });

      cart.clear();
      Alert.alert('Order placed!', 'Track it in My Orders.', [
        { text: 'View orders', onPress: () => router.replace('/orders') },
      ]);
    } catch (error) {
      Alert.alert('Could not place order', error instanceof Error ? error.message : 'Try again');
    } finally {
      setPlacing(false);
    }
  };

  if (cart.count === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySub}>Find a kitchen and add some kotas.</Text>
        <Pressable style={styles.primaryBtn} onPress={() => router.replace('/')}>
          <Text style={styles.primaryBtnText}>Browse vendors</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
      <Text style={styles.vendorName}>{cart.vendorName}</Text>

      <View style={styles.panel}>
        {cart.items.map((item) => (
          <View key={item.menuItemId} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={styles.stepper}>
              <Pressable style={styles.stepBtn} onPress={() => cart.decrement(item.menuItemId)}>
                <Text style={styles.stepBtnText}>−</Text>
              </Pressable>
              <Text style={styles.qty}>{item.quantity}</Text>
              <Pressable
                style={styles.stepBtn}
                onPress={() =>
                  cart.addItem(
                    { id: cart.vendorId!, name: cart.vendorName! },
                    { menuItemId: item.menuItemId, name: item.name, price: item.price },
                  )
                }
              >
                <Text style={styles.stepBtnText}>+</Text>
              </Pressable>
            </View>
            <Text style={styles.itemPrice}>R{(item.price * item.quantity).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Deliver to</Text>
      {loadingAddresses ? (
        <ActivityIndicator color={theme.brand} />
      ) : addresses.length > 0 ? (
        <View style={styles.panel}>
          {addresses.map((addr) => (
            <Pressable
              key={addr.id}
              style={styles.addressRow}
              onPress={() => setSelectedAddressId(addr.id)}
            >
              <View style={[styles.radio, selectedAddressId === addr.id && styles.radioOn]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.addressLabel}>{addr.label ?? 'Address'}</Text>
                <Text style={styles.addressText}>
                  {addr.addressLine1}, {addr.city}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <TextInput
          style={styles.input}
          value={manualAddress}
          onChangeText={setManualAddress}
          placeholder="e.g. 123 Zuma Street, Rustenburg"
        />
      )}

      {/* Payment info — KasiEats does not process food payments */}
      <View style={styles.paymentNotice}>
        <Text style={styles.paymentNoticeTitle}>Payment</Text>
        <Text style={styles.paymentNoticeText}>
          You pay the vendor directly (cash or their preferred method). KasiEats does not process
          food payments.
        </Text>
      </View>

      <Text style={styles.sectionLabel}>Notes for the kitchen (optional)</Text>
      <TextInput
        style={styles.input}
        value={notes}
        onChangeText={setNotes}
        placeholder="e.g. extra atchar"
      />

      <View style={styles.summary}>
        <Row label="Subtotal" value={`R${cart.subtotal.toFixed(2)}`} />
        <Row label="Suggested delivery (pay driver)" value={`R${deliveryFee.toFixed(2)}`} />
        <Row label="Total" value={`R${total.toFixed(2)}`} bold />
      </View>

      <Pressable
        style={[styles.primaryBtn, placing && { opacity: 0.6 }]}
        onPress={placeOrder}
        disabled={placing}
      >
        <Text style={styles.primaryBtnText}>
          {placing ? 'Placing order…' : `Place order · R${total.toFixed(2)}`}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, bold && styles.summaryBold]}>{label}</Text>
      <Text style={[styles.summaryLabel, bold && styles.summaryBold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.cream },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: theme.cream,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: theme.text },
  emptySub: { color: theme.muted, marginTop: 6, marginBottom: 20 },
  vendorName: { fontSize: 20, fontWeight: '800', marginBottom: 12, color: theme.text },
  panel: {
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8 },
  itemName: { flex: 1, fontWeight: '600', color: theme.text },
  itemPrice: { fontWeight: '800', color: theme.text, minWidth: 74, textAlign: 'right' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: {
    backgroundColor: theme.brandTint,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { color: theme.brandDark, fontWeight: '800', fontSize: 16 },
  qty: { fontWeight: '800', minWidth: 16, textAlign: 'center', color: theme.text },
  sectionLabel: { fontWeight: '800', marginTop: 16, marginBottom: 8, color: theme.text },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.border,
  },
  radioOn: { borderColor: theme.brand, backgroundColor: theme.brand },
  addressLabel: { fontWeight: '700', color: theme.text, textTransform: 'capitalize' },
  addressText: { color: theme.muted, marginTop: 2 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: theme.text,
  },
  paymentNotice: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    marginBottom: 4,
  },
  paymentNoticeTitle: {
    fontWeight: '800',
    color: theme.text,
    marginBottom: 4,
  },
  paymentNoticeText: {
    color: '#0369a1',
    fontSize: 14,
    lineHeight: 20,
  },
  summary: {
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { color: theme.muted, fontSize: 15 },
  summaryBold: { color: theme.text, fontWeight: '800', fontSize: 16 },
  primaryBtn: {
    backgroundColor: theme.brand,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
