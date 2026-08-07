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
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { apiRequest } from '../../src/services/api';
import { useCart } from '../../src/context/CartContext';
import type { MenuItemDto } from '@kasieats/shared';

interface VendorDetail {
  id: string;
  storeName: string;
  storeDescription?: string | null;
  averageRating: number;
  menuItems: MenuItemDto[];
}

export default function VendorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addItem, vendorId, itemCount, clearCart } = useCart();
  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    apiRequest<{ success: boolean; data: VendorDetail }>(`/vendors/${id}`)
      .then((response) => setVendor(response.data))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = (item: MenuItemDto) => {
    if (!vendor) return;

    if (vendorId && vendorId !== vendor.id) {
      Alert.alert(
        'Replace cart?',
        'Your cart has items from another vendor. Clear it and add from this store?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Replace',
            onPress: () => {
              clearCart();
              addItem(vendor.id, vendor.storeName, {
                menuItemId: item.id,
                name: item.name,
                price: item.price,
              });
            },
          },
        ],
      );
      return;
    }

    addItem(vendor.id, vendor.storeName, {
      menuItemId: item.id,
      name: item.name,
      price: item.price,
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f97316" />
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
      <Text style={styles.subtitle}>{vendor.storeDescription}</Text>
      <Text style={styles.rating}>★ {vendor.averageRating}</Text>

      <FlatList
        data={vendor.menuItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDescription}>{item.description}</Text>
            </View>
            <View style={styles.itemActions}>
              <Text style={styles.price}>R{item.price}</Text>
              <Pressable style={styles.addButton} onPress={() => handleAdd(item)}>
                <Text style={styles.addButtonText}>Add</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      {itemCount > 0 && (
        <Pressable style={styles.cartBar} onPress={() => router.push('/cart')}>
          <Text style={styles.cartBarText}>View cart ({itemCount})</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#64748b', marginTop: 4, marginBottom: 8 },
  rating: { color: '#c2410c', fontWeight: '700', marginBottom: 16 },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    gap: 12,
  },
  itemName: { fontSize: 16, fontWeight: '700' },
  itemDescription: { color: '#64748b', marginTop: 4 },
  itemActions: { alignItems: 'flex-end', justifyContent: 'space-between' },
  price: { fontWeight: '800', fontSize: 16 },
  addButton: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: { color: '#fff', fontWeight: '700' },
  cartBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: '#f97316',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  cartBarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
