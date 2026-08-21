import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius } from '@/lib/theme';

type Props = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
};

export function QtyStepper({ value, onChange, min = 0 }: Props) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Diminuir"
        onPress={() => onChange(Math.max(min, value - 1))}
        style={styles.btn}>
        <Text style={styles.sign}>−</Text>
      </Pressable>
      <Text style={styles.value}>{value}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Aumentar"
        onPress={() => onChange(value + 1)}
        style={styles.btn}>
        <Text style={styles.sign}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(26, 20, 16, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sign: {
    fontSize: 20,
    color: colors.bg,
    fontFamily: fonts.bodyBold,
    marginTop: -2,
  },
  value: {
    minWidth: 22,
    textAlign: 'center',
    fontFamily: fonts.bodyBold,
    color: colors.bg,
    fontSize: 16,
  },
});
