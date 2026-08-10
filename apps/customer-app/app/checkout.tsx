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
import { useRouter } from 'expo-router';
import { ORDER_STATUS_LABELS } from '@kasieats/shared';
import { useAuth } from '../src/context/AuthContext';
import { useCart } from '../src/context/CartContext';
import { apiRequest } from '../src/services/api';

type PaymentMethod = 'cash' | 'card' | 'ozow';

interface SavedAddress {
  id: string;
  formatted: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const { vendorId, vendorName, items, subtotal, deliveryFee, serviceFee, total, clearCart } =
    useCart();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState('123 Zuma Street, Rustenburg');
  const [deliveryLatitude, setDeliveryLatitude] = useState(-25.6544);
  const [deliveryLongitude, setDeliveryLongitude] = useState(27.2389);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoLabel, setPromoLabel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiRequest<{ success: boolean; data: SavedAddress[] }>('/customers/addresses', {}, token)
      .then((response) => {
        setAddresses(response.data);
        const defaultAddress = response.data.find((a) => a.isDefault) ?? response.data[0];
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          setDeliveryAddress(defaultAddress.formatted);
          setDeliveryLatitude(defaultAddress.latitude);
          setDeliveryLongitude(defaultAddress.longitude);
        }
      })
      .catch(() => null);
  }, [token]);

  const selectAddress = (address: SavedAddress) => {
    setSelectedAddressId(address.id);
    setDeliveryAddress(address.formatted);
    setDeliveryLatitude(address.latitude);
    setDeliveryLongitude(address.longitude);
  };

  const applyPromo = async () => {
    if (!token || !vendorId || !promoCode.trim()) return;
    try {
      const response = await apiRequest<{
        success: boolean;
        data: { discountAmount: number; name: string; code: string };
      }>(
        '/promotions/validate',
        {
          method: 'POST',
          body: JSON.stringify({ code: promoCode.trim(), vendorId, subtotal }),
        },
        token,
      );
      setPromoDiscount(response.data.discountAmount);
      setPromoLabel(response.data.name);
      Alert.alert('Promo applied', `${response.data.name} — R${response.data.discountAmount.toFixed(2)} off`);
    } catch (error) {
      setPromoDiscount(0);
      setPromoLabel(null);
      Alert.alert('Invalid promo', error instanceof Error ? error.message : 'Code not valid');
    }
  };

  const checkoutTotal = Math.max(0, total - promoDiscount);

  if (!token || !user) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Sign in to checkout</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.push('/login')}>
          <Text style={styles.primaryButtonText}>Sign in</Text>
        </Pressable>
      </View>
    );
  }

  if (!vendorId || items.length === 0) {
    return (
      <View style={styles.center}>
        <Text>Your cart is empty.</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.push('/')}>
          <Text style={styles.primaryButtonText}>Browse vendors</Text>
        </Pressable>
      </View>
    );
  }

  const placeOrder = async () => {
    setLoading(true);
    try {
      const response = await apiRequest<{ success: boolean; data: { id: string; status: string } }>(
        '/orders',
        {
          method: 'POST',
          body: JSON.stringify({
            vendorId,
            items: items.map((item) => ({
              menuItemId: item.menuItemId,
              quantity: item.quantity,
            })),
            deliveryAddress,
            deliveryLatitude,
            deliveryLongitude,
            specialInstructions: specialInstructions || undefined,
            paymentMethod,
            promoCode: promoDiscount > 0 ? promoCode.trim().toUpperCase() : undefined,
          }),
        },
        token,
      );

      const orderId = response.data.id;

      if (paymentMethod === 'card' || paymentMethod === 'ozow') {
        const payment = await apiRequest<{
          success: boolean;
          data: {
            paymentId: string;
            sandbox: boolean;
            instructions?: string;
            paymentUrl?: string | null;
          };
        }>(
          '/payments/initiate',
          {
            method: 'POST',
            body: JSON.stringify({
              orderId,
              provider: paymentMethod === 'ozow' ? 'ozow' : 'yoco',
            }),
          },
          token,
        );

        if (payment.data.sandbox) {
          await apiRequest(
            '/payments/confirm',
            {
              method: 'POST',
              body: JSON.stringify({ paymentId: payment.data.paymentId }),
            },
            token,
          );
        } else if (payment.data.paymentUrl) {
          Alert.alert(
            'Complete payment',
            payment.data.instructions ?? 'Open the payment link to complete payment.',
          );
        }
      }

      clearCart();
      router.replace(`/order/${orderId}`);
    } catch (error) {
      Alert.alert('Order failed', error instanceof Error ? error.message : 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <Text style={styles.sectionTitle}>Order from {vendorName}</Text>

      <View style={styles.panel}>
        {items.map((item) => (
          <View key={item.menuItemId} style={styles.itemRow}>
            <Text>
              {item.quantity}x {item.name}
            </Text>
            <Text>R{(item.price * item.quantity).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.label}>Delivery address</Text>
      {addresses.length > 0 && (
        <View style={styles.addressList}>
          {addresses.map((address) => (
            <Pressable
              key={address.id}
              style={[
                styles.addressOption,
                selectedAddressId === address.id && styles.addressOptionActive,
              ]}
              onPress={() => selectAddress(address)}
            >
              <Text
                style={[
                  styles.addressOptionText,
                  selectedAddressId === address.id && styles.addressOptionTextActive,
                ]}
              >
                {address.formatted}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      <TextInput
        style={styles.input}
        value={deliveryAddress}
        onChangeText={setDeliveryAddress}
        placeholder="Street address"
      />
      <Pressable onPress={() => router.push('/addresses')}>
        <Text style={styles.manageAddresses}>Manage saved addresses</Text>
      </Pressable>

      <Text style={styles.label}>Special instructions</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={specialInstructions}
        onChangeText={setSpecialInstructions}
        placeholder="Extra hot, no onions..."
        multiline
      />

      <Text style={styles.label}>Promo code</Text>
      <View style={styles.promoRow}>
        <TextInput
          style={[styles.input, styles.promoInput]}
          value={promoCode}
          onChangeText={setPromoCode}
          placeholder="KASI10"
          autoCapitalize="characters"
        />
        <Pressable style={styles.promoButton} onPress={applyPromo}>
          <Text style={styles.promoButtonText}>Apply</Text>
        </Pressable>
      </View>
      {promoLabel && (
        <Text style={styles.promoApplied}>
          {promoLabel} applied · R{promoDiscount.toFixed(2)} off
        </Text>
      )}

      <Text style={styles.label}>Payment method</Text>
      <View style={styles.paymentRow}>
        {(['cash', 'card', 'ozow'] as PaymentMethod[]).map((method) => (
          <Pressable
            key={method}
            style={[styles.paymentOption, paymentMethod === method && styles.paymentOptionActive]}
            onPress={() => setPaymentMethod(method)}
          >
            <Text
              style={[
                styles.paymentOptionText,
                paymentMethod === method && styles.paymentOptionTextActive,
              ]}
            >
              {method === 'cash' ? 'Cash' : method === 'card' ? 'Card' : 'Ozow EFT'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.panel}>
        <View style={styles.itemRow}>
          <Text>Subtotal</Text>
          <Text>R{subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.itemRow}>
          <Text>Delivery</Text>
          <Text>R{deliveryFee.toFixed(2)}</Text>
        </View>
        <View style={styles.itemRow}>
          <Text>Service fee</Text>
          <Text>R{serviceFee.toFixed(2)}</Text>
        </View>
        {promoDiscount > 0 && (
          <View style={styles.itemRow}>
            <Text>Promo discount</Text>
            <Text style={styles.discount}>-R{promoDiscount.toFixed(2)}</Text>
          </View>
        )}
        <View style={[styles.itemRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>R{checkoutTotal.toFixed(2)}</Text>
        </View>
      </View>

      <Pressable
        style={[styles.primaryButton, loading && styles.buttonDisabled]}
        onPress={placeOrder}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>Place order · R{checkoutTotal.toFixed(2)}</Text>
        )}
      </Pressable>

      <Text style={styles.hint}>
        {paymentMethod === 'card'
          ? 'Card payments use Yoco sandbox — charged instantly in dev.'
          : paymentMethod === 'ozow'
            ? 'Ozow EFT sandbox — payment auto-confirms in dev.'
            : `Status after placing: ${ORDER_STATUS_LABELS.pending}`}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, padding: 24, justifyContent: 'center', gap: 16 },
  title: { fontSize: 22, fontWeight: '800' },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  panel: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    gap: 10,
  },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontWeight: '700', marginBottom: 8 },
  addressList: { gap: 8, marginBottom: 12 },
  addressOption: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
  },
  addressOptionActive: { borderColor: '#f97316', backgroundColor: '#fff7ed' },
  addressOptionText: { fontWeight: '600' },
  addressOptionTextActive: { color: '#c2410c' },
  manageAddresses: { color: '#6366f1', fontWeight: '700', marginBottom: 16 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  paymentRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  paymentOption: {
    flexGrow: 1,
    minWidth: '30%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  paymentOptionActive: { borderColor: '#f97316', backgroundColor: '#fff7ed' },
  paymentOptionText: { fontWeight: '600' },
  paymentOptionTextActive: { color: '#c2410c' },
  promoRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  promoInput: { flex: 1, marginBottom: 0 },
  promoButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
  },
  promoButtonText: { color: '#fff', fontWeight: '800' },
  promoApplied: { color: '#16a34a', fontWeight: '700', marginBottom: 16 },
  discount: { color: '#16a34a', fontWeight: '700' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 12 },
  totalLabel: { fontWeight: '800' },
  totalValue: { fontWeight: '800' },
  primaryButton: {
    backgroundColor: '#f97316',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  hint: { color: '#64748b', textAlign: 'center' },
});
