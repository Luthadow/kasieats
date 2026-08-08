import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiRequest } from '../src/services/api';

interface Ticket {
  id: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  resolutionNotes: string | null;
}

export default function SupportScreen() {
  const { token, user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('order');
  const [submitting, setSubmitting] = useState(false);

  const loadTickets = async () => {
    if (!token) return;
    const response = await apiRequest<{ success: boolean; data: Ticket[] }>(
      '/support/tickets',
      {},
      token,
    );
    setTickets(response.data);
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    loadTickets().finally(() => setLoading(false));
  }, [token]);

  const submitTicket = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      await apiRequest(
        '/support/tickets',
        {
          method: 'POST',
          body: JSON.stringify({ subject, description, category }),
        },
        token,
      );
      setSubject('');
      setDescription('');
      setShowForm(false);
      await loadTickets();
      Alert.alert('Ticket submitted', 'Our team will respond soon.');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Could not submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  if (!token || !user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Help & support</Text>
        <Link href="/login" asChild>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Sign in</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <Text style={styles.subtitle}>Report an issue or ask for help with an order.</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#f97316" />
      ) : (
        <FlatList
          data={tickets}
          scrollEnabled={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 12, marginBottom: 16 }}
          ListEmptyComponent={<Text style={styles.subtitle}>No tickets yet.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.subject}</Text>
              <Text style={styles.meta}>
                {item.status} · {item.category}
              </Text>
              <Text style={styles.body}>{item.description}</Text>
              {item.resolutionNotes && (
                <Text style={styles.resolution}>Response: {item.resolutionNotes}</Text>
              )}
            </View>
          )}
        />
      )}

      {showForm ? (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="Subject"
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your issue"
            multiline
          />
          <Pressable
            style={[styles.primaryButton, submitting && styles.buttonDisabled]}
            onPress={submitTicket}
            disabled={submitting || !subject || !description}
          >
            <Text style={styles.primaryButtonText}>{submitting ? 'Sending...' : 'Submit ticket'}</Text>
          </Pressable>
          <Pressable onPress={() => setShowForm(false)}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable style={styles.primaryButton} onPress={() => setShowForm(true)}>
          <Text style={styles.primaryButtonText}>New support ticket</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: '#64748b', marginBottom: 16, lineHeight: 22 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16 },
  cardTitle: { fontWeight: '800', fontSize: 16 },
  meta: { color: '#6366f1', fontWeight: '600', marginVertical: 6, textTransform: 'capitalize' },
  body: { color: '#334155', lineHeight: 20 },
  resolution: { marginTop: 8, color: '#16a34a', fontWeight: '600' },
  form: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  primaryButton: {
    backgroundColor: '#f97316',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: '#fff', fontWeight: '800' },
  cancel: { textAlign: 'center', color: '#64748b', marginTop: 8 },
});
