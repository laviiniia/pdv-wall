import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/lib/theme';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
};

export function Screen({ children, style }: Props) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#2A1C14', '#1A1410', '#120E0C']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.grain} />
      <SafeAreaView style={[styles.safe, style]}>{children}</SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  grain: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
    borderWidth: 18,
    borderColor: 'rgba(212, 165, 116, 0.06)',
  },
  safe: {
    flex: 1,
  },
});
