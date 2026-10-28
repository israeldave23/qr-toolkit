import { useEffect, useState } from 'react';
import {
  MobileAds as mobileAds,
  BannerAd,
  BannerAdSize,
  InterstitialAd,
  RewardedAd,
  AdEventType,
  RewardedAdEventType,
  AdsConsent,
  type RewardedAdReward,
  TestIds,
} from 'react-native-google-mobile-ads';
import { loadSettings, persistSettings } from './settings';

// Interstitial/banner: real production IDs. Rewarded: no rewarded unit provided — keep test ID.
const UNITS = {
  banner: 'ca-app-pub-5236559514557783/2973447927',
  interstitial: 'ca-app-pub-5236559514557783/2861555255',
  rewarded: TestIds.REWARDED,
};

// ---------------------------------------------------------------------------
// UMP consent gate — GDPR / EEA / UK compliance.
// The UMP form is shown (if required by the user's region) BEFORE ad SDK init.
// For users outside regulated regions AdsConsent completes instantly without
// showing any UI, so there is no UX impact for most users.
// ---------------------------------------------------------------------------
let consentPromise: Promise<void> | null = null;

function ensureConsent(): Promise<void> {
  if (!consentPromise) {
    consentPromise = AdsConsent.gatherConsent()
      .then((info) => {
        if (info?.isConsentFormAvailable) {
          console.warn('[ads] UMP consent form shown to user');
        }
      })
      .catch(() => {
        // On any consent error proceed with init — for regulated users without
        // consent, AdMob will simply not serve ads.
      });
  }
  return consentPromise;
}

let sdkReady: Promise<void> | null = null;

export function adsReady(): Promise<void> {
  if (!sdkReady) {
    // Gate SDK init behind consent — required for EEA/UK GDPR compliance.
    sdkReady = ensureConsent().then(
      () => mobileAds().initialize().then(() => undefined).catch(() => {}),
    );
  }
  return sdkReady;
}

export const bannerUnitId = UNITS.banner;

export function BannerAdComponent({ onError }: { onError?: () => void }) {
  useEffect(() => {
    adsReady();
  }, []);
  return (
    <BannerAd
      unitId={bannerUnitId}
      size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
      onAdFailedToLoad={(err) => {
        console.warn('[ads] banner no-fill/error:', err.message);
        onError?.();
      }}
    />
  );
}

// Interstitial — preload + show at natural transitions, 60s floor.
let interstitial: InterstitialAd | null = null;
let lastInterstitialShown = 0;
const INTERSTITIAL_MIN_INTERVAL_MS = 60_000;

export function canShowInterstitial(): boolean {
  return Date.now() - lastInterstitialShown >= INTERSTITIAL_MIN_INTERVAL_MS;
}

function getInterstitial(): InterstitialAd {
  if (!interstitial) {
    interstitial = InterstitialAd.createForAdRequest(UNITS.interstitial);
    interstitial.addAdEventListener(AdEventType.LOADED, () => {});
    interstitial.addAdEventListener(AdEventType.CLOSED, () => interstitial?.load());
    interstitial.addAdEventListener(AdEventType.ERROR, (err) => {
      console.warn('[ads] interstitial error:', err.message);
      interstitial?.load();
    });
    interstitial.load();
  }
  return interstitial;
}

export async function showInterstitialIfReady(): Promise<boolean> {
  if (!canShowInterstitial()) return false;
  await adsReady();
  const ad = getInterstitial();
  if (!ad.loaded) return false;
  lastInterstitialShown = Date.now();
  try {
    await ad.show();
    return true;
  } catch {
    return false;
  }
}

// Rewarded — grant the reward only from EARNED_REWARD, never from show() resolving.
let rewarded: RewardedAd | null = null;

function getRewarded(): RewardedAd {
  if (!rewarded) {
    rewarded = RewardedAd.createForAdRequest(UNITS.rewarded);
    rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {});
    rewarded.addAdEventListener(AdEventType.CLOSED, () => rewarded?.load());
    rewarded.addAdEventListener(AdEventType.ERROR, (err) => {
      console.warn('[ads] rewarded error:', err.message);
      rewarded?.load();
    });
    rewarded.load();
  }
  return rewarded;
}

export interface RewardedResult {
  completed: boolean;
  reward: RewardedAdReward | null;
}

export function presentRewardedAd(onReward: (r: RewardedAdReward) => void): Promise<void> {
  return adsReady().then(() => {
    const ad = getRewarded();
    ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (r) => onReward(r));
    return ad.show().catch(() => {});
  });
}

// Ads on/off — persisted so a "Remove Ads" purchase (future) can flip it.
export function useAdsEnabled(): [boolean, () => void] {
  const [enabled, setEnabled] = useState(true);
  useEffect(() => {
    loadSettings().then((s) => setEnabled(s.adsEnabled));
  }, []);
  const disable = () => {
    loadSettings().then((s) => {
      persistSettings({ ...s, adsEnabled: false });
      setEnabled(false);
    });
  };
  return [enabled, disable];
}
