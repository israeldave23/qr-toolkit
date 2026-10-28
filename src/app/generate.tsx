import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useState, useRef } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import type { Svg } from 'react-native-svg';
import { useTheme } from '../hooks/useTheme';
import { useSettings } from '../hooks/useSettings';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { saveEntry } from '../services/history';
import { putQr } from '../utils/qrcache';
import {
  TEMPLATES,
  buildContent,
  type TemplateType,
} from '../utils/qr';
import { saveQrImageToPhotos, shareQrImage } from '../services/share';
import type { QrErrorCorrection } from '../models';
import { BannerAdComponent, useAdsEnabled } from '../services/ads';

const ECC_OPTIONS: { id: QrErrorCorrection; label: string }[] = [
  { id: 'L', label: 'Low' },
  { id: 'M', label: 'Medium' },
  { id: 'Q', label: 'Quarter' },
  { id: 'H', label: 'High' },
];

const SIZE_OPTIONS = [
  { value: 120, label: 'S' },
  { value: 180, label: 'M' },
  { value: 240, label: 'L' },
];

const TEMPLATE_IDS: TemplateType[] = ['text','url','email','phone','sms','wifi','vcard','location','event'];

function initialTemplate(params: { template?: string }): TemplateType {
  const t = params.template as TemplateType;
  return TEMPLATE_IDS.includes(t) ? t : 'text';
}

function initialValues(params: { values?: string }): Record<string, string> {
  if (params.values) {
    try {
      const parsed = JSON.parse(params.values);
      if (parsed && typeof parsed === 'object') return parsed as Record<string, string>;
    } catch {}
  }
  return { text: '' };
}

export default function Generate() {
  const { colors } = useTheme();
  const [adsEnabled] = useAdsEnabled();
  const { settings, update } = useSettings();
  const params = useLocalSearchParams<{ template?: string; values?: string }>();
  const [selectedType, setSelectedType] = useState<TemplateType>(() => initialTemplate(params));
  const [values, setValues] = useState<Record<string, string>>(() => initialValues(params));
  const [fgColor, setFgColor] = useState(settings?.qrGen.fg || '#000000');
  const [bgColor, setBgColor] = useState(settings?.qrGen.bg || '#FFFFFF');
  const [ecc, setEcc] = useState<QrErrorCorrection>(settings?.qrGen.errorCorrection || 'M');
  const [size, setSize] = useState(settings?.qrGen.size || 180);
  const svgRef = useRef<Svg | null>(null);

  const currentContent = buildContent(selectedType, values);
  const hasContent = Object.values(values).some((v) => v.trim().length > 0);

  const updateValue = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const persistQrGen = (partial: Partial<import('../models').QrGenPreferences>) => {
    if (!settings) return;
    update({ qrGen: { ...settings.qrGen, ...partial } });
  };

  const navigateToResult = () => {
    if (!hasContent) {
      Alert.alert('Empty', 'Please fill in the required fields.');
      return;
    }
    saveEntry(currentContent, 'gen').catch(() => {});
    const id = putQr({ content: currentContent, source: 'gen' });
    router.push({ pathname: '/result', params: { id, content: currentContent, source: 'gen' } });
  };

  const directSave = async () => {
    if (!hasContent) {
      Alert.alert('Empty', 'Please fill in the required fields.');
      return;
    }
    await saveEntry(currentContent, 'gen');
    Alert.alert('Saved', 'QR code saved to history.');
  };

  const saveImage = async () => {
    if (!hasContent) {
      Alert.alert('Empty', 'Please fill in the required fields.');
      return;
    }
    await saveQrImageToPhotos(svgRef.current);
  };

  const renderFields = () => {
    switch (selectedType) {
      case 'url':
        return <Input label="URL" placeholder="https://example.com" value={values.url} onChangeText={(v) => updateValue('url', v)} autoCapitalize="none" autoCorrect={false} />;
      case 'email':
        return <Input label="Email" placeholder="name@example.com" value={values.email} onChangeText={(v) => updateValue('email', v)} keyboardType="email-address" autoCapitalize="none" />;
      case 'phone':
        return <Input label="Phone" placeholder="+1234567890" value={values.phone} onChangeText={(v) => updateValue('phone', v)} keyboardType="phone-pad" />;
      case 'sms':
        return <Input label="Phone" placeholder="+1234567890" value={values.sms} onChangeText={(v) => updateValue('sms', v)} keyboardType="phone-pad" />;
      case 'wifi':
        return (
          <View style={styles.fieldGap}>
            <Input label="Network Name (SSID)" placeholder="MyWiFi" value={values.wifiSSID} onChangeText={(v) => updateValue('wifiSSID', v)} autoCapitalize="none" />
            <Input label="Password" placeholder="Password" value={values.wifiPassword} onChangeText={(v) => updateValue('wifiPassword', v)} secureTextEntry />
          </View>
        );
      case 'vcard':
        return (
          <View style={styles.fieldGap}>
            <Input label="Full Name" placeholder="John Doe" value={values.vcardName} onChangeText={(v) => updateValue('vcardName', v)} />
            <Input label="Phone" placeholder="+1234567890" value={values.vcardPhone} onChangeText={(v) => updateValue('vcardPhone', v)} keyboardType="phone-pad" />
            <Input label="Email" placeholder="john@example.com" value={values.vcardEmail} onChangeText={(v) => updateValue('vcardEmail', v)} keyboardType="email-address" />
          </View>
        );
      case 'location':
        return (
          <View style={styles.fieldGap}>
            <Input label="Latitude" placeholder="40.7128" value={values.locLat} onChangeText={(v) => updateValue('locLat', v)} keyboardType="decimal-pad" />
            <Input label="Longitude" placeholder="-74.0060" value={values.locLon} onChangeText={(v) => updateValue('locLon', v)} keyboardType="decimal-pad" />
          </View>
        );
      case 'event':
        return (
          <View style={styles.fieldGap}>
            <Input label="Event Title" placeholder="Meeting" value={values.eventTitle} onChangeText={(v) => updateValue('eventTitle', v)} />
            <Input label="Date/Time" placeholder="20250101T120000" value={values.eventDate} onChangeText={(v) => updateValue('eventDate', v)} />
            <Input label="Location" placeholder="Office" value={values.eventLocation} onChangeText={(v) => updateValue('eventLocation', v)} />
            <Input label="Description" placeholder="Brief description" value={values.eventDesc} onChangeText={(v) => updateValue('eventDesc', v)} multiline style={{ minHeight: 60 }} />
          </View>
        );
      default:
        return <Input label="Text" placeholder="Enter your text here..." value={values.text} onChangeText={(v) => updateValue('text', v)} multiline style={{ minHeight: 100 }} />;
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.title, { color: colors.text }]}>Create QR Code</Text>

      <View style={styles.templateRow}>
        {TEMPLATES.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[
              styles.templateBtn,
              {
                backgroundColor: selectedType === t.id ? colors.primary : colors.surfaceSecondary,
                borderColor: selectedType === t.id ? colors.primary : colors.border,
              },
            ]}
            onPress={() => {
              setSelectedType(t.id);
              setValues({});
            }}
          >
            <Text style={[styles.templateLabel, { color: selectedType === t.id ? '#FFFFFF' : colors.text }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {renderFields()}
      </View>

      {hasContent && (
        <View style={styles.previewSection}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Preview</Text>
          <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <QRCode
              getRef={(ref: Svg) => {
                svgRef.current = ref;
              }}
              value={currentContent}
              size={size}
              color={fgColor}
              backgroundColor={bgColor}
              ecl={ecc}
            />
          </View>
          <View style={styles.colorRow}>
            <View style={styles.colorPick}>
              <Text style={[styles.colorLabel, { color: colors.textSecondary }]}>Foreground</Text>
              <TouchableOpacity style={[styles.colorDot, { backgroundColor: fgColor, borderColor: colors.border }]} onPress={() => { const next = fgColor === '#000000' ? '#4F46E5' : '#000000'; setFgColor(next); persistQrGen({ fg: next }); }} />
            </View>
            <View style={styles.colorPick}>
              <Text style={[styles.colorLabel, { color: colors.textSecondary }]}>Background</Text>
              <TouchableOpacity style={[styles.colorDot, { backgroundColor: bgColor, borderColor: colors.border }]} onPress={() => { const next = bgColor === '#FFFFFF' ? '#EEF2FF' : '#FFFFFF'; setBgColor(next); persistQrGen({ bg: next }); }} />
            </View>
          </View>
          <View style={styles.customRow}>
            <View>
              <Text style={[styles.optionLabel, { color: colors.textSecondary }]}>Error Correction</Text>
              <View style={styles.chipRow}>
                {ECC_OPTIONS.map((o) => (
                  <TouchableOpacity
                    key={o.id}
                    style={[styles.chip, { backgroundColor: ecc === o.id ? colors.primary : colors.surfaceSecondary, borderColor: ecc === o.id ? colors.primary : colors.border }]}
                    onPress={() => { setEcc(o.id); persistQrGen({ errorCorrection: o.id }); }}
                  >
                    <Text style={{ color: ecc === o.id ? '#FFFFFF' : colors.text, fontSize: 12, fontWeight: '600' }}>{o.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View>
              <Text style={[styles.optionLabel, { color: colors.textSecondary }]}>Size</Text>
              <View style={styles.chipRow}>
                {SIZE_OPTIONS.map((o) => (
                  <TouchableOpacity
                    key={o.value}
                    style={[styles.chip, { backgroundColor: size === o.value ? colors.primary : colors.surfaceSecondary, borderColor: size === o.value ? colors.primary : colors.border }]}
                    onPress={() => { setSize(o.value); persistQrGen({ size: o.value }); }}
                  >
                    <Text style={{ color: size === o.value ? '#FFFFFF' : colors.text, fontSize: 12, fontWeight: '600' }}>{o.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
      )}

      <View style={styles.actions}>
        <Button label="View Result" variant="primary" fullWidth onPress={navigateToResult} />
        <Button label="Share Image" variant="secondary" fullWidth disabled={!hasContent} onPress={async () => { await shareQrImage(svgRef.current, currentContent); }} />
        <Button label="Save to History" variant="secondary" fullWidth onPress={directSave} />
        <Button label="Save to Photos" variant="secondary" fullWidth disabled={!hasContent} onPress={saveImage} />
      </View>

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={[styles.backText, { color: colors.textSecondary }]}>Back</Text>
      </TouchableOpacity>

      {adsEnabled && (
        <View style={styles.adSlot}>
          <BannerAdComponent />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  templateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  templateBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  templateLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  formCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  fieldGap: {
    gap: 12,
  },
  previewSection: {
    alignItems: 'center',
    gap: 12,
  },
  sectionLabel: {
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
  colorRow: {
    flexDirection: 'row',
    gap: 24,
  },
  colorPick: {
    alignItems: 'center',
    gap: 6,
  },
  colorLabel: {
    fontSize: 12,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
  },
  actions: {
    gap: 10,
  },
  customRow: {
    gap: 12,
    alignSelf: 'stretch',
  },
  optionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  adSlot: {
    height: 90,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  backText: {
    fontSize: 14,
  },
});
