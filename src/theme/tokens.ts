import { StyleSheet } from 'react-native';

export const tokens = {
  light: {
    background: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceSecondary: '#F4F4F5',
    border: '#E4E4E7',
    borderStrong: '#D4D4D8',
    text: '#09090B',
    textSecondary: '#71717A',
    textTertiary: '#A1A1AA',
    primary: '#4F46E5',
    primarySubtle: '#EEF2FF',
    primaryMuted: '#C7D2FE',
    error: '#DC2626',
    errorSubtle: '#FEF2F2',
    success: '#16A34A',
    successSubtle: '#F0FDF4',
    warning: '#D97706',
    warningSubtle: '#FFFBEB',
    overlay: 'rgba(0,0,0,0.5)',
    scannerFrame: 'rgba(255,255,255,0.3)',
    shadow: 'rgba(0,0,0,0.08)',
  },
  dark: {
    background: '#09090B',
    surface: '#18181B',
    surfaceSecondary: '#27272A',
    border: '#3F3F46',
    borderStrong: '#52525B',
    text: '#FAFAFA',
    textSecondary: '#A1A1AA',
    textTertiary: '#71717A',
    primary: '#818CF8',
    primarySubtle: '#1E1B4B',
    primaryMuted: '#312E81',
    error: '#F87171',
    errorSubtle: '#450A0A',
    success: '#4ADE80',
    successSubtle: '#052E16',
    warning: '#FBBF24',
    warningSubtle: '#451A03',
    overlay: 'rgba(0,0,0,0.7)',
    scannerFrame: 'rgba(255,255,255,0.2)',
    shadow: 'rgba(0,0,0,0.3)',
  },
};

export type ThemeColors = typeof tokens.light;

export const sharedStyles = StyleSheet.create({
  safeArea: { flex: 1 },
  screen: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20 },
  section: { marginTop: 24 },
});
