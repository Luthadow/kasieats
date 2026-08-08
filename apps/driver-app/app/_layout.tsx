import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0f172a' },
          headerTintColor: '#fff',
          contentStyle: { backgroundColor: '#f8fafc' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'KasiEats Driver' }} />
        <Stack.Screen name="login" options={{ title: 'Sign in' }} />
        <Stack.Screen name="register" options={{ title: 'Apply as driver' }} />
        <Stack.Screen name="earnings" options={{ title: 'Earnings' }} />
        <Stack.Screen name="jobs" options={{ title: 'Available Jobs' }} />
        <Stack.Screen name="delivery/[id]" options={{ title: 'Active Delivery' }} />
      </Stack>
    </AuthProvider>
  );
}
