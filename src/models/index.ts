export type QrTemplateType =
  | 'text'
  | 'url'
  | 'email'
  | 'phone'
  | 'sms'
  | 'wifi'
  | 'vcard'
  | 'location'
  | 'event';

export type QrSourceType = 'scan' | 'gen';

export type QrDetectedType =
  | 'url'
  | 'text'
  | 'email'
  | 'phone'
  | 'sms'
  | 'wifi'
  | 'vcard'
  | 'location'
  | 'event'
  | 'ean13'
  | 'ean8'
  | 'upc_a'
  | 'code128'
  | 'code39'
  | 'unknown';

export interface QrPayload {
  id: string;
  content: string;
  source: QrSourceType;
  detectedType: QrDetectedType;
  createdAt: number;
}

export type ScanRecord = Omit<QrPayload, 'source'> & { source: 'scan' };

export type GeneratedQrRecord = Omit<QrPayload, 'source'> & { source: 'gen' };

export interface FavoriteRecord {
  itemId: string;
  addedAt: number;
}

export type ThemePreference = 'light' | 'dark' | 'system';

export type QrErrorCorrection = 'L' | 'M' | 'Q' | 'H';

export interface ScannerPreferences {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  continuousScan: boolean;
}

export interface QrGenPreferences {
  fg: string;
  bg: string;
  errorCorrection: QrErrorCorrection;
  size: number;
  logo: string | null;
  border: 0 | 1 | 2 | 3;
}

export interface AppSettings {
  theme: ThemePreference;
  scanner: ScannerPreferences;
  qrGen: QrGenPreferences;
  adsEnabled: boolean;
}

export const QRGEN_DEFAULTS: QrGenPreferences = {
  fg: '#000000',
  bg: '#FFFFFF',
  errorCorrection: 'M',
  size: 180,
  logo: null,
  border: 0,
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  scanner: {
    soundEnabled: true,
    hapticsEnabled: true,
    continuousScan: false,
  },
  qrGen: QRGEN_DEFAULTS,
  adsEnabled: true,
};

export const STORAGE_VERSION = 2;

export type StorageSchema = {
  version: number;
  history: QrPayload[];
  favorites: string[];
  settings: AppSettings;
};
