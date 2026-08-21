import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/lib/theme';

export default function Gate() {
  const { loading, session, profile, configured } = useAuth();

  if (!configured) {
    return <Redirect href="/(auth)/login" />;
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (profile?.role === 'staff') {
    return <Redirect href="/(staff)" />;
  }

  return <Redirect href="/(customer)/restaurantes" />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
