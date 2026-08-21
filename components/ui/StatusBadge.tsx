import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius } from '@/lib/theme';
import { statusLabel } from '@/lib/format';
import type { ComandaStatus } from '@/types/database';

const tone: Record<ComandaStatus, { bg: string; fg: string }> = {
  aberta: { bg: 'rgba(143, 163, 122, 0.22)', fg: colors.sage },
  finalizada: { bg: 'rgba(212, 165, 116, 0.18)', fg: colors.gold },
  cancelada: { bg: 'rgba(196, 75, 58, 0.18)', fg: colors.danger },
};

export function StatusBadge({ status }: { status: ComandaStatus }) {
  return (
    <View style={[styles.badge, { backgroundColor: tone[status].bg }]}>
      <Text style={[styles.text, { color: tone[status].fg }]}>{statusLabel(status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  text: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
