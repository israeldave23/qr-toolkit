import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface BadgeProps {
  label: string;
  type?: 'scan' | 'gen' | 'favorite';
}

export function Badge({ label, type = 'scan' }: BadgeProps) {
  const { colors } = useTheme();

  const config = {
    scan: { bg: colors.primarySubtle, text: colors.primary },
    gen: { bg: colors.successSubtle, text: colors.success },
    favorite: { bg: colors.warningSubtle, text: colors.warning },
  };

  const { bg, text } = config[type];

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
