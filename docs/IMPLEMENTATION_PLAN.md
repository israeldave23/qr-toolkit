# Implementation Plan — QR Toolkit

## Completed
- [x] Remove dead App.tsx
- [x] Remove jsqr dependency
- [x] Fix settings.tsx null-safety (opacity/pointerEvents guard)
- [x] Call migrateHistory() on app startup (_layout.tsx)
- [x] Consolidate AppSettings: remove genColors, keep qrGen only
- [x] detectType: handle bare URLs, BEGIN:VEVENT, ean13/ean8/upc_a heuristics
- [x] Expand barcode types (qr, ean13, ean8, upc_a, code128, code39 on Android; qr-only on iOS gallery)
- [x] Add camera error recovery (onMountError → retry + open settings)
- [x] Add permission permanently-denied path (canAskAgain === false)
- [x] Add expo-audio scan beep (beep.wav asset + playBeep in feedback.ts)
- [x] Continuous scan dedup (Set of last 20 contents)
- [x] Result screen: QR preview + Save Image for all sources (not just gen)
- [x] Result screen: redactSensitive for wifi content display
- [x] History: QR thumbnails, Reuse action (prefills /generate), redactSensitive
- [x] Settings: Open System Settings, Privacy Policy, fixed Rate App URLs, Share App description
- [x] AdMob test ID validation (banner/interstitial/rewarded, 60s cap)
- [x] Jest tests: 42 passing (qr.test, models.test, history.test)
- [x] Lint clean, typecheck clean

## Pre-release (owner action)
- [ ] Replace AdMob test app IDs in app.json with real IDs
- [ ] Replace UNITS in src/services/ads.tsx with real unit IDs
- [ ] Replace store URLs in settings.tsx with real App Store / Play Store links
- [ ] Replace Privacy Policy URL in settings.tsx with real URL
- [ ] Implement Remove Ads purchase (RevenueCat or expo-iap) — post-release
- [ ] Add UMP consent gate before adsReady() for EEA/UK users
- [ ] Run npx expo-doctor
- [ ] Dev build: bunx eas-cli build --profile development
- [ ] Manual test: all 9 templates, camera+gallery scan, history reuse/regen, dark/light theme
- [ ] Release: bunx eas-cli build --profile production + bunx eas-cli submit
