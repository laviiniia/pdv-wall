import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/lib/theme';

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: 'Sumiu', headerShown: false }} />
      <View style={styles.wrap}>
        <Text style={styles.title}>Essa mesa não existe.</Text>
        <Link href="/" style={styles.link}>
          Voltar ao início
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: { color: colors.ink, fontFamily: fonts.display, fontSize: 28, textAlign: 'center' },
  link: { color: colors.gold, fontFamily: fonts.bodyMedium },
});
