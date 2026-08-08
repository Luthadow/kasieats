import { useState } from 'react';
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

type PaymentMethod = 'cash' | 'card';

export default function CheckoutScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const { vendorId, vendorName, items, subtotal, deliveryFee, serviceFee, total, clearCart } =
    useCart();
  const [deliveryAddress, setDeliveryAddress] = useState('123 Zuma Street, Rustenburg');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [loading, setLoading] = useState(false);

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
            deliveryLatitude: -25.6544,
            deliveryLongitude: 27.2389,
            specialInstructions: specialInstructions || undefined,
            paymentMethod,
          }),
        },
        token,
      );

      const orderId = response.data.id;

      if (paymentMethod === 'card') {
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
            body: JSON.stringify({ orderId, provider: 'yoco' }),
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
            payment.data.instructions ?? 'Open the payment link to complete your card payment.',
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
      <TextInput
        style={styles.input}
        value={deliveryAddress}
        onChangeText={setDeliveryAddress}
        placeholder="Street address"
      />

      <Text style={styles.label}>Special instructions</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={specialInstructions}
        onChangeText={setSpecialInstructions}
        placeholder="Extra hot, no onions..."
        multiline
      />

      <Text style={styles.label}>Payment method</Text>
      <View style={styles.paymentRow}>
        {(['cash', 'card'] as PaymentMethod[]).map((method) => (
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
              {method === 'cash' ? 'Cash on delivery' : 'Card'}
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
        <View style={[styles.itemRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>R{total.toFixed(2)}</Text>
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
          <Text style={styles.primaryButtonText}>Place order · R{total.toFixed(2)}</Text>
        )}
      </Pressable>

      <Text style={styles.hint}>
        {paymentMethod === 'card'
          ? 'Card payments use Yoco sandbox — charged instantly in dev.'
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
  paymentRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  paymentOption: {
    flex: 1,
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
