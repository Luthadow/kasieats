import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiRequest } from '../src/services/api';

interface WalletSummary {
  balance: number;
  pendingBalance: number;
  recentTransactions: Array<{
    id: string;
    description: string | null;
    type: string;
    status: string;
    amount: number;
    direction: 'credit' | 'debit';
    createdAt: string;
  }>;
}

export default function EarningsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [amount, setAmount] = useState('100');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const loadWallet = useCallback(async () => {
    if (!token) return;
    const response = await apiRequest<{ success: boolean; data: WalletSummary }>(
      '/wallet',
      {},
      token,
    );
    setWallet(response.data);
  }, [token]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    loadWallet().finally(() => setLoading(false));
  }, [token, loadWallet]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWallet();
    setRefreshing(false);
  };

  const withdraw = async () => {
    if (!token) return;
    setWithdrawing(true);
    try {
      await apiRequest(
        '/wallet/withdraw',
        {
          method: 'POST',
          body: JSON.stringify({ amount: Number(amount) }),
        },
        token,
      );
      Alert.alert('Submitted', 'Your withdrawal request is pending admin approval.');
      await loadWallet();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Withdrawal failed');
    } finally {
      setWithdrawing(false);
    }
  };

  if (!token) {
    return (
      <View style={styles.center}>
        <Text>Sign in to view earnings.</Text>
      </View>
    );
  }

  if (loading || !wallet) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Available balance</Text>
        <Text style={styles.heroValue}>R{wallet.balance.toFixed(2)}</Text>
        <Text style={styles.heroMeta}>Pending withdrawal: R{wallet.pendingBalance.toFixed(2)}</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Request payout</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="Amount (min R50)"
        />
        <Pressable
          style={[styles.primaryButton, withdrawing && styles.buttonDisabled]}
          onPress={withdraw}
          disabled={withdrawing}
        >
          <Text style={styles.primaryButtonText}>
            {withdrawing ? 'Submitting...' : 'Request withdrawal'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Recent transactions</Text>
        {wallet.recentTransactions.length === 0 && (
          <Text style={styles.muted}>Complete deliveries to start earning.</Text>
        )}
        {wallet.recentTransactions.map((tx) => (
          <View key={tx.id} style={styles.txRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.txTitle}>{tx.description ?? tx.type}</Text>
              <Text style={styles.muted}>{new Date(tx.createdAt).toLocaleString()}</Text>
            </View>
            <Text style={[styles.txAmount, tx.direction === 'credit' ? styles.credit : styles.debit]}>
              {tx.direction === 'credit' ? '+' : '-'}R{tx.amount.toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
        <Text style={styles.secondaryButtonText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  heroLabel: { color: '#94a3b8' },
  heroValue: { color: '#fff', fontSize: 36, fontWeight: '800', marginTop: 4 },
  heroMeta: { color: '#cbd5e1', marginTop: 8 },
  panel: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    gap: 10,
  },
  panelTitle: { fontWeight: '800', fontSize: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#f97316',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: '#fff', fontWeight: '800' },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  txTitle: { fontWeight: '700' },
  txAmount: { fontWeight: '800' },
  credit: { color: '#16a34a' },
  debit: { color: '#dc2626' },
  muted: { color: '#64748b', fontSize: 13 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  secondaryButtonText: { fontWeight: '700' },
});
