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

import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistance } from '@/lib/format';
import { haversineKm, requestUserLocation, type Coordinates } from '@/lib/location';
import { supabase } from '@/lib/supabase';
import { colors, fonts, radius, space } from '@/lib/theme';
import type { Restaurant, RestaurantWithDistance } from '@/types/database';

export default function RestaurantesScreen() {
  const { profile, session, signOut } = useAuth();
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [gpsDenied, setGpsDenied] = useState(false);
  const [restaurants, setRestaurants] = useState<RestaurantWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const location = await requestUserLocation();
    if (!location) {
      setGpsDenied(true);
      setCoords(null);
    } else {
      setGpsDenied(false);
      setCoords(location);
    }

    const { data, error: queryError } = await supabase
      .from('restaurants')
      .select('id, name, address, lat, lng, phone, created_at')
      .order('name');
    if (queryError) throw queryError;

    const rows = (data ?? []) as Restaurant[];
    const withDistance: RestaurantWithDistance[] = rows.map((row) => ({
      ...row,
      distanceKm: location ? haversineKm(location, { lat: row.lat, lng: row.lng }) : null,
    }));

    withDistance.sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) return a.name.localeCompare(b.name, 'pt-BR');
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });

    setRestaurants(withDistance);
  }, []);

  useEffect(() => {
    load()
      .catch((err) => setError(err instanceof Error ? err.message : 'Falha ao carregar restaurantes.'))
      .finally(() => setLoading(false));
  }, [load]);

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar.');
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
          <View>
            <Text style={styles.kicker}>{coords ? 'Perto de você' : 'Salões da casa'}</Text>
            <Text style={styles.hello}>Olá, {profile?.name?.split(' ')[0] ?? 'cliente'}</Text>
          </View>
          <Pressable onPress={() => signOut()} accessibilityRole="button">
            <Text style={styles.out}>Sair</Text>
          </Pressable>
        </View>

        {gpsDenied ? (
          <View style={styles.note}>
            <Text style={styles.noteTitle}>Localização desligada</Text>
            <Text style={styles.noteBody}>
              Sem GPS listamos em ordem alfabética. Ative a permissão para ver quem está mais perto.
            </Text>
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator color={colors.gold} style={{ marginTop: 40 }} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : restaurants.length === 0 ? (
          <EmptyState
            title="Nenhum salão ainda"
            body="Rode o SQL de seed no Supabase para aparecer Luma, Taberna, Brasa e Maré."
          />
        ) : (
          restaurants.map((item, index) => (
            <Pressable
              key={item.id}
              onPress={() => router.push(`/(customer)/${item.id}`)}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
              <View style={styles.cardHead}>
                <Text style={styles.index}>{String(index + 1).padStart(2, '0')}</Text>
                <Text style={styles.distance}>{formatDistance(item.distanceKm)}</Text>
              </View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.address}>{item.address}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: space.lg,
    paddingBottom: 48,
    gap: 14,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  kicker: {
    color: colors.gold,
    fontFamily: fonts.bodyMedium,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    fontSize: 11,
  },
  hello: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 32,
    marginTop: 4,
  },
  out: {
    color: colors.inkMuted,
    fontFamily: fonts.bodyMedium,
    marginTop: 8,
  },
  note: {
    backgroundColor: 'rgba(212, 165, 116, 0.1)',
    borderRadius: radius.md,
    padding: 14,
    gap: 4,
  },
  noteTitle: {
    color: colors.gold,
    fontFamily: fonts.bodyBold,
  },
  noteBody: {
    color: colors.inkMuted,
    fontFamily: fonts.body,
    lineHeight: 20,
  },
  error: { color: colors.danger, fontFamily: fonts.body },
  card: {
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    padding: 18,
    gap: 6,
  },
  pressed: { opacity: 0.9, transform: [{ translateY: 1 }] },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  index: {
    fontFamily: fonts.bodyBold,
    color: colors.terracotta,
    letterSpacing: 1,
  },
  distance: {
    fontFamily: fonts.bodyMedium,
    color: colors.terracottaDeep,
    fontSize: 12,
  },
  name: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.bg,
  },
  address: {
    fontFamily: fonts.body,
    color: 'rgba(26,20,16,0.62)',
    fontSize: 13,
    lineHeight: 18,
  },
});
