import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Share } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as Linking from 'expo-linking';
import { useState, useEffect, useRef } from 'react';
import QRCode from 'react-native-qrcode-svg';
import type { Svg } from 'react-native-svg';
import { useTheme } from '../hooks/useTheme';
import { Icon } from '../components/Icon';
import { getQr } from '../utils/qrcache';
import { toggleFavorite, isFavorite } from '../services/history';
import { detectType, TYPE_LABELS } from '../utils/qr';
import { saveQrImageToPhotos, shareQrImage, copyToClipboard } from '../services/share';
import { useAdsEnabled, showInterstitialIfReady } from '../services/ads';
import type { QrDetectedType } from '../models';

type RouteParams = {
  id?: string;
  content?: string;
  source?: 'scan' | 'gen';
};

export default function Result() {
  const { colors } = useTheme();
  const [adsEnabled] = useAdsEnabled();
  const params = useLocalSearchParams<RouteParams>();
  const { id, content: paramContent, source: paramSource } = params;
  const [isFav, setIsFav] = useState(false);
  const svgRef = useRef<Svg | null>(null);

  const entry = id ? getQr(id) : undefined;
  const content = entry?.content ?? paramContent ?? '';
  const source = entry?.source ?? paramSource ?? 'scan';
  const qrType: QrDetectedType = detectType(content);
  const itemId = entry?.id;

  useEffect(() => {
    if (itemId) {
      isFavorite(itemId).then(setIsFav);
    }
  }, [itemId]);

  // Natural transition: interstitial when landing on a generated result, frequency-capped.
  // Runs once on mount; does not block the user's ability to act on the scanned/generated result.
  useEffect(() => {
    if (adsEnabled && paramSource === 'gen') {
      showInterstitialIfReady();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!content) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>Content not found.</Text>
      </View>
    );
  }

  const config = TYPE_LABELS[qrType];

  const open = () => {
    if (!content) return;
    const actionLabel: Record<string, string> = {
      url: 'Open this link?',
      email: 'Send email?',
      phone: 'Call this number?',
      sms: 'Send SMS?',
    };
    const msg = actionLabel[qrType] ?? 'Open this link?';
    Alert.alert(msg, content.slice(0, 120), [
      { text: 'Cancel', style: 'cancel' },
      {
        text: qrType === 'url' ? 'Open' : qrType === 'email' ? 'Send' : qrType === 'phone' ? 'Call' : 'Send',
        onPress: () => {
          Linking.openURL(content).catch(() =>
            Alert.alert('Error', 'Cannot open this link.')
          );
        },
      },
    ]);
  };

  const copy = async () => {
    const ok = await copyToClipboard(content);
    if (ok) Alert.alert('Copied', 'Content copied to clipboard.');
    else Alert.alert('Error', 'Could not copy.');
  };

  const share = async () => {
    try {
      await Share.share({ message: content });
    } catch {
      Alert.alert('Error', 'Cannot share.');
    }
  };

  const shareImage = async () => {
    await shareQrImage(svgRef.current, content);
  };

  const handleFavorite = async () => {
    if (!itemId) return;
    const newFav = await toggleFavorite(itemId);
    setIsFav(newFav);
  };

  const actions: { label: string; show: boolean }[] = [
    { label: 'Open', show: qrType === 'url' || qrType === 'email' || qrType === 'phone' || qrType === 'sms' },
    { label: 'Copy', show: true },
    { label: 'Share', show: true },
    { label: 'Share Image', show: true },
  ];

  const visibleActions = actions.filter((a) => a.show);

  const runAction = (label: string) => {
    switch (label) {
      case 'Open': open(); break;
      case 'Copy': copy(); break;
      case 'Share': share(); break;
      case 'Share Image': shareImage(); break;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={[styles.backText, { color: colors.textSecondary }]}>Back</Text>
          </TouchableOpacity>
          {itemId && (
            <TouchableOpacity
              onPress={handleFavorite}
              accessibilityLabel={isFav ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Icon
                name="heart"
                size={24}
                color={isFav ? colors.warning : colors.textTertiary}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.typeBadge, { backgroundColor: colors.primarySubtle }]}>
          <Text style={[styles.typeLabel, { color: colors.primary }]}>{config}</Text>
        </View>

        <View style={[styles.contentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.contentText, { color: colors.text }]} selectable>
            {content}
          </Text>
        </View>

        {source === 'gen' && (
          <View style={styles.previewSection}>
            <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>QR Preview</Text>
            <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <QRCode
                getRef={(ref: Svg) => {
                  svgRef.current = ref;
                }}
                value={content}
                size={180}
              />
            </View>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.surfaceSecondary, alignSelf: 'center' }]}
              onPress={() => { saveQrImageToPhotos(svgRef.current); }}
              accessibilityLabel="Save image to Photos"
            >
              <Text style={[styles.actionLabel, { color: colors.text }]}>Save Image</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.actions}>
          {visibleActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={[styles.actionBtn, { backgroundColor: colors.surfaceSecondary }]}
              onPress={() => runAction(action.label)}
              accessibilityLabel={action.label}
            >
              <Text style={[styles.actionLabel, { color: colors.text }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backBtn: {
    paddingVertical: 8,
  },
  backText: {
    fontSize: 15,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  contentCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    minHeight: 100,
    justifyContent: 'center',
  },
  contentText: {
    fontSize: 15,
    lineHeight: 22,
  },
  previewSection: {
    alignItems: 'center',
    gap: 12,
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  previewCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});
