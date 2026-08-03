import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { apiRequest, json } from '../src/services/api';
import { useAuth } from '../src/context/AuthContext';
import { theme } from '../src/theme';
import type { AuthUser } from '@kasieats/shared';

export default function DriverLogin() {
  const { setAuth } = useAuth();
  const [phoneOrEmail, setPhoneOrEmail] = useState('+27851234567');
  const [password, setPassword] = useState('Driver123!');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ token: string; user: AuthUser }>('/auth/login', {
        method: 'POST',
        ...json({ phoneOrEmail, password }),
      });
      await setAuth(res.token, res.user);
      router.replace('/');
    } catch (error) {
      Alert.alert('Sign in failed', error instanceof Error ? error.message : 'Try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver sign in</Text>
      <Text style={styles.subtitle}>Log in to start accepting deliveries.</Text>

      <TextInput
        style={styles.input}
        value={phoneOrEmail}
        onChangeText={setPhoneOrEmail}
        placeholder="Phone or email"
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
      />

      <Pressable
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={submit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Signing in…' : 'Sign in'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: theme.cream },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8, color: theme.text },
  subtitle: { color: theme.muted, marginBottom: 24 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    color: theme.text,
  },
  button: {
    backgroundColor: theme.brand,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
