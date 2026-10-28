import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Share } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as Linking from 'expo-linking';
import { useState, useEffect, useRef } from 'react';
import QRCode from 'react-native-qrcode-svg';
import type { Svg } from 'react-native-svg';
import { useTheme } from '../hooks/useTheme';
import { Icon } from '../components/Icon';
import { getQr } from '../utils/qrcache';
import { toggleFavorite, isFavorite, redactSensitive } from '../services/history';
import { detectType, TYPE_LABELS } from '../utils/qr';
import { saveQrImageToPhotos, shareQrImage, copyToClipboard } from '../services/share';
import { useAdsEnabled, showInterstitialIfReady } from '../services/ads';
import { runContextAction, contextActionLabel } from '../services/contextActions';
import type { QrDetectedType } from '../models';

type RouteParams = {
  id?: string;
  content?: string;
  source?: 'scan' | 'gen';
  rawType?: string;
};

// Map raw camera barcode type → display label (overrides detectType for 1-D barcodes)
function labelFor(qrType: QrDetectedType, rawType?: string): string {
  if (rawType) {
    const m: Record<string, string> = {
      ean13: 'EAN-13', ean8: 'EAN-8', upc_a: 'UPC-A', code128: 'Code 128', code39: 'Code 39',
    };
    if (m[rawType]) return m[rawType];
  }
  return TYPE_LABELS[qrType] ?? TYPE_LABELS.unknown;
}

export default function Result() {
  const { colors } = useTheme();
  const [adsEnabled] = useAdsEnabled();
  const params = useLocalSearchParams<RouteParams>();
  const { id, content: paramContent, source: paramSource, rawType } = params;
  const [isFav, setIsFav] = useState(false);
  const svgRef = useRef<Svg | null>(null);

  const entry = id ? getQr(id) : undefined;
  const content = entry?.content ?? paramContent ?? '';
  const qrType: QrDetectedType = detectType(content);
  const itemId = entry?.id;
  const displayContent = redactSensitive(content, qrType);

  useEffect(() => {
    if (itemId) {
      isFavorite(itemId).then(setIsFav);
    }
  }, [itemId]);

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

  const config = labelFor(qrType, rawType);

  const open = () => {
    const actionLabel: Record<string, string> = {
      url: 'Open this link?',
      email: 'Send email?',
      phone: 'Call this number?',
      sms: 'Send SMS?',
      location: 'Open location?',
    };
    const msg = actionLabel[qrType] ?? 'Open this link?';
    Alert.alert(msg, displayContent.slice(0, 120), [
      { text: 'Cancel', style: 'cancel' },
      {
        text: qrType === 'url' ? 'Open' : qrType === 'email' ? 'Send' : qrType === 'phone' ? 'Call' : qrType === 'sms' ? 'Send' : 'Open',
        onPress: () => {
          Linking.openURL(content).catch(() =>
            Alert.alert('Error', 'Cannot open this content.')
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

  const canOpen = ['url', 'email', 'phone', 'sms', 'location'].includes(qrType);
  const ctxLabel = contextActionLabel(qrType);

  const actions: { label: string; show: boolean }[] = [
    // Context-sensitive primary action (Wi-Fi / vCard / Event / Location)
    { label: ctxLabel ?? '', show: ctxLabel !== null },
    { label: 'Open', show: canOpen && ctxLabel === null },
    { label: 'Copy', show: true },
    { label: 'Share', show: true },
    { label: 'Share Image', show: true },
  ];

  const visibleActions = actions.filter((a) => a.show);

  const runAction = (label: string) => {
    if (ctxLabel && label === ctxLabel) {
      runContextAction(qrType, content);
      return;
    }
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
            {displayContent}
          </Text>
        </View>

        {/* QR preview for all sources — scanned codes can also be re-rendered */}
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
