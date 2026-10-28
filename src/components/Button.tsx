import { Pressable, StyleSheet, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface ButtonProps extends PressableProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  style,
  ...props
}: ButtonProps) {
  const { colors } = useTheme();

  const colorMap = {
    primary: { bg: colors.primary, text: '#FFFFFF' },
    secondary: { bg: colors.surfaceSecondary, text: colors.text },
    ghost: { bg: 'transparent', text: colors.primary },
    destructive: { bg: colors.errorSubtle, text: colors.error },
  };

  const sizeMap = {
    sm: { paddingVertical: 8, paddingHorizontal: 12, fontSize: 13 },
    md: { paddingVertical: 12, paddingHorizontal: 16, fontSize: 15 },
    lg: { paddingVertical: 14, paddingHorizontal: 20, fontSize: 16 },
  };

  const { bg, text } = colorMap[variant];
  const { paddingVertical, paddingHorizontal, fontSize } = sizeMap[size];

  return (
    <Pressable
      style={[
        styles.base,
        {
          backgroundColor: bg,
          paddingVertical,
          paddingHorizontal,
          opacity: disabled ? 0.5 : 1,
          ...(fullWidth ? styles.fullWidth : undefined),
        },
        style as StyleProp<ViewStyle>,
      ]}
      disabled={disabled}
      {...props}
    >
      <Text style={{ color: text, fontSize, fontWeight: '600', textAlign: 'center' }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
});
