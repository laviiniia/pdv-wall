import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { colors, fonts, space } from '@/lib/theme';

export default function CadastroScreen() {
  const { signUp, configured } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [staffCode, setStaffCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    if (name.trim().length < 2) {
      setError('Digite seu nome.');
      return;
    }
    setLoading(true);
    try {
      await signUp({
        name,
        email: email.trim(),
        password,
        staffCode: staffCode.trim() || undefined,
      });
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível cadastrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.kicker}>Nova ficha</Text>
          <Text style={styles.title}>Abra sua conta</Text>
          <Text style={styles.subtitle}>
            Cliente pede pela mesa. Equipe entra com o código do restaurante (LUMA26, TABERNA26, BRASA26 ou MARE26).
          </Text>

          <View style={styles.form}>
            <Field label="Nome" value={name} onChangeText={setName} />
            <Field
              label="E-mail"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Field label="Senha" secureTextEntry value={password} onChangeText={setPassword} />
            <Field
              label="Código da equipe (opcional)"
              autoCapitalize="characters"
              value={staffCode}
              onChangeText={setStaffCode}
              placeholder="Só para garçom ou caixa"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button label="Criar conta" onPress={onSubmit} loading={loading} disabled={!configured} />
          </View>

          <Link href="/(auth)/login" style={styles.link}>
            Já tenho conta
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
    paddingTop: 40,
    gap: 16,
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
    fontSize: 40,
  },
  subtitle: {
    color: colors.inkMuted,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
  },
  form: { gap: 14, marginTop: 8 },
  error: { color: colors.danger, fontFamily: fonts.body },
  link: {
    color: colors.gold,
    fontFamily: fonts.bodyMedium,
    marginTop: 8,
  },
});
