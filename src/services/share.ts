import { File, Paths } from 'expo-file-system';
import { Asset, requestPermissionsAsync } from 'expo-media-library';
import { Alert, Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { Svg } from 'react-native-svg';
import { hapticLight, hapticSuccess, hapticError } from './feedback';

async function svgToPngFile(svgRef: Svg): Promise<File> {
  const base64 = await new Promise<string>((resolve) => {
    svgRef.toDataURL((data) => resolve(data));
  });
  const file = new File(Paths.cache, `qr-${Date.now()}.png`);
  await file.write(base64, { encoding: 'base64' });
  return file;
}

async function ensureWritePhotosPermission(): Promise<boolean> {
  if (Platform.OS !== 'ios') return true; // Android: no runtime permission needed on 33+; on <33 it is granted at install
  const perm = await requestPermissionsAsync(true);
  if (!perm.granted) {
    Alert.alert('Permission needed', 'Allow photo access to save QR codes.');
    hapticError();
    return false;
  }
  return true;
}

export async function saveQrImageToPhotos(svgRef: Svg | null): Promise<boolean> {
  if (!svgRef) return false;

  try {
    if (!(await ensureWritePhotosPermission())) return false;

    const file = await svgToPngFile(svgRef);
    await Asset.create(file.uri);
    hapticSuccess();
    Alert.alert('Saved', 'QR code saved to Photos.');
    return true;
  } catch {
    hapticError();
    Alert.alert('Error', 'Could not save QR code to Photos.');
    return false;
  }
}

export async function shareQrImage(svgRef: Svg | null, fallbackText?: string): Promise<boolean> {
  if (!svgRef) {
    if (fallbackText) {
      try {
        await Clipboard.setStringAsync(fallbackText);
        hapticSuccess();
        Alert.alert('Copied', 'Image not available — content copied to clipboard.');
        return true;
      } catch {
        hapticError();
        return false;
      }
    }
    hapticError();
    return false;
  }

  try {
    const file = await svgToPngFile(svgRef);
    if (Platform.OS === 'web') throw new Error('not supported on web');
    if (!(await Sharing.isAvailableAsync())) {
      await Clipboard.setStringAsync(fallbackText ?? '');
      hapticSuccess();
      Alert.alert('Copied', 'Sharing unavailable — content copied to clipboard.');
      return true;
    }
    await Sharing.shareAsync(file.uri, {
      mimeType: 'image/png',
      dialogTitle: 'Share QR Code',
    });
    hapticSuccess();
    return true;
  } catch {
    hapticError();
    Alert.alert('Error', 'Could not share QR code image.');
    return false;
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await Clipboard.setStringAsync(text);
    hapticLight();
    return true;
  } catch {
    hapticError();
    return false;
  }
}
