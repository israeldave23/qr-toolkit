import AsyncStorage from '@react-native-async-storage/async-storage';
import { type AppSettings, DEFAULT_SETTINGS } from '../models';

export type { AppSettings };

const KEY = 'qr_settings_v1';

let _cache: AppSettings | null = null;

export async function loadSettings(): Promise<AppSettings> {
  if (_cache) return _cache;
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) {
    _cache = DEFAULT_SETTINGS;
    return _cache;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    _cache = { ...DEFAULT_SETTINGS, ...parsed };
    return _cache;
  } catch {
    _cache = DEFAULT_SETTINGS;
    return _cache;
  }
}

export async function persistSettings(settings: AppSettings): Promise<void> {
  _cache = settings;
  await AsyncStorage.setItem(KEY, JSON.stringify(settings));
}

export function invalidateCache(): void {
  _cache = null;
}
