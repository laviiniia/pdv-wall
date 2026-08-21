import { Redirect, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { fetchStaffComandas, itemsTotal, fetchComandaItems } from '@/lib/comandas';
import { formatBRL, formatClock, minutesOpen } from '@/lib/format';
import { isFarFromRestaurant, requestUserLocation } from '@/lib/location';
import { supabase } from '@/lib/supabase';
import { colors, fonts, radius, space } from '@/lib/theme';
import type { Comanda, ComandaStatus, Restaurant } from '@/types/database';

const TABS: ComandaStatus[] = ['aberta', 'finalizada', 'cancelada'];

export default function StaffBoardScreen() {
  const { session, profile, signOut } = useAuth();
  const [tab, setTab] = useState<ComandaStatus>('aberta');
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [far, setFar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const restaurantId = profile?.restaurant_id;

  const load = useCallback(async () => {
    if (!restaurantId) return;
    setError(null);
    const [{ data: rest }, list] = await Promise.all([
      supabase.from('restaurants').select('*').eq('id', restaurantId).maybeSingle(),
      fetchStaffComandas(restaurantId, tab),
    ]);
    setRestaurant(rest as Restaurant | null);
    setComandas(list);

    const entries = await Promise.all(
      list.map(async (row) => {
        const items = await fetchComandaItems(row.id);
        return [row.id, itemsTotal(items)] as const;
      }),
    );
    setTotals(Object.fromEntries(entries));

    if (rest) {
      const pos = await requestUserLocation();
      if (pos) {
        setFar(isFarFromRestaurant(pos, { lat: rest.lat, lng: rest.lng }));
      }
    }
  }, [restaurantId, tab]);

  useEffect(() => {
    load()
      .catch((err) => setError(err instanceof Error ? err.message : 'Falha no painel.'))
      .finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    if (!restaurantId) return;
    const channel = supabase
      .channel(`staff-board-${restaurantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comandas', filter: `restaurant_id=eq.${restaurantId}` },
        () => {
          load().catch(() => undefined);
        },
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comanda_items' }, () => {
        load().catch(() => undefined);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load, restaurantId]);

  if (!session) return <Redirect href="/(auth)/login" />;
  if (profile && profile.role !== 'staff') {
    return <Redirect href="/(customer)/restaurantes" />;
  }

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}>
        <View style={styles.top}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>Equipe de salão</Text>
            <Text style={styles.title}>{restaurant?.name ?? 'Seu restaurante'}</Text>
          </View>
          <Pressable onPress={() => signOut()}>
            <Text style={styles.out}>Sair</Text>
          </Pressable>
        </View>

        {far ? (
          <View style={styles.geo}>
            <Text style={styles.geoTitle}>Você parece longe do salão</Text>
            <Text style={styles.geoBody}>
              O GPS está a mais de 200 m. Dá para operar mesmo assim — confira se é o ponto certo.
            </Text>
          </View>
        ) : null}

        <Button label="Nova comanda" onPress={() => router.push('/(staff)/nova')} />

        <View style={styles.tabs}>
          {TABS.map((item) => (
            <Pressable
              key={item}
              onPress={() => setTab(item)}
              style={[styles.tab, tab === item && styles.tabOn]}>
              <Text style={[styles.tabText, tab === item && styles.tabTextOn]}>
                {item === 'aberta' ? 'Abertas' : item === 'finalizada' ? 'Finalizadas' : 'Canceladas'}
              </Text>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={colors.gold} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : comandas.length === 0 ? (
          <EmptyState title="Fichas em branco" body="Abra uma mesa ou espere o cliente lançar o primeiro prato." />
        ) : (
          comandas.map((row) => (
            <Pressable
              key={row.id}
              onPress={() => router.push(`/(staff)/comanda/${row.id}`)}
              style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.table}>{row.table_label}</Text>
                <StatusBadge status={row.status} />
              </View>
              <Text style={styles.meta}>
                {formatClock(row.created_at)}
                {row.status === 'aberta' ? ` · ${minutesOpen(row.created_at)} min` : ''}
              </Text>
              <Text style={styles.amount}>{formatBRL(totals[row.id] ?? 0)}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: 48, gap: 12 },
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  kicker: {
    color: colors.gold,
    fontFamily: fonts.bodyMedium,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    fontSize: 11,
  },
  title: { color: colors.ink, fontFamily: fonts.display, fontSize: 30, marginTop: 4 },
  out: { color: colors.inkMuted, fontFamily: fonts.bodyMedium, marginTop: 8 },
  geo: {
    backgroundColor: 'rgba(196, 92, 38, 0.16)',
    borderRadius: radius.md,
    padding: 14,
    gap: 4,
  },
  geoTitle: { color: colors.gold, fontFamily: fonts.bodyBold },
  geoBody: { color: colors.inkMuted, fontFamily: fonts.body, lineHeight: 20 },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(244,232,212,0.16)',
    alignItems: 'center',
  },
  tabOn: { backgroundColor: colors.paper, borderColor: colors.paper },
  tabText: { color: colors.inkMuted, fontFamily: fonts.bodyMedium, fontSize: 12 },
  tabTextOn: { color: colors.bg },
  error: { color: colors.danger },
  card: {
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    padding: 16,
    gap: 6,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  table: { fontFamily: fonts.display, fontSize: 24, color: colors.bg },
  meta: { fontFamily: fonts.body, color: 'rgba(26,20,16,0.55)' },
  amount: { fontFamily: fonts.bodyBold, color: colors.terracottaDeep, fontSize: 16 },
});
