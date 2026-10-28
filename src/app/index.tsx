import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { Icon } from '../components/Icon';

export default function Home() {
  const { colors } = useTheme();

  const actions = [
    { label: 'Scan QR Code', description: 'Scan a QR code from camera or gallery', route: '/scan', icon: 'scan-line' as const },
    { label: 'Generate QR', description: 'Create a QR code from text or data', route: '/generate', icon: 'plus-circle' as const },
    { label: 'View History', description: 'Browse your scanned and generated codes', route: '/history', icon: 'clock' as const },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>QR Toolkit</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Scan. Create. Manage.</Text>
      </View>

      <View style={styles.actions}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push(action.route)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.primarySubtle }]}>
              <Icon name={action.icon} size={24} color={colors.primary} />
            </View>
            <View style={styles.actionText}>
              <Text style={[styles.actionLabel, { color: colors.text }]}>{action.label}</Text>
              <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>{action.description}</Text>
            </View>
            <Icon name="scan-line" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => router.push('/settings')}>
          <Text style={[styles.settingsLink, { color: colors.textSecondary }]}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  actions: {
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  footer: {
    marginTop: 'auto',
    paddingVertical: 24,
    alignItems: 'center',
  },
  settingsLink: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
