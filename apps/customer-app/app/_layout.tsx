import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/context/AuthContext';
import { CartProvider } from '../src/context/CartContext';
import { theme } from '../src/theme';

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: theme.brand },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: '800' },
            contentStyle: { backgroundColor: theme.cream },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'MTHURA' }} />
          <Stack.Screen name="login" options={{ title: 'Sign in' }} />
          <Stack.Screen name="vendor/[id]" options={{ title: 'Menu' }} />
          <Stack.Screen name="cart" options={{ title: 'Your cart' }} />
          <Stack.Screen name="orders" options={{ title: 'My Orders' }} />
          <Stack.Screen name="order/[id]" options={{ title: 'Order' }} />
        </Stack>
      </CartProvider>
    </AuthProvider>
  );
}
