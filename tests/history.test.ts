jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (key: string) => store.get(key) ?? null),
      setItem: jest.fn(async (key: string, val: string) => store.set(key, val)),
      removeItem: jest.fn(async (key: string) => store.delete(key)),
      clear: jest.fn(async () => store.clear()),
      multiGet: jest.fn(async (keys: string[]) =>
        keys.map((k) => [k, store.get(k) ?? null] as [string, string | null])
      ),
      multiSet: jest.fn(async (pairs: [string, string][]) => {
        pairs.forEach(([k, v]) => store.set(k, v));
      }),
      multiRemove: jest.fn(async (keys: string[]) => keys.forEach((k) => store.delete(k))),
    },
  };
});

import {
  redactSensitive,
  saveEntry,
  getHistory,
  toggleFavorite,
  getFavorites,
  migrateHistory,
} from '../src/services/history';

describe('redactSensitive', () => {
  it('masks Wi-Fi password in WIFI: payload', () => {
    expect(redactSensitive('WIFI:T:WPA;S:MyNet;P:secret123;;', 'wifi')).toBe(
      'WIFI:T:WPA;S:MyNet;P:****;;'
    );
  });

  it('leaves open Wi-Fi (no P: field) unchanged', () => {
    expect(redactSensitive('WIFI:T:nopass;S:Guest;;', 'wifi')).toBe(
      'WIFI:T:nopass;S:Guest;;'
    );
  });

  it('returns content unchanged for non-wifi types', () => {
    const s = 'https://example.com?token=abc';
    expect(redactSensitive(s, 'url')).toBe(s);
  });
});

describe('saveEntry / getHistory', () => {
  it('saveEntry creates a record with detectedType and createdAt', async () => {
    const entry = await saveEntry('https://example.com', 'scan');
    expect(entry.content).toBe('https://example.com');
    expect(entry.source).toBe('scan');
    expect(entry.detectedType).toBe('url');
    expect(typeof entry.createdAt).toBe('number');
    expect(entry.id.length).toBeGreaterThan(0);
  });

  it('getHistory returns entries in reverse-chronological order', async () => {
    await saveEntry('first', 'gen');
    await saveEntry('second', 'gen');
    const items = await getHistory();
    expect(items[0].content).toBe('second');
    expect(items[1].content).toBe('first');
  });

  it('saveEntry caps list at 500', async () => {
    for (let i = 0; i < 501; i++) {
      await saveEntry(`item-${i}`, 'scan');
    }
    const items = await getHistory();
    expect(items.length).toBeLessThanOrEqual(500);
  });
});

describe('toggleFavorite', () => {
  it('toggling twice returns to original state', async () => {
    const entry = await saveEntry('fav-test', 'scan');
    const first = await toggleFavorite(entry.id);
    expect(first).toBe(true);
    const favsAfterAdd = await getFavorites();
    expect(favsAfterAdd).toContain(entry.id);

    const second = await toggleFavorite(entry.id);
    expect(second).toBe(false);
    const favsAfterRemove = await getFavorites();
    expect(favsAfterRemove).not.toContain(entry.id);
  });
});

describe('migrateHistory', () => {
  it('runs idempotent — calling twice does not throw', async () => {
    await migrateHistory();
    await migrateHistory();
  });
});
