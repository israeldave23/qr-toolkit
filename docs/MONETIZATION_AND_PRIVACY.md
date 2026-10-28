# Monetization & Privacy — QR Toolkit

## Ad placements

| Type | Placement | Trigger | Floor / cap |
|---|---|---|---|
| Banner | History screen | screen mount, adsEnabled | — |
| Banner | Generate screen | screen mount, adsEnabled | — |
| Interstitial | Generate result (success) | `showInterstitialIfReady` | 60 s floor between fires |
| Rewarded | (future) service-only "Remove Ads" | IAP unlock | n/a |

Interstitial **never** fires during scanning. Banner **never** on Scan or Settings.

## Frequency caps

- Interstitial floor: 60 s minimum elapsed since last interstitial; enforced in `showInterstitialIfReady`.
- Banner: no cap (SDK-managed).

## Test ID swap checklist (pre-release)

- [ ] Replace AdMob test app IDs in `app.json` with real app IDs.
- [ ] Replace `UNITS` constant in `src/services/ads.tsx` with real banner/interstitial/rewarded unit IDs.
- [ ] Smoke test: banner renders on history + generate; interstitial fires on gen result; 60 s floor respected; scan screen ad-free.

## Consent

- UMP (User Messaging Platform) **not yet wired**. No consent gate before `adsReady()`.
- Blocker for EEA / UK launch: add UMP consent screen before first `adsReady()` call.

## Remove Ads

- Deferred post-release. Planned: RevenueCat or `expo-iap` subscription; unlocks by setting `adsEnabled=false` persistently.
- Rewarded ad service-only in current build; user-facing "Remove Ads" flow not present.

## Privacy claims

- **No PII to ad SDKs** — AdMob receives only hashed device IDs (SDK-managed), never QR content, Wi-Fi passwords, or user identifiers.
- **Wi-Fi passwords stored locally only** (AsyncStorage); no network send.
- **No telemetry** — no analytics SDK, no crash reporting, no PII beacon.
- **No accounts** — app is fully local; no auth, no cloud sync.
- **`redactSensitive`** masks Wi-Fi `P:` (password) field in **all** display contexts: result screen, history thumbnail, history detail, share intent preview.
- Privacy Policy link in settings (URL placeholder until pre-release swap).
