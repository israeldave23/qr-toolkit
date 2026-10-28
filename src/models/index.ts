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
}

export interface AppSettings {
  theme: ThemePreference;
  scanner: ScannerPreferences;
  genColors: { fg: string; bg: string };
  qrGen: QrGenPreferences;
  adsEnabled: boolean;
}

export const QRGEN_DEFAULTS: QrGenPreferences = {
  fg: '#000000',
  bg: '#FFFFFF',
  errorCorrection: 'M',
  size: 180,
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  scanner: {
    soundEnabled: true,
    hapticsEnabled: true,
    continuousScan: false,
  },
  genColors: { fg: '#000000', bg: '#FFFFFF' },
  qrGen: QRGEN_DEFAULTS,
  adsEnabled: true,
};

export const STORAGE_VERSION = 1;

export type StorageSchema = {
  version: number;
  history: QrPayload[];
  favorites: string[];
  settings: AppSettings;
};
