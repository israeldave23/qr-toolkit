import { Platform, Alert } from 'react-native';
import * as Linking from 'expo-linking';
import { type QrDetectedType } from '../models';
import { parseContentForTemplate } from '../utils/qr';

// Parse Wi-Fi payload → SSID / password / type
function parseWifi(content: string): { ssid: string; password: string } | null {
  const m = content.match(/^WIFI:T:(\w+);S:([^;]*)(;P:([^;]*))?;;?$/i);
  if (!m) return null;
  return { ssid: m[2] ?? '', password: m[4] ?? '' };
}

// Wi-Fi connect: Android opens Wi-Fi settings; iOS has no programmatic API.
export async function connectWifi(content: string): Promise<void> {
  const w = parseWifi(content);
  if (!w) {
    Alert.alert('No Wi-Fi data', 'Could not parse Wi-Fi information from this QR code.');
    return;
  }
  if (Platform.OS === 'android') {
    try {
      await Linking.openURL(
        `intent://wifisettings#Intent;action=android.settings.WIFI_PEERS_DETAILS;S=SSID=${encodeURIComponent(w.ssid)};end`,
      );
      return;
    } catch {
      /* fall through to manual instructions */
    }
  }
  Alert.alert(
    'Connect to Wi-Fi',
    `Network: ${w.ssid}\n` +
      (w.password ? `Password: ${w.password}\n` : 'No password required.\n') +
      'Please connect to this network in your device Wi-Fi settings.',
    [{ text: 'OK' }],
  );
}
// Add a vCard contact — uses the system Share Sheet so the user picks Contacts.
export async function addContact(content: string): Promise<void> {
  const parsed = parseContentForTemplate('vcard', content);
  const summary = [
    parsed.vcardName ? `Name: ${parsed.vcardName}` : '',
    parsed.vcardPhone ? `Phone: ${parsed.vcardPhone}` : '',
    parsed.vcardEmail ? `Email: ${parsed.vcardEmail}` : '',
  ].filter(Boolean).join('\n');
  if (!summary) {
    Alert.alert('No contact data', 'This QR does not contain contact details.');
    return;
  }
  const { Share } = await import('react-native');
  await Share.share({ message: summary, title: 'Add Contact' });
}

// Add a calendar event — shares event details so the user adds it to their calendar.
export async function addToCalendar(content: string): Promise<void> {
  const parsed = parseContentForTemplate('event', content);
  const title = parsed.eventTitle || 'Event';
  const shareText = [
    `Event: ${title}`,
    parsed.eventDate ? `When: ${parsed.eventDate}` : '',
    parsed.eventLocation ? `Where: ${parsed.eventLocation}` : '',
    parsed.eventDesc ? `Notes: ${parsed.eventDesc}` : '',
  ].filter(Boolean).join('\n');
  const { Share } = await import('react-native');
  await Share.share({ message: shareText, title: `Calendar: ${title}` });
}

// Open in Maps — Apple Maps on iOS (geo: scheme), Google Maps on Android.
export async function openInMaps(content: string): Promise<void> {
  const parsed = parseContentForTemplate('location', content);
  const lat = parsed.locLat || '0';
  const lon = parsed.locLon || '0';
  const url =
    Platform.OS === 'ios'
      ? `geo:${lat},${lon}`
      : `https://www.google.com/maps?q=${lat},${lon}`;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Error', `Could not open maps near ${lat}, ${lon}.`);
  }
}

// Route a context action by QR type
export async function runContextAction(
  qrType: QrDetectedType,
  content: string,
): Promise<void> {
  switch (qrType) {
    case 'wifi':
      await connectWifi(content);
      break;
    case 'vcard':
      await addContact(content);
      break;
    case 'event':
      await addToCalendar(content);
      break;
    case 'location':
      await openInMaps(content);
      break;
    default:
      // url / email / phone / sms / text / barcode — handled by the existing Open action
      break;
  }
}

// Returns the context action label to show for this type, or null if none applies.
export function contextActionLabel(qrType: QrDetectedType): string | null {
  switch (qrType) {
    case 'wifi':
      return 'Connect Wi-Fi';
    case 'vcard':
      return 'Add Contact';
    case 'event':
      return 'Add to Calendar';
    case 'location':
      return 'Open in Maps';
    default:
      return null;
  }
}
