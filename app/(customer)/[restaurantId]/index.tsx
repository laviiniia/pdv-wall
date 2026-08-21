import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field } from '@/components/ui/Field';
import { QtyStepper } from '@/components/ui/QtyStepper';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import {
  addOrBumpItem,
  fetchComandaItems,
  fetchProducts,
  getOpenCustomerComanda,
  itemsTotal,
  openCustomerComanda,
  setItemQty,
} from '@/lib/comandas';
import { formatBRL } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { colors, fonts, radius, space } from '@/lib/theme';
import type { Comanda, ComandaItem, Product, Restaurant } from '@/types/database';

export default function CustomerRestaurantScreen() {
  const { restaurantId } = useLocalSearchParams<{ restaurantId: string }>();
  const { session, profile } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [comanda, setComanda] = useState<Comanda | null>(null);
  const [items, setItems] = useState<ComandaItem[]>([]);
  const [tableLabel, setTableLabel] = useState('Balcão');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(() => itemsTotal(items), [items]);
  const grouped = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const product of products) {
      const list = map.get(product.category) ?? [];
      list.push(product);
      map.set(product.category, list);
    }
    return [...map.entries()];
  }, [products]);

  const reloadItems = useCallback(async (comandaId: string) => {
    setItems(await fetchComandaItems(comandaId));
  }, []);

  const load = useCallback(async () => {
    if (!restaurantId || !session?.user.id) return;
    const [{ data: rest, error: restError }, productRows] = await Promise.all([
      supabase.from('restaurants').select('*').eq('id', restaurantId).maybeSingle(),
      fetchProducts(restaurantId),
    ]);
    if (restError) throw restError;
    setRestaurant(rest as Restaurant | null);
    setProducts(productRows);
    const open = await getOpenCustomerComanda(restaurantId, session.user.id);
    setComanda(open);
    if (open) {
      setTableLabel(open.table_label);
      await reloadItems(open.id);
    } else {
      setItems([]);
    }
  }, [reloadItems, restaurantId, session?.user.id]);

  useEffect(() => {
    load()
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao abrir o salão.'))
      .finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    if (!comanda?.id) return;
    const channel = supabase
      .channel(`customer-comanda-${comanda.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comanda_items', filter: `comanda_id=eq.${comanda.id}` },
        () => {
          reloadItems(comanda.id).catch(() => undefined);
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'comandas', filter: `id=eq.${comanda.id}` },
        () => {
          load().catch(() => undefined);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [comanda?.id, load, reloadItems]);

  if (!session) return <Redirect href="/(auth)/login" />;

  async function ensureComanda(): Promise<Comanda> {
    if (comanda) return comanda;
    const created = await openCustomerComanda(restaurantId, session!.user.id, tableLabel);
    setComanda(created);
    return created;
  }

  async function onAdd(product: Product) {
    setBusy(true);
    setError(null);
    try {
      const current = await ensureComanda();
      await addOrBumpItem({ comandaId: current.id, product });
      await reloadItems(current.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não deu para lançar o item.');
    } finally {
      setBusy(false);
    }
  }

  async function onQty(item: ComandaItem, qty: number) {
    setBusy(true);
    try {
      await setItemQty(item.id, qty);
      if (comanda) await reloadItems(comanda.id);
    } catch (err) {
      Alert.alert('Item', err instanceof Error ? err.message : 'Falha ao atualizar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Salões</Text>
        </Pressable>
        {loading ? (
          <ActivityIndicator color={colors.gold} />
        ) : !restaurant ? (
          <EmptyState title="Salão não encontrado" body="Volte à lista e escolha outro ponto." />
        ) : (
          <>
            <Text style={styles.kicker}>{restaurant.address}</Text>
            <Text style={styles.title}>{restaurant.name}</Text>
            <Field label="Mesa ou nome" value={tableLabel} onChangeText={setTableLabel} editable={!comanda} />
            {comanda ? (
              <Text style={styles.meta}>
                Comanda {comanda.table_label} · {comanda.status}
              </Text>
            ) : (
              <Text style={styles.meta}>Toque em um prato para abrir a comanda.</Text>
            )}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {grouped.map(([category, list]) => (
              <View key={category} style={styles.block}>
                <Text style={styles.category}>{category}</Text>
                {list.map((product) => (
                  <Pressable
                    key={product.id}
                    disabled={busy || comanda?.status === 'finalizada' || comanda?.status === 'cancelada'}
                    onPress={() => onAdd(product)}
                    style={styles.product}>
                    <View style={styles.productText}>
                      <Text style={styles.productName}>{product.name}</Text>
                      {product.description ? (
                        <Text style={styles.productDesc}>{product.description}</Text>
                      ) : null}
                    </View>
                    <Text style={styles.price}>{formatBRL(product.price)}</Text>
                  </Pressable>
                ))}
              </View>
            ))}

            <View style={styles.ticket}>
              <Text style={styles.ticketTitle}>Sua ficha</Text>
              {items.length === 0 ? (
                <Text style={styles.ticketEmpty}>Nenhum lançamento ainda.</Text>
              ) : (
                items.map((item) => (
                  <View key={item.id} style={styles.ticketRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ticketName}>{item.name}</Text>
                      <Text style={styles.ticketPrice}>{formatBRL(Number(item.price) * item.qty)}</Text>
                    </View>
                    {comanda?.status === 'aberta' ? (
                      <QtyStepper value={item.qty} onChange={(qty) => onQty(item, qty)} />
                    ) : (
                      <Text style={styles.ticketName}>×{item.qty}</Text>
                    )}
                  </View>
                ))
              )}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatBRL(total)}</Text>
              </View>
              <Text style={styles.hint}>Cancelar e fechar a conta fica com a equipe do salão.</Text>
            </View>

            <Button label="Voltar aos restaurantes" variant="ghost" onPress={() => router.back()} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: 48, gap: 12 },
  back: { color: colors.gold, fontFamily: fonts.bodyMedium, marginBottom: 8 },
  kicker: { color: colors.inkMuted, fontFamily: fonts.body, fontSize: 13 },
  title: { color: colors.ink, fontFamily: fonts.display, fontSize: 36, lineHeight: 40 },
  meta: { color: colors.gold, fontFamily: fonts.bodyMedium },
  error: { color: colors.danger, fontFamily: fonts.body },
  block: { gap: 8, marginTop: 8 },
  category: {
    color: colors.gold,
    fontFamily: fonts.bodyBold,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontSize: 11,
  },
  product: {
    backgroundColor: colors.bgRaised,
    borderRadius: radius.md,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(244,232,212,0.08)',
  },
  productText: { flex: 1, gap: 4 },
  productName: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 16 },
  productDesc: { color: colors.inkMuted, fontFamily: fonts.body, fontSize: 13 },
  price: { color: colors.gold, fontFamily: fonts.bodyBold },
  ticket: {
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    padding: 18,
    gap: 12,
    marginTop: 8,
  },
  ticketTitle: { fontFamily: fonts.display, fontSize: 24, color: colors.bg },
  ticketEmpty: { fontFamily: fonts.body, color: 'rgba(26,20,16,0.5)' },
  ticketRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ticketName: { fontFamily: fonts.bodyBold, color: colors.bg },
  ticketPrice: { fontFamily: fonts.body, color: 'rgba(26,20,16,0.55)', fontSize: 12 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.paperLine,
    paddingTop: 12,
  },
  totalLabel: { fontFamily: fonts.bodyMedium, color: colors.bg },
  totalValue: { fontFamily: fonts.display, fontSize: 22, color: colors.terracottaDeep },
  hint: { fontFamily: fonts.body, fontSize: 12, color: 'rgba(26,20,16,0.5)' },
});
