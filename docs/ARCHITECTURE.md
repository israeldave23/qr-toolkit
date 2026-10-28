# Architecture — QR Toolkit

## Module boundaries

### `services/`
- `history.ts` — AsyncStorage CRUD + `migrateHistory()` + dedup helpers.
- `settings.ts` — AsyncStorage persist + `AppSettings` type (genColors removed; keep `qrGen`).
- `share.ts` — Share API for QR image + content.
- `feedback.ts` — Haptics + `expo-audio` beep (see below).
- `ads.tsx` — AdMob isolated: `BannerAdComponent`, `useAdsEnabled`, `showInterstitialIfReady`.

### `utils/`
- `qr.ts` — QR render + content type detection (`detectType`): bare URL, `BEGIN:VEVENT`, ean13/ean8/upc_a heuristics, plain-text fallback.
- `qrcache.ts` — QR image caching keyed by content hash.

### `hooks/`
- `useTheme.ts` — dark / light / system resolve.
- `useSettings.ts` — load + subscribe to settings changes.

### `components/`
All theme-aware, no known bugs:
- `Button`, `Input`, `Icon`, `Badge`, `Chip`, `EmptyState`.

## Data flow

```
UI → service → AsyncStorage
```

- Settings: `useSettings` reads once, subscribes to writes; screen applies opacity/pointerEvents guard on null.
- History: `services/history.ts` owns writes; screens read via hooks; `migrateHistory()` called on app startup in `_layout.tsx`.

## QR payload untrusted

All "Open" actions (URL, email, phone, sms) on QR result go through a confirm `Alert` before handoff. Raw payload is never auto-opened.

## Settings null-state guard

`settings.tsx` (the screen) wraps content in opacity + pointerEvents guard when `useSettings()` returns null. Prevents render crash on first launch.

## AdMob isolation

`src/services/ads.tsx` is the **only** module that touches AdMob. Screens import:
- `BannerAdComponent` (presentational wrapper)
- `useAdsEnabled` (boolean gate)
- `showInterstitialIfReady` (one-shot interstitial on gen result, 60 s floor)

No other file may import `@react-native-ads/*` or AdMob config.

## expo-audio beep

- Module init in `src/services/feedback.ts`:
  ```ts
  const player = createAudioPlayer(require('../assets/sound/beep.wav'));
  ```
  Asset eager-loaded; `Audio.preload` equivalent baked into the constructor.
- `playBeep()` calls `player.seekTo(0)` then `player.play()`.
- Guarded by `soundOn` flag in settings; no-op when off.
- 880 Hz, ~150 ms square-wave beep; no network fetch.

## History dedup

`scan.tsx` maintains a `Set` of the last 20 decoded contents; duplicate result within window is suppressed (no re-fire, no beep).
