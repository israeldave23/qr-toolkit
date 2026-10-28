# Integrations — QR Toolkit

Package versions, permissions, build requirements, ad placements, and privacy notes.

## Environment

| Item | Value |
|---|---|
| Expo SDK | 58 (`~58.0.19`) |
| React Native | 0.88.0 |
| New Architecture | required by `react-native-google-mobile-ads` v17 |
| Navigation | Expo Router |
| Build type | Managed (CNG) — no `ios/` or `android/` folders |
| Language | TypeScript (strict) |

## Device integration packages

| Package | Version | Dev build? | Notes |
|---|---|---|---|
| `expo-camera` | `~58.0.12` | No | `CameraView`, `scanFromURLAsync`, `enableTorch` |
| `expo-image-picker` | `~58.0.10` | No | Gallery selection for image QR scanning |
| `expo-media-library` | `~58.0.12` | No | Save generated QR PNG to photo library |
| `expo-file-system` | `~58.0.11` | No | `File` / `Paths.cache` for temp PNG writes |
| `expo-sharing` | `~58.0.20` | No | Share QR image via system share sheet |
| `expo-clipboard` | `~58.0.4` | No | `setStringAsync` / `getStringAsync` |
| `expo-haptics` | `~58.0.7` | No | Scan + action feedback (`hapticScan`, `hapticSuccess`, etc.) |
| `@react-native-async-storage/async-storage` | `2.2.0` | No | History, favorites, settings |
| `react-native-qrcode-svg` | `^6.3.34` | No | QR generation; `ecl` prop for error-correction level |
| `react-native-svg` | `15.16.0` | No | `svgRef.toDataURL` for PNG export |
| `jsqr` | `^1.4.0` | No | Fallback decoder (not currently wired; unused import in some paths) |

### Haptics

`src/services/feedback.ts` wraps `expo-haptics`. Flag is driven by `AppSettings.scanner.hapticsEnabled`
and synced via `useSettings`. The `soundEnabled` toggle exists in settings but **no audio module is
installed** — the toggle currently has no effect. Add a beep (e.g. `expo-av`) when a sound
requirement is confirmed.

### Wi-Fi / vCard payload handling

Wi-Fi passwords and contact (vCard) payloads are stored in AsyncStorage history. The QR payload is
required for regeneration, so it is kept intact by default. `redactSensitive()` in
`src/services/history.ts` returns a masked Wi-Fi payload (`P:****`) for display contexts. Never pass
raw history content to ad SDKs, analytics, or crash-reporting loggers.

### Schema versioning

`STORAGE_VERSION = 1` in `src/models/index.ts`. `migrateHistory()` in `src/services/history.ts` runs
ordered, idempotent migrations stored in `qr_storage_meta_v1`. Call `migrateHistory()` on app startup
(`_layout.tsx`) before reading history.

## AdMob (`react-native-google-mobile-ads`)

| Item | Value |
|---|---|
| Package | `^17.4.0` |
| Config plugin | `react-native-google-mobile-ads` in `app.json` |
| Test app IDs | Android `ca-app-pub-3940286549654080~3347511713` / iOS `ca-app-pub-3940286549654080~1458002511` (Google test IDs — safe in dev) |
| Dev build required | **Yes** — does not run in Expo Go |
| `expo-dev-client` | `~58.0.15` (installed) |

### Placements

| Format | Where | Frequency cap | Gate |
|---|---|---|---|
| Banner (`LARGE_ANCHORED_ADAPTIVE_BANNER`) | Bottom of History screen | none (anchored) | `adsEnabled` setting |
| Banner (`LARGE_ANCHORED_ADAPTIVE_BANNER`) | Bottom of Create screen | none (anchored) | `adsEnabled` setting |
| Interstitial | On mount of Result screen when `source === 'gen'` | 60 s floor | `adsEnabled` + cap |
| Rewarded | Optional future unlock (not yet wired to UI) | n/a | `adsEnabled` |

### Service

`src/services/ads.tsx` — all ad logic isolated here. UI screens import only
`BannerAdComponent`, `useAdsEnabled`, and `showInterstitialIfReady`.

- `mobileAds().initialize()` is called lazily via `adsReady()`; failures are swallowed (ads simply
  don't load).
- `TestIds.ADAPTIVE_BANNER` / `INTERSTITIAL` / `REWARDED` are used in `__DEV__`.
- **Swap to real `ca-app-pub-…` unit IDs before production release.** Update the `androidAppId` /
  `iosAppId` in `app.json` to your AdMob app IDs at the same time.

### Production checklist

1. Create AdMob app + ad units; replace test app IDs in `app.json` (`androidAppId` / `iosAppId`).
2. Replace `UNITS.banner` / `UNITS.interstitial` / `UNITS.rewarded` in `src/services/ads.tsx` with
   real unit IDs.
3. Register physical test devices: copy the hashed device ID from logcat/Xcode console into
   `testDeviceIdentifiers` in the AdMob dashboard.
4. Build a development build: `npx expo run:ios` / `npx expo run:android` or `eas build --profile development`.
5. Verify ads load on device before shipping.

### Consent (EU/UK/GDPR)

Not yet wired. Before enabling UMP consent, gather consent **before** `mobileAds().initialize()`.
The AdMob config plugin's `userTrackingUsageDescription` sets `NSUserTrackingUsageDescription` for
iOS. Add a consent screen (UMP) and gate `adsReady()` on it for EEA/UK users before release.

## Remove Ads purchase

Not implemented. The `adsEnabled` field in `AppSettings` (default `true`) is the mechanism a
purchase flow would flip to `false`. Do **not** ship a fake button that reports success without a
real purchase. Plan: `react-native-purchases` (RevenueCat) or `expo-iap` + server-side receipt
validation. Requires a dev build.

## Permissions

| Permission | Platform | String |
|---|---|---|
| Camera | iOS + Android | "Allow QR Toolkit to use camera to scan QR codes." |
| Photo library (read) | iOS + Android | "Allow QR Toolkit to access photos to scan QR codes." |
| Photo library (write) | iOS + Android | "Allow QR Toolkit to save QR codes to your photo library." |
| User tracking (ATT) | iOS | "Used to show personalized ads." (set by AdMob plugin) |

## Build & release

```bash
# Development build (required for AdMob)
npx expo run:ios        # or npx expo run:android
# or cloud:
bunx eas-cli build --profile development

# OTA (JS-only changes, no native changes)
bunx eas-cli update

# Store release
bunx eas-cli build --profile production
bunx eas-cli submit
```

After changing the AdMob config plugin or adding native deps: rebuild the dev client.

## Privacy notes

- No PII, tokens, Wi-Fi passwords, or scan payloads are sent to AdMob or any analytics SDK.
- Ad SDKs may collect device ID, app usage, and IP address for ad targeting — disclose in the
  Data Safety form (Google Play) and Privacy Nutrition Labels (Apple).
- `expo-clipboard` reads/writes user text only when the user triggers Copy — no background clipboard
  access.
- Child-directed apps: enable child-directed treatment in AdMob if the audience includes minors.

## What was not tested on a real device

- AdMob banner/interstitial/rewarded loading (requires dev build + network + AdMob account)
- Haptics on iOS/Android (requires physical device; simulators have no haptic hardware on Android)
- QR image share sheet (`expo-sharing` on Android; `UIActivityViewController` on iOS)

Test all of the above on a physical device with a development build before release.
