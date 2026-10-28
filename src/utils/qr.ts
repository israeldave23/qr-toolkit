import { type QrDetectedType } from '../models';

export function detectType(content: string): QrDetectedType {
  if (!content) return 'unknown';
  if (content.startsWith('http://') || content.startsWith('https://')) return 'url';
  if (content.startsWith('mailto:')) return 'email';
  if (content.startsWith('tel:')) return 'phone';
  if (content.startsWith('sms:')) return 'sms';
  if (content.startsWith('WiFi:') || content.startsWith('WIFI:')) return 'wifi';
  if (content.startsWith('BEGIN:VCARD')) return 'vcard';
  if (content.startsWith('geo:')) return 'location';
  if (content.startsWith('BEGIN:VEVENT') || content.startsWith('EVENT:BEGIN:VEVENT')) return 'event';
  // bare domain heuristic (no scheme)
  if (/^[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?$/.test(content)) return 'url';
  // EAN-13: 13 digits, starts with 977-988 (typical retail)
  if (/^97[7-8]\d{10}$/.test(content)) return 'ean13';
  // EAN-8: 8 digits
  if (/^\d{8}$/.test(content)) return 'ean8';
  // UPC-A: 12 digits
  if (/^\d{12}$/.test(content)) return 'upc_a';
  // Code 128 / Code 39: alphanumeric 1-D bars (high-density, no whitespace, no URL/scheme).
  // Camera already returns rawType for these; detectType is used for non-camera paths
  // (e.g. gallery scan, reuse flows) where rawType is not available.
  // Whitespace is excluded: natural-language text almost always contains spaces,
  // while dense alphanumerics (license plates, IDs, part numbers) usually do not.
  if (/^[A-Za-z0-9\-._~+/]+$/.test(content) && content.length > 8 &&
      /[A-Za-z]/.test(content) && !content.includes('://') &&
      !/^[a-z]+:/.test(content)) {
    return 'code128';
  }
  return 'text';
}

export const TYPE_LABELS: Record<QrDetectedType, string> = {
  url: 'Website',
  text: 'Text',
  email: 'Email',
  phone: 'Phone',
  sms: 'SMS',
  wifi: 'Wi-Fi',
  vcard: 'Contact',
  location: 'Location',
  event: 'Event',
  ean13: 'EAN-13',
  ean8: 'EAN-8',
  upc_a: 'UPC-A',
  code128: 'Code 128',
  code39: 'Code 39',
  unknown: 'Code',
};

export type TemplateType =
  | 'text'
  | 'url'
  | 'email'
  | 'phone'
  | 'sms'
  | 'wifi'
  | 'vcard'
  | 'location'
  | 'event';

export const TEMPLATES: { id: TemplateType; label: string }[] = [
  { id: 'text', label: 'Text' },
  { id: 'url', label: 'URL' },
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Phone' },
  { id: 'sms', label: 'SMS' },
  { id: 'wifi', label: 'Wi-Fi' },
  { id: 'vcard', label: 'vCard' },
  { id: 'location', label: 'Location' },
  { id: 'event', label: 'Event' },
];

export function buildContent(type: TemplateType, values: Record<string, string>): string {
  switch (type) {
    case 'url':
      return values.url?.startsWith('http') ? values.url! : `https://${values.url || ''}`;
    case 'email':
      return `mailto:${values.email || ''}`;
    case 'phone':
      return `tel:${values.phone || ''}`;
    case 'sms':
      // sms:1234567890?body=Hello — the body is included so the compose window
      // opens with a pre-filled message (mobile platforms support ?body=).
      return values.smsBody
        ? `sms:${values.sms || ''}?body=${values.smsBody}`
        : `sms:${values.sms || ''}`;
    case 'wifi': {
      const ssid = values.wifiSSID || '';
      const pwd = values.wifiPassword || '';
      const hasPwd = pwd.length > 0;
      const t = hasPwd ? 'WPA' : 'nopass';
      return `WIFI:T:${t};S:${ssid}${hasPwd ? `;P:${pwd}` : ''};;`;
    }
    case 'vcard':
      return `BEGIN:VCARD\nVERSION:3.0\nN:${values.vcardName || ''}\nFN:${values.vcardName || ''}\nTEL:${values.vcardPhone || ''}\nEMAIL:${values.vcardEmail || ''}\nEND:VCARD`;
    case 'location':
      return `geo:${values.locLat || '0'},${values.locLon || '0'}`;
    case 'event':
      return `EVENT:BEGIN:VEVENT\nSUMMARY:${values.eventTitle || ''}\nDESCRIPTION:${values.eventDesc || ''}\nLOCATION:${values.eventLocation || ''}\nDTSTART:${values.eventDate || ''}\nEND:VEVENT`;
    default:
      return values.text || '';
  }
}

export function getTemplateFields(type: TemplateType): string[] {
  switch (type) {
    case 'url': return ['url'];
    case 'email': return ['email'];
    case 'phone': return ['phone'];
    case 'sms': return ['sms', 'smsBody'];
    case 'wifi': return ['wifiSSID', 'wifiPassword'];
    case 'vcard': return ['vcardName', 'vcardPhone', 'vcardEmail'];
    case 'location': return ['locLat', 'locLon'];
    case 'event': return ['eventTitle', 'eventDate', 'eventLocation', 'eventDesc'];
    default: return ['text'];
  }
}

/**
 * Parse stored QR content back into template field values for the generator.
 * Used by `reuseItem` so reusing any history entry pre-fills the correct fields.
 */
export function parseContentForTemplate(
  type: TemplateType,
  content: string,
): Record<string, string> {
  switch (type) {
    case 'url': {
      const m = content.match(/^https?:\/\/(.*)$/);
      return { url: m ? m[1] : content.replace(/^https?:\/\//, '') };
    }
    case 'email':
      return { email: content.replace(/^mailto:/, '') };
    case 'phone':
      return { phone: content.replace(/^tel:/, '') };
    case 'sms': {
      const m = content.match(/^sms:([^?]*)\?body=(.*)$/);
      if (m) return { sms: m[1], smsBody: m[2] };
      return { sms: content.replace(/^sms:/, ''), smsBody: '' };
    }
    case 'wifi': {
      const m = content.match(/^WIFI:T:(\w+);S:([^;]*)(;P:([^;]*))?;;?$/);
      if (!m) return { wifiSSID: '', wifiPassword: '' };
      return {
        wifiSSID: m[2] ?? '',
        wifiPassword: m[4] ?? '',
      };
    }
    case 'vcard': {
      const lines = content.split('\n');
      const grab = (key: string) => {
        const l = lines.find((x) => x.startsWith(`${key}:`));
        return l ? l.slice(key.length + 1) : '';
      };
      return {
        vcardName: grab('FN'),
        vcardPhone: grab('TEL'),
        vcardEmail: grab('EMAIL'),
      };
    }
    case 'location': {
      const m = content.match(/^geo:([^,]+),(.+)$/);
      if (!m) return { locLat: '', locLon: '' };
      return { locLat: m[1], locLon: m[2] };
    }
    case 'event': {
      const lines = content.replace(/^EVENT:/, '').split('\n');
      const grab = (key: string) => {
        const l = lines.find((x) => x.startsWith(`${key}:`));
        return l ? l.slice(key.length + 1) : '';
      };
      return {
        eventTitle: grab('SUMMARY'),
        eventDate: grab('DTSTART'),
        eventLocation: grab('LOCATION'),
        eventDesc: grab('DESCRIPTION'),
      };
    }
    default:
      return { text: content };
  }
}
