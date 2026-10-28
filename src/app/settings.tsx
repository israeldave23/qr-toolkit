import { View, Text, TouchableOpacity, StyleSheet, Switch, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as Linking from 'expo-linking';
import { useTheme } from '../hooks/useTheme';
import { useSettings } from '../hooks/useSettings';
import { clearHistory } from '../services/history';
import { Icon } from '../components/Icon';

type ThemeMode = 'light' | 'dark' | 'system';

interface SettingRowProps {
  icon: 'home' | 'scan-line' | 'plus-circle' | 'clock' | 'history' | 'moon' | 'sun' | 'device-phone' | 'wifi' | 'mail' | 'map-pin' | 'calendar' | 'trash' | 'share';
  label: string;
  description?: string;
  right: React.ReactNode;
}

function SettingRow({ icon, label, description, right }: SettingRowProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
      <View style={styles.settingLeft}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primarySubtle }]}>
          <Icon name={icon} size={18} color={colors.primary} />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
          {description && (
            <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>{description}</Text>
          )}
        </View>
      </View>
      {right}
    </View>
  );
}

export default function Settings() {
  const { colors, setMode } = useTheme();
  const { settings, setTheme, setScanner } = useSettings();

  const handleClearHistory = async () => {
    Alert.alert('Clear History', 'Remove all scan and generated history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await clearHistory();
          router.back();
        },
      },
    ]);
  };

  const handleShare = async () => {
    try {
      await Sharing.shareAsync('QR Toolkit — scan, generate, and manage QR codes. All data stays on your device.', {
        mimeType: 'text/plain',
        dialogTitle: 'Share QR Toolkit',
      });
    } catch {
      Alert.alert('Error', 'Could not share.');
    }
  };

  const handleRate = () => {
    const url =
      Platform.OS === 'ios'
        ? 'https://apps.apple.com/app/qr-toolkit'
        : 'https://play.google.com/store/apps/details?id=com.qrtoolkit.app';
    Linking.openURL(url).catch(() => {});
  };

  const handleOpenSystemSettings = () => {
    Linking.openSettings().catch(() => {});
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://example.com/privacy').catch(() => {});
  };

  const themeOptions: { value: ThemeMode; label: string }[] = [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];

  // Null-safety: disable all interactions until settings load
  const containerStyle = settings
    ? undefined
    : ({ opacity: 0.5, pointerEvents: 'none' as const });

  const onToggleScanner = (key: 'soundEnabled' | 'hapticsEnabled' | 'continuousScan', v: boolean) => {
    if (!settings) return;
    setScanner({ ...settings.scanner, [key]: v });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }, containerStyle]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: colors.textSecondary }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Appearance</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {themeOptions.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.themeOption,
                { borderBottomColor: colors.border },
                (settings?.theme || 'system') === opt.value ? styles.themeOptionActive : {},
              ]}
              onPress={() => { setMode(opt.value); setTheme(opt.value); }}
            >
              <Text style={[styles.themeLabel, { color: colors.text }]}>{opt.label}</Text>
              {(settings?.theme || 'system') === opt.value && (
                <View style={[styles.checkDot, { backgroundColor: colors.primary }]} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Scan Preferences</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingRow
            icon="device-phone"
            label="Beep on Scan"
            description="Play sound when a QR code is detected"
            right={
              <Switch
                value={settings?.scanner.soundEnabled ?? true}
                onValueChange={(v) => onToggleScanner('soundEnabled', v)}
                trackColor={{ true: colors.primaryMuted, false: colors.border }}
                thumbColor={settings?.scanner.soundEnabled ? colors.primary : colors.textTertiary}
              />
            }
          />
          <SettingRow
            icon="plus-circle"
            label="Haptic Feedback"
            description="Vibrate on scan and actions"
            right={
              <Switch
                value={settings?.scanner.hapticsEnabled ?? true}
                onValueChange={(v) => onToggleScanner('hapticsEnabled', v)}
                trackColor={{ true: colors.primaryMuted, false: colors.border }}
                thumbColor={settings?.scanner.hapticsEnabled ? colors.primary : colors.textTertiary}
              />
            }
          />
          <SettingRow
            icon="clock"
            label="Continuous Scanning"
            description="Auto-resume after each scan"
            right={
              <Switch
                value={settings?.scanner.continuousScan ?? false}
                onValueChange={(v) => onToggleScanner('continuousScan', v)}
                trackColor={{ true: colors.primaryMuted, false: colors.border }}
                thumbColor={settings?.scanner.continuousScan ? colors.primary : colors.textTertiary}
              />
            }
          />
          <SettingRow
            icon="device-phone"
            label="Open System Settings"
            description="For camera / photo permissions"
            right={
              <TouchableOpacity onPress={handleOpenSystemSettings}>
                <Text style={[styles.actionText, { color: colors.primary }]}>Open</Text>
              </TouchableOpacity>
            }
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Data</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingRow
            icon="trash"
            label="Clear History"
            description="Remove all scanned and generated codes"
            right={
              <TouchableOpacity onPress={handleClearHistory}>
                <Text style={[styles.actionText, { color: colors.error }]}>Clear</Text>
              </TouchableOpacity>
            }
          />
          <SettingRow
            icon="wifi"
            label="Privacy Policy"
            description="All data stays on your device. No accounts. No telemetry."
            right={
              <TouchableOpacity onPress={handlePrivacyPolicy}>
                <Text style={[styles.actionText, { color: colors.primary }]}>View</Text>
              </TouchableOpacity>
            }
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>About</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingRow
            icon="share"
            label="Share App"
            description="Tell a friend about QR Toolkit"
            right={
              <TouchableOpacity onPress={handleShare}>
                <Text style={[styles.actionText, { color: colors.primary }]}>Share</Text>
              </TouchableOpacity>
            }
          />
          <SettingRow
            icon="calendar"
            label="Rate App"
            description="Leave us a review"
            right={
              <TouchableOpacity onPress={handleRate}>
                <Text style={[styles.actionText, { color: colors.primary }]}>Rate</Text>
              </TouchableOpacity>
            }
          />
          <View style={[styles.versionRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.versionText, { color: colors.textTertiary }]}>Version 1.0.0</Text>
          </View>
        </View>
      </View>

      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backBtn: {
    paddingVertical: 8,
  },
  backText: {
    fontSize: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  settingDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  themeOptionActive: {
    backgroundColor: 'rgba(79,70,229,0.05)',
  },
  themeLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  checkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  versionRow: {
    paddingTop: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
  },
  spacer: {
    height: 40,
  },
});
