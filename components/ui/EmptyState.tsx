import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/lib/theme';

type Props = {
  title: string;
  body: string;
};

export function EmptyState({ title, body }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.kicker}>Comanda</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 10,
  },
  kicker: {
    color: colors.gold,
    fontFamily: fonts.bodyMedium,
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontSize: 11,
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 28,
    textAlign: 'center',
  },
  body: {
    color: colors.inkMuted,
    fontFamily: fonts.body,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
});
