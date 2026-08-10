import { FormEvent, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link, router } from 'expo-router';
import { apiRequest } from '../src/services/api';

export default function DriverRegisterScreen() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('123456');
  const [otpSent, setOtpSent] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [vehicleType, setVehicleType] = useState<'bicycle' | 'motorbike' | 'car'>('motorbike');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const sendOtp = async () => {
    setLoading(true);
    try {
      await apiRequest('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
      setOtpSent(true);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    setLoading(true);
    try {
      const response = await apiRequest<{ message: string }>('/auth/driver/register', {
        method: 'POST',
        body: JSON.stringify({
          phone,
          otp,
          firstName,
          lastName,
          vehicleType,
          vehiclePlate,
        }),
      });
      setSuccess(response.message);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Application submitted</Text>
        <Text style={styles.subtitle}>{success}</Text>
        <Pressable style={styles.button} onPress={() => router.replace('/login')}>
          <Text style={styles.buttonText}>Back to sign in</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <Text style={styles.title}>Become a driver</Text>
      <Text style={styles.subtitle}>Join the Rustenburg delivery fleet.</Text>

      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        placeholder="Phone number"
        keyboardType="phone-pad"
      />
      <Pressable style={styles.secondaryButton} onPress={sendOtp} disabled={loading || !phone}>
        <Text style={styles.secondaryButtonText}>Send OTP</Text>
      </Pressable>

      {otpSent && (
        <>
          <TextInput
            style={styles.input}
            value={otp}
            onChangeText={setOtp}
            placeholder="OTP code"
            keyboardType="number-pad"
            maxLength={6}
          />
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First name"
          />
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last name"
          />
          <View style={styles.chipRow}>
            {(['bicycle', 'motorbike', 'car'] as const).map((type) => (
              <Pressable
                key={type}
                style={[styles.chip, vehicleType === type && styles.chipActive]}
                onPress={() => setVehicleType(type)}
              >
                <Text style={[styles.chipText, vehicleType === type && styles.chipTextActive]}>
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.input}
            value={vehiclePlate}
            onChangeText={setVehiclePlate}
            placeholder="Vehicle plate (e.g. NW 123 GP)"
            autoCapitalize="characters"
          />
          <Pressable style={styles.button} onPress={submit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Submit application</Text>
            )}
          </Pressable>
        </>
      )}

      <Link href="/login" asChild>
        <Pressable>
          <Text style={styles.link}>Already a driver? Sign in</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: '#64748b', marginBottom: 24, lineHeight: 22 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  chipActive: { borderColor: '#f97316', backgroundColor: '#fff7ed' },
  chipText: { fontWeight: '600', textTransform: 'capitalize' },
  chipTextActive: { color: '#c2410c' },
  button: {
    backgroundColor: '#f97316',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryButtonText: { fontWeight: '700' },
  link: { color: '#c2410c', textAlign: 'center', fontWeight: '700' },
});
