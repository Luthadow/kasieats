import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/context/AuthContext';
import { CartProvider } from '../src/context/CartContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#0f172a' },
            headerTintColor: '#fff',
            contentStyle: { backgroundColor: '#f8fafc' },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'KasiEats' }} />
          <Stack.Screen name="login" options={{ title: 'Sign in' }} />
          <Stack.Screen name="vendor/[id]" options={{ title: 'Menu' }} />
          <Stack.Screen name="cart" options={{ title: 'Your Cart' }} />
          <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
          <Stack.Screen name="order/[id]" options={{ title: 'Order Status' }} />
          <Stack.Screen name="orders" options={{ title: 'My Orders' }} />
          <Stack.Screen name="addresses" options={{ title: 'Saved Addresses' }} />
        </Stack>
      </CartProvider>
    </AuthProvider>
  );
}
