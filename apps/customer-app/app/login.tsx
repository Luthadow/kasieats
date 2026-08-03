import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { apiRequest, json } from '../src/services/api';
import { useAuth, type AuthUser } from '../src/context/AuthContext';
import { theme } from '../src/theme';

type Step = 'phone' | 'otp' | 'profile';

interface VerifyResponse {
  needsProfile: boolean;
  profileToken?: string;
  token?: string;
  user?: AuthUser;
}

export default function LoginScreen() {
  const { setAuth } = useAuth();
  const [phone, setPhone] = useState('+27761234567');
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileToken, setProfileToken] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('phone');
  const [loading, setLoading] = useState(false);

  const fail = (error: unknown, fallback: string) =>
    Alert.alert('Error', error instanceof Error ? error.message : fallback);

  const sendOtp = async () => {
    setLoading(true);
    try {
      await apiRequest('/auth/send-otp', { method: 'POST', ...json({ phone }) });
      setStep('otp');
    } catch (error) {
      fail(error, 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<VerifyResponse>('/auth/verify-otp', {
        method: 'POST',
        ...json({ phone, otp }),
      });

      if (res.needsProfile) {
        setProfileToken(res.profileToken ?? null);
        setStep('profile');
      } else if (res.token && res.user) {
        await setAuth(res.token, res.user);
        router.replace('/');
      } else {
        Alert.alert('Error', 'Unexpected response from server');
      }
    } catch (error) {
      fail(error, 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const completeProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Almost there', 'Please enter your first and last name.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest<{ token: string; user: AuthUser }>('/auth/complete-profile', {
        method: 'POST',
        ...json({
          profileToken,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      });
      await setAuth(res.token, res.user);
      router.replace('/');
    } catch (error) {
      fail(error, 'Could not save your profile');
    } finally {
      setLoading(false);
    }
  };

  const primaryAction = step === 'phone' ? sendOtp : step === 'otp' ? verifyOtp : completeProfile;
  const primaryLabel = loading
    ? 'Please wait…'
    : step === 'phone'
      ? 'Send OTP'
      : step === 'otp'
        ? 'Verify & Continue'
        : 'Finish sign up';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to KasiEats</Text>
      <Text style={styles.subtitle}>Sign in with your South African mobile number.</Text>

      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="+27 76 123 4567"
        editable={step === 'phone'}
        autoCapitalize="none"
      />

      {step === 'otp' && (
        <TextInput
          style={styles.input}
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          placeholder="6-digit OTP"
          maxLength={6}
        />
      )}

      {step === 'profile' && (
        <>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First name"
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last name"
            autoCapitalize="words"
          />
        </>
      )}

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={primaryAction}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{primaryLabel}</Text>
      </Pressable>

      {step === 'otp' && (
        <Text style={styles.hint}>Enter the OTP sent to your phone.</Text>
      )}
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
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  hint: { marginTop: 16, color: theme.muted, textAlign: 'center' },
});
