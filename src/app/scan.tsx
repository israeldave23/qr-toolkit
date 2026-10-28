import { CameraView, useCameraPermissions, scanFromURLAsync, type BarcodeType } from 'expo-camera';
import { useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import { useTheme } from '../hooks/useTheme';
import { useSettings } from '../hooks/useSettings';
import { Icon } from '../components/Icon';
import { putQr } from '../utils/qrcache';
import { saveEntry } from '../services/history';
import { hapticScan, playBeep } from '../services/feedback';

// Scan types supported by camera; gallery on iOS is QR-only (platform asymmetry).
const BARCODE_TYPES: BarcodeType[] =
  Platform.OS === 'ios'
    ? ['qr']
    : ['qr', 'ean13', 'ean8', 'upc_a', 'code128', 'code39'];

export default function Scan() {
  const { colors } = useTheme();
  const { settings } = useSettings();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scanRef = useRef(false);
  // Dedup: keep last 20 scanned contents; skip exact re-scan in continuous mode
  const seenRef = useRef<string[]>([]);
  const seenSetRef = useRef<Set<string>>(new Set());

  const recordScan = useCallback((data: string) => {
    seenRef.current.push(data);
    seenSetRef.current.add(data);
    if (seenRef.current.length > 20) {
      seenRef.current.shift();
      // rebuild set from remaining window
      seenSetRef.current = new Set(seenRef.current);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      scanRef.current = false;
      setScanned(false);
      setCameraError(null);
      return () => {
        scanRef.current = false;
        setScanned(false);
      };
    }, [])
  );

  const handleBarcodeScanned = useCallback(
    ({ data, type }: { data: string; type?: string }) => {
      if (scanRef.current) return;
      // dedup: skip if this content was scanned within the last 20 events
      if (seenSetRef.current.has(data)) return;
      scanRef.current = true;
      setScanned(true);

      recordScan(data);
      playBeep();
      hapticScan();
      saveEntry(data, 'scan').catch(() => {});
      const id = putQr({ content: data, source: 'scan' });
      if (settings?.scanner.continuousScan !== true) {
        router.push({ pathname: '/result', params: { id, content: data, source: 'scan', rawType: type ?? undefined } });
      } else {
        setTimeout(() => {
          scanRef.current = false;
          setScanned(false);
        }, 500);
      }
    },
    [settings, recordScan]
  );

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;

    try {
      const results = await scanFromURLAsync(result.assets[0].uri, BARCODE_TYPES);
      if (results.length > 0) {
        const { data } = results[0];
        playBeep();
        recordScan(data);
        await saveEntry(data, 'scan');
        const id = putQr({ content: data, source: 'scan' });
        router.push({ pathname: '/result', params: { id, content: data, source: 'scan' } });
      } else {
        Alert.alert('No QR Code', 'No QR code found in this image.');
      }
    } catch {
      Alert.alert('Error', 'Could not scan image. Please try again.');
    }
    scanRef.current = false;
    setScanned(false);
  };

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Requesting permission...</Text>
      </View>
    );
  }

  // Permission permanently denied — offer OS settings link
  if (!permission.granted && !permission.canAskAgain) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.permissionContent}>
          <Icon name="scan-line" size={56} color={colors.textTertiary} />
          <Text style={[styles.permissionTitle, { color: colors.text }]}>
            Camera permission denied
          </Text>
          <Text style={[styles.permissionDesc, { color: colors.textSecondary }]}>
            Camera access is permanently disabled. Open system settings to enable it.
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => Linking.openSettings().catch(() => {})}
          >
            <Text style={styles.primaryButtonText}>Open Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.permissionContent}>
          <Icon name="scan-line" size={56} color={colors.textTertiary} />
          <Text style={[styles.permissionTitle, { color: colors.text }]}>
            Camera permission required
          </Text>
          <Text style={[styles.permissionDesc, { color: colors.textSecondary }]}>
            QR Toolkit needs camera access to scan QR codes.
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={requestPermission}
          >
            <Text style={styles.primaryButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Camera mount error recovery
  if (cameraError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.permissionContent}>
          <Icon name="scan-line" size={56} color={colors.textTertiary} />
          <Text style={[styles.permissionTitle, { color: colors.text }]}>
            Camera error
          </Text>
          <Text style={[styles.permissionDesc, { color: colors.textSecondary }]}>
            {cameraError}
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => setCameraError(null)}
          >
            <Text style={styles.primaryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => Linking.openSettings().catch(() => {})}
          >
            <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>Open System Settings</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{
          barcodeTypes: BARCODE_TYPES,
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        onMountError={(err) => {
          setCameraError(err.message || 'Camera failed to start.');
        }}
      >
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.topButton} onPress={() => router.back()}>
            <Icon name="scan-line" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          {scanned && (
            <View style={styles.scannedBadge}>
              <Text style={styles.scannedText}>Code Captured</Text>
            </View>
          )}
        </View>

        <View style={styles.scannerFrame} />

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
            onPress={pickImage}
          >
            <Icon name="plus-circle" size={24} color="#FFFFFF" />
            <Text style={styles.actionLabel}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.torchButton,
              { backgroundColor: torch ? colors.primary : 'rgba(0,0,0,0.5)' },
            ]}
            onPress={() => setTorch(!torch)}
          >
            <Icon name="sun" size={24} color="#FFFFFF" />
            <Text style={styles.actionLabel}>{torch ? 'Off' : 'On'}</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  permissionDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  primaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 12,
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 14,
  },
  camera: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannedBadge: {
    backgroundColor: 'rgba(79,70,229,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scannedText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  scannerFrame: {
    flex: 1,
    marginHorizontal: 40,
    marginVertical: 80,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 24,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    paddingHorizontal: 40,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 4,
  },
  torchButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 4,
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
  },
});
