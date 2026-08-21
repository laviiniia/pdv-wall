import { Link, Redirect, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { colors, fonts, space } from '@/lib/theme';

export default function LoginScreen() {
  const { signIn, session, profile, configured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (session && profile?.role === 'staff') {
    return <Redirect href="/(staff)" />;
  }
  if (session && profile) {
    return <Redirect href="/(customer)/restaurantes" />;
  }

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.kicker}>Salão · mesa · conta</Text>
          <Text style={styles.title}>Comanda</Text>
          <Text style={styles.subtitle}>
            Pedidos no bolso do cliente. O salão vê a mesma ficha, no mesmo instante.
          </Text>

          {!configured && (
            <View style={styles.warn}>
              <Text style={styles.warnTitle}>Supabase ainda não está ligado</Text>
              <Text style={styles.warnBody}>
                Copie .env.example para .env e preencha EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY.
                Depois rode o SQL em supabase/schema.sql.
              </Text>
            </View>
          )}

          <View style={styles.form}>
            <Field
              label="E-mail"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Field label="Senha" secureTextEntry value={password} onChangeText={setPassword} />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button label="Entrar no salão" onPress={onSubmit} loading={loading} disabled={!configured} />
          </View>

          <Link href="/(auth)/cadastro" style={styles.link}>
            Primeira vez? Abrir uma conta
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: space.lg,
    paddingTop: 48,
    gap: 18,
  },
  kicker: {
    color: colors.gold,
    fontFamily: fonts.bodyMedium,
    letterSpacing: 3.2,
    textTransform: 'uppercase',
    fontSize: 11,
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.displayItalic,
    fontSize: 56,
    lineHeight: 60,
    marginTop: -6,
  },
  subtitle: {
    color: colors.inkMuted,
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 320,
  },
  form: {
    gap: 14,
    marginTop: 12,
  },
  error: {
    color: colors.danger,
    fontFamily: fonts.body,
  },
  link: {
    color: colors.gold,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    marginTop: 8,
  },
  warn: {
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 116, 0.35)',
    backgroundColor: 'rgba(196, 92, 38, 0.14)',
    padding: 14,
    borderRadius: 12,
    gap: 6,
  },
  warnTitle: {
    color: colors.gold,
    fontFamily: fonts.bodyBold,
  },
  warnBody: {
    color: colors.inkMuted,
    fontFamily: fonts.body,
    lineHeight: 20,
  },
});
