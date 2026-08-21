import { Redirect, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { addOrBumpItem, fetchProducts, openStaffComanda } from '@/lib/comandas';
import { formatBRL } from '@/lib/format';
import { colors, fonts, radius, space } from '@/lib/theme';
import type { Product } from '@/types/database';

export default function NovaComandaScreen() {
  const { session, profile } = useAuth();
  const [tableLabel, setTableLabel] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const restaurantId = profile?.restaurant_id;

  useEffect(() => {
    if (!restaurantId) return;
    fetchProducts(restaurantId)
      .then(setProducts)
      .finally(() => setLoading(false));
  }, [restaurantId]);

  const grouped = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const product of products) {
      const list = map.get(product.category) ?? [];
      list.push(product);
      map.set(product.category, list);
    }
    return [...map.entries()];
  }, [products]);

  if (!session) return <Redirect href="/(auth)/login" />;
  if (profile && profile.role !== 'staff') return <Redirect href="/(customer)/restaurantes" />;

  function bump(id: string) {
    setPicked((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  }

  async function onCreate() {
    if (!restaurantId || !session) return;
    setSaving(true);
    try {
      const comanda = await openStaffComanda(restaurantId, session.user.id, tableLabel || 'Balcão');
      const chosen = products.filter((p) => (picked[p.id] ?? 0) > 0);
      for (const product of chosen) {
        const times = picked[product.id];
        for (let i = 0; i < times; i += 1) {
          await addOrBumpItem({ comandaId: comanda.id, product });
        }
      }
      router.replace(`/(staff)/comanda/${comanda.id}`);
    } catch (err) {
      Alert.alert('Nova comanda', err instanceof Error ? err.message : 'Não foi possível abrir.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Painel</Text>
        </Pressable>
        <Text style={styles.title}>Nova ficha</Text>
        <Field label="Mesa" placeholder="Mesa 12" value={tableLabel} onChangeText={setTableLabel} />
        {loading ? (
          <ActivityIndicator color={colors.gold} />
        ) : (
          grouped.map(([category, list]) => (
            <View key={category} style={styles.block}>
              <Text style={styles.category}>{category}</Text>
              {list.map((product) => (
                <Pressable key={product.id} onPress={() => bump(product.id)} style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{product.name}</Text>
                    <Text style={styles.price}>{formatBRL(product.price)}</Text>
                  </View>
                  <Text style={styles.qty}>{picked[product.id] ? `×${picked[product.id]}` : 'lançar'}</Text>
                </Pressable>
              ))}
            </View>
          ))
        )}
        <Button label="Abrir comanda" onPress={onCreate} loading={saving} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: 40, gap: 12 },
  back: { color: colors.gold, fontFamily: fonts.bodyMedium },
  title: { color: colors.ink, fontFamily: fonts.display, fontSize: 36 },
  block: { gap: 8 },
  category: {
    color: colors.gold,
    fontFamily: fonts.bodyBold,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontSize: 11,
  },
  row: {
    backgroundColor: colors.bgRaised,
    borderRadius: radius.md,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 16 },
  price: { color: colors.inkMuted, fontFamily: fonts.body, fontSize: 13 },
  qty: { color: colors.gold, fontFamily: fonts.bodyBold },
});
