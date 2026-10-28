import { type QrDetectedType } from '../models';

export function detectType(content: string): QrDetectedType {
  if (!content) return 'unknown';
  if (content.startsWith('http://') || content.startsWith('https://')) return 'url';
  if (content.startsWith('mailto:')) return 'email';
  if (content.startsWith('tel:')) return 'phone';
  if (content.startsWith('sms:')) return 'sms';
  if (content.startsWith('WiFi:')) return 'wifi';
  if (content.startsWith('BEGIN:VCARD')) return 'vcard';
  if (content.startsWith('geo:')) return 'location';
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
      return `sms:${values.sms || ''}`;
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
    case 'sms': return ['sms'];
    case 'wifi': return ['wifiSSID', 'wifiPassword'];
    case 'vcard': return ['vcardName', 'vcardPhone', 'vcardEmail'];
    case 'location': return ['locLat', 'locLon'];
    case 'event': return ['eventTitle', 'eventDate', 'eventLocation', 'eventDesc'];
    default: return ['text'];
  }
}
