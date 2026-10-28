import AsyncStorage from '@react-native-async-storage/async-storage';
import { type QrPayload, STORAGE_VERSION } from '../models';
import { detectType } from '../utils/qr';

const HISTORY_KEY = 'qr_history_v1';
const FAV_KEY = 'qr_favorites_v1';
const META_KEY = 'qr_storage_meta_v1';

interface StorageMeta {
  version: number;
}

async function readMeta(): Promise<StorageMeta> {
  const raw = await AsyncStorage.getItem(META_KEY);
  if (!raw) return { version: 0 };
  try {
    return JSON.parse(raw) as StorageMeta;
  } catch {
    return { version: 0 };
  }
}

async function writeMeta(meta: StorageMeta): Promise<void> {
  await AsyncStorage.setItem(META_KEY, JSON.stringify(meta));
}

// Ordered, idempotent migrations keyed on version. Never edit a shipped migration; add one.
type Migration = (key: string, prevKey: string) => Promise<void>;
const MIGRATIONS: Migration[] = [
  // v0 -> v1: initial schema, nothing to migrate from (first shipped version).
  async (_key, _prevKey) => {},
];

export async function migrateHistory(): Promise<void> {
  const meta = await readMeta();
  let v = meta.version;
  while (v < MIGRATIONS.length) {
    await MIGRATIONS[v](HISTORY_KEY, `qr_history_v${v}`);
    v++;
  }
  if (v !== STORAGE_VERSION) {
    await writeMeta({ version: v });
  }
}

export async function getHistory(): Promise<QrPayload[]> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown[];
    return parsed.filter((item): item is QrPayload =>
      item != null && typeof item === 'object' && 'content' in item && 'source' in item && 'createdAt' in item
    );
  } catch {
    return [];
  }
}

export async function saveEntry(
  content: string,
  source: 'scan' | 'gen' = 'scan'
): Promise<QrPayload> {
  const list = await getHistory();
  const item: QrPayload = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    content,
    source,
    detectedType: detectType(content),
    createdAt: Date.now(),
  };
  list.unshift(item);
  if (list.length > 500) list.splice(500);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  return item;
}

export async function deleteItem(id: string): Promise<void> {
  const list = await getHistory();
  const filtered = list.filter((i) => i.id !== id);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
  await AsyncStorage.removeItem(FAV_KEY);
}

export async function getFavorites(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(FAV_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export async function toggleFavorite(id: string): Promise<boolean> {
  const favs = await getFavorites();
  const isFav = favs.includes(id);
  const updated = isFav ? favs.filter((f) => f !== id) : [...favs, id];
  await AsyncStorage.setItem(FAV_KEY, JSON.stringify(updated));
  return !isFav;
}

export async function isFavorite(id: string): Promise<boolean> {
  const favs = await getFavorites();
  return favs.includes(id);
}

// Wi-Fi passwords are sensitive. The payload is required for QR regeneration, so we redact
// only when the caller opts out. Never send raw payloads to ad SDKs or crash/analytics logs.
export function redactSensitive(content: string, type: QrPayload['detectedType']): string {
  if (type === 'wifi') {
    return content.replace(/;P:[^;]*/, ';P:****');
  }
  return content;
}
