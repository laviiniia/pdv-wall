import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field } from '@/components/ui/Field';
import { QtyStepper } from '@/components/ui/QtyStepper';
import { Screen } from '@/components/ui/Screen';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import {
  addOrBumpItem,
  cancelComanda,
  fetchComanda,
  fetchComandaItems,
  fetchProducts,
  finalizeComanda,
  itemsTotal,
  setItemQty,
} from '@/lib/comandas';
import { formatBRL, formatClock } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { colors, fonts, radius, space } from '@/lib/theme';
import type { Comanda, ComandaItem, Product } from '@/types/database';

export default function StaffComandaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, profile } = useAuth();
  const [comanda, setComanda] = useState<Comanda | null>(null);
  const [items, setItems] = useState<ComandaItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const total = useMemo(() => itemsTotal(items), [items]);
  const open = comanda?.status === 'aberta';

  const load = useCallback(async () => {
    if (!id) return;
    const row = await fetchComanda(id);
    setComanda(row);
    if (row) {
      const [itemRows, productRows] = await Promise.all([
        fetchComandaItems(row.id),
        fetchProducts(row.restaurant_id),
      ]);
      setItems(itemRows);
      setProducts(productRows);
    }
  }, [id]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`staff-comanda-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comanda_items', filter: `comanda_id=eq.${id}` },
        () => {
          load().catch(() => undefined);
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comandas', filter: `id=eq.${id}` },
        () => {
          load().catch(() => undefined);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, load]);

  if (!session) return <Redirect href="/(auth)/login" />;
  if (profile && profile.role !== 'staff') return <Redirect href="/(customer)/restaurantes" />;

  async function onQty(item: ComandaItem, qty: number) {
    setBusy(true);
    try {
      await setItemQty(item.id, qty);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function onAdd(product: Product) {
    if (!comanda) return;
    setBusy(true);
    try {
      await addOrBumpItem({ comandaId: comanda.id, product });
      await load();
    } finally {
      setBusy(false);
    }
  }

  function onCancel() {
    if (!comanda) return;
    Alert.alert('Cancelar comanda', 'A ficha não poderá mais receber itens.', [
      { text: 'Voltar', style: 'cancel' },
      {
        text: 'Cancelar',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await cancelComanda(comanda.id, reason);
            await load();
          } catch (err) {
            Alert.alert('Erro', err instanceof Error ? err.message : 'Falha ao cancelar.');
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  }

  function onFinalize() {
    if (!comanda) return;
    Alert.alert('Finalizar', `Fechar ${comanda.table_label} em ${formatBRL(total)}?`, [
      { text: 'Ainda não', style: 'cancel' },
      {
        text: 'Finalizar',
        onPress: async () => {
          setBusy(true);
          try {
            await finalizeComanda(comanda.id);
            await load();
          } catch (err) {
            Alert.alert('Erro', err instanceof Error ? err.message : 'Falha ao finalizar.');
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Painel</Text>
        </Pressable>
        {loading ? (
          <ActivityIndicator color={colors.gold} />
        ) : !comanda ? (
          <EmptyState title="Comanda sumiu" body="Ela pode ter sido removida em outro aparelho." />
        ) : (
          <>
            <View style={styles.head}>
              <Text style={styles.title}>{comanda.table_label}</Text>
              <StatusBadge status={comanda.status} />
            </View>
            <Text style={styles.meta}>Aberta às {formatClock(comanda.created_at)}</Text>
            {comanda.cancel_reason ? (
              <Text style={styles.reason}>Motivo: {comanda.cancel_reason}</Text>
            ) : null}

            <View style={styles.ticket}>
              {items.map((item) => (
                <View key={item.id} style={styles.ticketRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>{formatBRL(Number(item.price) * item.qty)}</Text>
                  </View>
                  {open ? (
                    <QtyStepper value={item.qty} onChange={(qty) => onQty(item, qty)} />
                  ) : (
                    <Text style={styles.itemName}>×{item.qty}</Text>
                  )}
                </View>
              ))}
              {items.length === 0 ? <Text style={styles.empty}>Sem itens.</Text> : null}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatBRL(total)}</Text>
              </View>
            </View>

            {open ? (
              <>
                <Text style={styles.section}>Lançar mais</Text>
                {products.map((product) => (
                  <Pressable key={product.id} disabled={busy} onPress={() => onAdd(product)} style={styles.addRow}>
                    <Text style={styles.addName}>{product.name}</Text>
                    <Text style={styles.addPrice}>{formatBRL(product.price)}</Text>
                  </Pressable>
                ))}
                <Field
                  label="Motivo do cancelamento"
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Cliente desistiu, erro de mesa…"
                />
                <Button label="Finalizar conta" onPress={onFinalize} loading={busy} />
                <Button label="Cancelar comanda" variant="danger" onPress={onCancel} disabled={busy} />
              </>
            ) : (
              <Button label="Voltar ao painel" variant="ghost" onPress={() => router.back()} />
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: 48, gap: 10 },
  back: { color: colors.gold, fontFamily: fonts.bodyMedium },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.ink, fontFamily: fonts.display, fontSize: 36, flex: 1, marginRight: 8 },
  meta: { color: colors.inkMuted, fontFamily: fonts.body },
  reason: { color: colors.danger, fontFamily: fonts.body },
  ticket: {
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    padding: 16,
    gap: 10,
    marginTop: 8,
  },
  ticketRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemName: { fontFamily: fonts.bodyBold, color: colors.bg },
  itemPrice: { fontFamily: fonts.body, color: 'rgba(26,20,16,0.5)', fontSize: 12 },
  empty: { fontFamily: fonts.body, color: 'rgba(26,20,16,0.45)' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.paperLine,
    paddingTop: 10,
  },
  totalLabel: { fontFamily: fonts.bodyMedium, color: colors.bg },
  totalValue: { fontFamily: fonts.display, fontSize: 22, color: colors.terracottaDeep },
  section: {
    color: colors.gold,
    fontFamily: fonts.bodyBold,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontSize: 11,
    marginTop: 8,
  },
  addRow: {
    backgroundColor: colors.bgRaised,
    borderRadius: radius.sm,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addName: { color: colors.ink, fontFamily: fonts.bodyMedium },
  addPrice: { color: colors.gold, fontFamily: fonts.bodyBold },
});
