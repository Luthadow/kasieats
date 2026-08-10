import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, router } from 'expo-router';
import { apiRequest } from '../src/services/api';
import { useAuth } from '../src/context/AuthContext';

export default function LoginScreen() {
  const { setAuth } = useAuth();
  const [phone, setPhone] = useState('0851234567');
  const [otp, setOtp] = useState('123456');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    setLoading(true);
    try {
      await apiRequest('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
      setStep('otp');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      const response = await apiRequest<{
        token?: string;
        user?: { firstName: string; lastName: string; phone: string; userType: string };
      }>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, otp }),
      });

      if (!response.token || !response.user || response.user.userType !== 'driver') {
        throw new Error('This number is not registered as a driver.');
      }

      setAuth(response.token, {
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        phone: response.user.phone,
      });
      router.replace('/');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver sign in</Text>
      <Text style={styles.subtitle}>Earn by delivering township food orders.</Text>

      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        editable={step === 'phone'}
      />

      {step === 'otp' && (
        <TextInput
          style={styles.input}
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
        />
      )}

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={step === 'phone' ? sendOtp : verifyOtp}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Please wait...' : step === 'phone' ? 'Send OTP' : 'Sign in'}
        </Text>
      </Pressable>

      <Text style={styles.hint}>Dev login: 0851234567 · OTP 123456 (Thabiso)</Text>
      <Link href="/register" asChild>
        <Pressable>
          <Text style={styles.link}>New driver? Apply here</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: '#64748b', marginBottom: 24 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#f97316',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  hint: { marginTop: 16, color: '#64748b', textAlign: 'center' },
  link: { marginTop: 12, color: '#c2410c', textAlign: 'center', fontWeight: '700' },
});
