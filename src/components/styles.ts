import { StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

export function useStyles() {
  const { colors } = useTheme();
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    screen: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1, paddingHorizontal: 20 },
    section: { marginTop: 24 },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
    },
  });
}
