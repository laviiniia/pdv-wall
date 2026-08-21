import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const CHUNK = 1800;

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  }

  const first = await SecureStore.getItemAsync(key);
  if (!first) return null;
  if (!first.startsWith('chunk:')) return first;

  const count = Number(first.slice(6));
  const parts: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const part = await SecureStore.getItemAsync(`${key}.${i}`);
    if (part == null) return null;
    parts.push(part);
  }
  return parts.join('');
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }

  await deleteItem(key);
  if (value.length <= CHUNK) {
    await SecureStore.setItemAsync(key, value);
    return;
  }

  const chunks = Math.ceil(value.length / CHUNK);
  await SecureStore.setItemAsync(key, `chunk:${chunks}`);
  for (let i = 0; i < chunks; i += 1) {
    await SecureStore.setItemAsync(`${key}.${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK));
  }
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }

  const first = await SecureStore.getItemAsync(key);
  if (first?.startsWith('chunk:')) {
    const count = Number(first.slice(6));
    for (let i = 0; i < count; i += 1) {
      await SecureStore.deleteItemAsync(`${key}.${i}`);
    }
  }
  await SecureStore.deleteItemAsync(key);
}

const ExpoSecureStoreAdapter = {
  getItem,
  setItem,
  removeItem: deleteItem,
};

export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
