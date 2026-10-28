import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

export default function NotFound() {
  const { colors } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>Page not found</Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          The screen you are looking for does not exist.
        </Text>
        <Link href="/" style={{ color: colors.primary, marginTop: 16, fontSize: 16, fontWeight: '600' }}>
          Go Home
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
  },
});
