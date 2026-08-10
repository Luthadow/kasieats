import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useCart } from '../src/context/CartContext';

export default function CartScreen() {
  const router = useRouter();
  const { vendorName, items, subtotal, deliveryFee, serviceFee, total, updateQuantity, removeItem } =
    useCart();

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>Browse nearby vendors and add something tasty.</Text>
        <Link href="/" asChild>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Find food</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <Text style={styles.vendorName}>{vendorName}</Text>

        {items.map((item) => (
          <View key={item.menuItemId} style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>R{item.price} each</Text>
            </View>
            <View style={styles.quantityControls}>
              <Pressable
                style={styles.qtyButton}
                onPress={() => updateQuantity(item.menuItemId, item.quantity - 1)}
              >
                <Text style={styles.qtyButtonText}>−</Text>
              </Pressable>
              <Text style={styles.quantity}>{item.quantity}</Text>
              <Pressable
                style={styles.qtyButton}
                onPress={() => updateQuantity(item.menuItemId, item.quantity + 1)}
              >
                <Text style={styles.qtyButtonText}>+</Text>
              </Pressable>
            </View>
            <Pressable onPress={() => removeItem(item.menuItemId)}>
              <Text style={styles.remove}>Remove</Text>
            </Pressable>
          </View>
        ))}

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text>Subtotal</Text>
            <Text>R{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Delivery fee</Text>
            <Text>R{deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Service fee</Text>
            <Text>R{serviceFee.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>R{total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      <Pressable style={styles.checkoutBar} onPress={() => router.push('/checkout')}>
        <Text style={styles.checkoutBarText}>Proceed to checkout · R{total.toFixed(2)}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { flex: 1, padding: 24, justifyContent: 'center' },
  emptyTitle: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  emptySubtitle: { color: '#64748b', marginBottom: 24, lineHeight: 22 },
  vendorName: { fontSize: 18, fontWeight: '800', padding: 16, paddingBottom: 8 },
  itemRow: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  itemName: { fontSize: 16, fontWeight: '700' },
  itemPrice: { color: '#64748b', marginTop: 4 },
  quantityControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonText: { fontSize: 18, fontWeight: '700' },
  quantity: { fontWeight: '700', minWidth: 20, textAlign: 'center' },
  remove: { color: '#dc2626', fontWeight: '600' },
  summary: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 12, marginTop: 4 },
  totalLabel: { fontWeight: '800', fontSize: 16 },
  totalValue: { fontWeight: '800', fontSize: 16 },
  checkoutBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: '#f97316',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  checkoutBarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  primaryButton: {
    backgroundColor: '#f97316',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
});
