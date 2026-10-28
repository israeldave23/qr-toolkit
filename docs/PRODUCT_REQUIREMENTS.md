# Product Requirements — QR Toolkit

## Feature list

- **Scan** — camera capture (continuous + one-shot), gallery import (QR on iOS; all barcode types on Android), permission-denied + camera-error recovery paths, scan beep.
- **Generate** — 9 content templates, validation rules per template, QR image render, Save Image, Share.
- **History** — local store of scanned + generated entries, search / filter / reuse / regenerate / delete, QR thumbnails, redactSensitive on display.
- **Settings** — theme (dark/light/system), scanner prefs (continuous scan, sound, haptics), clear history, open system settings, privacy policy, rate app, share app.

## User personas

- **Consumer scanner** — scans products, URLs, Wi-Fi, contact cards from camera or gallery; needs instant result + Save/Share; rarely generates.
- **Business generator** — creates QR codes for marketing, events, internal links; needs all 9 templates, reliable validation, image export, reuse from history.

## Acceptance criteria per screen

### Scan
- Camera opens with permission; on denial → recoverable CTA to open system settings.
- Continuous scan mode deduplicates (Set of last 20 contents).
- Camera mount error → retry + open settings CTA.
- Result screen shows decoded content + type badge; QR preview + Save Image available for all sources.
- Wi-Fi content: `password` field masked in display (`redactSensitive`).

### Generate
- All 9 templates render and validate their inputs.
- Invalid input → inline error, no image.
- Valid input → QR image, type label, Save Image, Share actions.
- Generated entry written to history.

### History
- Search by content substring; filter by source (scan / generate) and type.
- Reuse → prefill `/generate` with stored payload.
- Regenerate → produce fresh image for same payload.
- Delete single entry; Clear All in settings.
- Wi-Fi entries masked on thumbnail + detail.

### Settings
- Theme toggle persists; opacity / pointerEvents guard when settings null.
- Scanner prefs: continuous scan, sound, haptics toggles.
- Clear history CTA with confirm.
- Open System Settings link, Privacy Policy link, Rate App (fixed store URLs), Share App (fixed description).

## Permission table

| Permission | Used | When | Denial recovery |
|---|---|---|---|
| Camera | Scan screen | user taps Scan | denied → permanent → open system settings |
| Photo/Video read | Gallery scan | user picks image | denied → retry / open settings |
| Photo/Video write | Save QR image | Save Image CTA | denied → share fallback |
| User tracking (no) | — | never requested | n/a — no PII, no analytics |

## Privacy claims

- No user account, no telemetry, no PII sent to ad SDKs.
- Wi-Fi passwords stored locally only (AsyncStorage); masked on all display contexts via `redactSensitive`.
- Ad SDK (AdMob) receives no app-content PII.
- UMP consent gate not yet wired (EEA/UK).
