import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, TextInput, Share } from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect, router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '../hooks/useTheme';
import { Icon } from '../components/Icon';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { getHistory, deleteItem, toggleFavorite, getFavorites, clearHistory, redactSensitive } from '../services/history';
import { copyToClipboard } from '../services/share';
import { BannerAdComponent, useAdsEnabled } from '../services/ads';
import { type QrPayload } from '../models';
import { detectType, parseContentForTemplate, type TemplateType } from '../utils/qr';

type FilterTab = 'all' | 'scan' | 'gen' | 'favorites';

export default function History() {
  const { colors } = useTheme();
  const [adsEnabled] = useAdsEnabled();
  const [items, setItems] = useState<QrPayload[]>([]);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const [list, favs] = await Promise.all([getHistory(), getFavorites()]);
    setItems(list);
    setFavIds(new Set(favs));
    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const remove = async (id: string) => {
    await deleteItem(id);
    load();
  };

  const clear = async () => {
    Alert.alert('Clear History', 'Remove all history entries?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: async () => { await clearHistory(); load(); } },
    ]);
  };

  const copyItem = async (item: QrPayload) => {
    const ok = await copyToClipboard(item.content);
    if (ok) Alert.alert('Copied', 'Content copied to clipboard.');
    else Alert.alert('Error', 'Could not copy.');
  };

  const shareItem = async (item: QrPayload) => {
    try {
      await Share.share({ message: item.content });
    } catch {
      Alert.alert('Error', 'Cannot share.');
    }
  };

  const toggleFav = async (item: QrPayload) => {
    await toggleFavorite(item.id);
    load();
  };

  const filtered = items.filter((item) => {
    const matchesFilter =
      filter === 'all' ||
      filter === item.source ||
      (filter === 'favorites' && favIds.has(item.id));
    const matchesSearch =
      !search ||
      item.content.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const reuseItem = (item: QrPayload) => {
    const t = detectType(item.content);
    const template: TemplateType =
      (['text','url','email','phone','sms','wifi','vcard','location','event'] as const).includes(t as TemplateType)
        ? t as TemplateType
        : 'text';
    const parsedValues = parseContentForTemplate(template, item.content);
    router.push({
      pathname: '/generate',
      params: { template, values: JSON.stringify(parsedValues) },
    });
  };

  const renderItem = ({ item }: { item: QrPayload }) => {
    const t = detectType(item.content);
    const displayContent = redactSensitive(item.content, t);
    return (
      <TouchableOpacity
        style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() =>
          router.push({
            pathname: '/result',
            params: { id: item.id, content: item.content, source: item.source },
          })
        }
        accessibilityRole="button"
        accessibilityLabel={`Open ${displayContent.slice(0, 30)}`}
      >
        {/* QR thumbnail */}
        <View style={[styles.thumbWrap, { backgroundColor: colors.surfaceSecondary }]}>
          <QRCode value={item.content} size={48} />
        </View>
        <View style={styles.itemMain}>
          <View style={styles.itemTop}>
            <Badge label={item.source === 'scan' ? 'Scanned' : 'Generated'} type={item.source} />
            <Text style={[styles.itemDate, { color: colors.textTertiary }]}>
              {new Date(item.createdAt).toLocaleString()}
            </Text>
          </View>
          <Text style={[styles.itemContent, { color: colors.text }]} numberOfLines={2}>
            {displayContent}
          </Text>
        </View>
        <View style={styles.itemActions}>
          <TouchableOpacity
            onPress={() => reuseItem(item)}
            style={styles.iconBtn}
            accessibilityLabel="Reuse in generator"
          >
            <Icon name="plus-circle" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => toggleFav(item)}
            style={styles.iconBtn}
            accessibilityLabel={favIds.has(item.id) ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Icon
              name="heart"
              size={20}
              color={favIds.has(item.id) ? colors.warning : colors.textTertiary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => copyItem(item)}
            style={styles.iconBtn}
            accessibilityLabel="Copy content"
          >
            <Icon name="copy" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => shareItem(item)}
            style={styles.iconBtn}
            accessibilityLabel="Share content"
          >
            <Icon name="share" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => remove(item.id)}
            style={styles.iconBtn}
            accessibilityLabel="Delete entry"
          >
            <Icon name="trash" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const filters: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'scan', label: 'Scanned' },
    { id: 'gen', label: 'Generated' },
    { id: 'favorites', label: 'Favorites' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>History</Text>
        {items.length > 0 && (
          <TouchableOpacity onPress={clear}>
            <Text style={[styles.clearBtn, { color: colors.error }]}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      <TextInput
        style={[styles.search, { backgroundColor: colors.surfaceSecondary, color: colors.text, borderColor: colors.border }]}
        placeholder="Search history..."
        placeholderTextColor={colors.textTertiary}
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[
              styles.filterBtn,
              {
                backgroundColor: filter === f.id ? colors.primary : colors.surfaceSecondary,
                borderColor: filter === f.id ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setFilter(f.id)}
          >
            <Text style={[styles.filterText, { color: filter === f.id ? '#FFFFFF' : colors.text }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <Text style={{ color: colors.textSecondary }}>Loading...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={search ? '🔍' : '📋'}
          title={search ? 'No matches' : 'No history yet'}
          subtitle={search ? 'Try a different search term.' : 'Scan or generate QR codes to see them here.'}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {adsEnabled && (
        <View style={styles.adSlot}>
          <BannerAdComponent />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  clearBtn: {
    fontSize: 14,
    fontWeight: '600',
  },
  search: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  thumbWrap: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemMain: {
    flex: 1,
    gap: 6,
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemDate: {
    fontSize: 12,
  },
  itemContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    padding: 6,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  adSlot: {
    height: 90,
    width: '100%',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
