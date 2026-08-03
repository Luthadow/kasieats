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
import { router, useLocalSearchParams } from 'expo-router';
import { apiData } from '../../src/services/api';
import { useCart } from '../../src/context/CartContext';
import { theme } from '../../src/theme';
import type { MenuItemDto } from '@kasieats/shared';

interface VendorDetail {
  id: string;
  storeName: string;
  storeDescription?: string | null;
  averageRating: number;
  isOpenNow: boolean;
  menuItems: MenuItemDto[];
}

export default function VendorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const cart = useCart();

  useEffect(() => {
    if (!id) return;
    apiData<VendorDetail>(`/vendors/${id}`)
      .then((data) => setVendor(data))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = (item: MenuItemDto) => {
    if (!vendor) return;
    const result = cart.addItem(
      { id: vendor.id, name: vendor.storeName },
      { menuItemId: item.id, name: item.name, price: item.price },
    );
    if (!result.ok && result.conflict) {
      Alert.alert(
        'Start a new cart?',
        `Your cart has items from ${cart.vendorName}. Clear it to order from ${vendor.storeName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear & add',
            style: 'destructive',
            onPress: () => {
              cart.clear();
              cart.addItem(
                { id: vendor.id, name: vendor.storeName },
                { menuItemId: item.id, name: item.name, price: item.price },
              );
            },
          },
        ],
      );
    }
  };

  const qtyFor = (menuItemId: string) =>
    cart.items.find((i) => i.menuItemId === menuItemId)?.quantity ?? 0;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.brand} />
      </View>
    );
  }

  if (!vendor) {
    return (
      <View style={styles.center}>
        <Text>Vendor not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{vendor.storeName}</Text>
      {vendor.storeDescription ? (
        <Text style={styles.subtitle}>{vendor.storeDescription}</Text>
      ) : null}
      <Text style={styles.rating}>★ {vendor.averageRating}</Text>

      <FlatList
        data={vendor.menuItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 96 }}
        renderItem={({ item }) => {
          const qty = qtyFor(item.id);
          return (
            <View style={styles.itemCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.description ? (
                  <Text style={styles.itemDescription}>{item.description}</Text>
                ) : null}
                <Text style={styles.price}>R{item.price}</Text>
              </View>
              {qty > 0 ? (
                <View style={styles.stepper}>
                  <Pressable style={styles.stepBtn} onPress={() => cart.decrement(item.id)}>
                    <Text style={styles.stepBtnText}>−</Text>
                  </Pressable>
                  <Text style={styles.qty}>{qty}</Text>
                  <Pressable style={styles.stepBtn} onPress={() => handleAdd(item)}>
                    <Text style={styles.stepBtnText}>+</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable style={styles.addButton} onPress={() => handleAdd(item)}>
                  <Text style={styles.addButtonText}>Add</Text>
                </Pressable>
              )}
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>No items available right now.</Text>}
      />

      {cart.count > 0 && (
        <Pressable style={styles.cartBar} onPress={() => router.push('/cart')}>
          <Text style={styles.cartBarText}>
            View cart · {cart.count} item{cart.count > 1 ? 's' : ''}
          </Text>
          <Text style={styles.cartBarPrice}>R{cart.subtotal.toFixed(2)}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.cream },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: theme.text },
  subtitle: { color: theme.muted, marginTop: 4, marginBottom: 8 },
  rating: { color: theme.brandDark, fontWeight: '700', marginBottom: 16 },
  itemCard: {
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  itemName: { fontSize: 16, fontWeight: '700', color: theme.text },
  itemDescription: { color: theme.muted, marginTop: 4 },
  price: { fontWeight: '800', fontSize: 15, marginTop: 8, color: theme.text },
  addButton: {
    backgroundColor: theme.brand,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addButtonText: { color: '#fff', fontWeight: '800' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn: {
    backgroundColor: theme.brandTint,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { color: theme.brandDark, fontWeight: '800', fontSize: 18 },
  qty: { fontWeight: '800', fontSize: 16, minWidth: 18, textAlign: 'center', color: theme.text },
  empty: { textAlign: 'center', color: theme.muted, marginTop: 24 },
  cartBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: theme.brand,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartBarText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  cartBarPrice: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
