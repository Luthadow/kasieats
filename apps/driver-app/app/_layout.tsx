import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/context/AuthContext';
import { theme } from '../src/theme';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.brand },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '800' },
          contentStyle: { backgroundColor: theme.cream },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'MTHURA Driver' }} />
        <Stack.Screen name="login" options={{ title: 'Driver sign in' }} />
        <Stack.Screen name="delivery/[id]" options={{ title: 'Delivery' }} />
        <Stack.Screen name="earnings" options={{ title: 'My deliveries' }} />
      </Stack>
    </AuthProvider>
  );
}
