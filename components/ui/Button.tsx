import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, fonts, radius } from '@/lib/theme';

type Variant = 'primary' | 'ghost' | 'danger' | 'paper';

type Props = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: Variant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, variant = 'primary', loading, disabled, style, ...rest }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={variant === 'paper' ? colors.bg : colors.paper} />
      ) : (
        <Text style={[styles.label, variant === 'paper' && styles.labelDark]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primary: {
    backgroundColor: colors.terracotta,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(244, 232, 212, 0.22)',
  },
  danger: {
    backgroundColor: colors.danger,
  },
  paper: {
    backgroundColor: colors.paper,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    transform: [{ translateY: 1 }],
    opacity: 0.92,
  },
  label: {
    color: colors.paper,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    letterSpacing: 0.4,
  },
  labelDark: {
    color: colors.bg,
  },
});
