import { StyleSheet, Text, View } from 'react-native';

export default function OrdersScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your orders</Text>
      <Text style={styles.subtitle}>Sign in and place an order to see live tracking here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: '#64748b', lineHeight: 22 },
});
