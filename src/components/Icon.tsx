import Svg, { Path } from 'react-native-svg';

type IconName = 'home' | 'scan-line' | 'plus-circle' | 'clock' | 'history' | 'chevron-right' | 'trash' | 'heart' | 'share' | 'copy' | 'external-link' | 'moon' | 'sun' | 'device-phone' | 'wifi' | 'mail' | 'map-pin' | 'calendar';

const ICONS: Record<IconName, { d: string; viewBox?: string }> = {
  home: {
    viewBox: '0 0 24 24',
    d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z',
  },
  'scan-line': {
    viewBox: '0 0 24 24',
    d: 'M12 4v1m6 1v1M4.42 4.42l.71.71M18.87 4.42l-.71.71M3 9h1m16 0h1M4.42 19.58l.71-.71M18.87 19.58l-.71-.71M12 19v1M8 3v1m8 0v1M8 9H7a2 2 0 00-2 2v8a2 2 0 002 2h10a2 2 0 002-2v-8a2 2 0 00-2-2h-1',
  },
  'plus-circle': {
    viewBox: '0 0 24 24',
    d: 'M12 4v16m8-8H4',
  },
  clock: {
    viewBox: '0 0 24 24',
    d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  history: {
    viewBox: '0 0 24 24',
    d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  'chevron-right': {
    viewBox: '0 0 24 24',
    d: 'M9 5l7 7-7 7',
  },
  trash: {
    viewBox: '0 0 24 24',
    d: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  },
  heart: {
    viewBox: '0 0 24 24',
    d: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
  },
  share: {
    viewBox: '0 0 24 24',
    d: 'M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13',
  },
  copy: {
    viewBox: '0 0 24 24',
    d: 'M8 4H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2v-2M16 4h2a2 2 0 012 2v4M10 14l4-4-4-4',
  },
  'external-link': {
    viewBox: '0 0 24 24',
    d: 'M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3',
  },
  moon: {
    viewBox: '0 0 24 24',
    d: 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z',
  },
  sun: {
    viewBox: '0 0 24 24',
    d: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M12 5a7 7 0 100 14 7 7 0 000-14z',
  },
  'device-phone': {
    viewBox: '0 0 24 24',
    d: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M12 18h.01',
  },
  wifi: {
    viewBox: '0 0 24 24',
    d: 'M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01',
  },
  mail: {
    viewBox: '0 0 24 24',
    d: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6',
  },
  'map-pin': {
    viewBox: '0 0 24 24',
    d: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 7a3 3 0 100 6 3 3 0 000-6z',
  },
  calendar: {
    viewBox: '0 0 24 24',
    d: 'M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18',
  },
};

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 24, color = '#000' }: IconProps) {
  const icon = ICONS[name];
  if (!icon) return null;
  return (
    <Svg width={size} height={size} viewBox={icon.viewBox}>
      <Path d={icon.d} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}
