# User Flows — QR Toolkit

## Scan flow

```
entry (camera or gallery)
  └─ camera permission
      ├─ granted ──► scan (continuous + one-shot)
      │               ├─ success ──► result screen
      │               ├─ onMountError ──► retry + open settings
      │               └─ continuous: dedup Set of last 20 contents
      ├─ denied (canAskAgain) ──► retry prompt
      └─ permanently denied ──► open system settings CTA

  └─ gallery pick
      ├─ iOS ──► QR only
      └─ Android ──► qr, ean13, ean8, upc_a, code128, code39
```

## Generate flow

Templates (9):
1. URL
2. Plain text
3. Email (mailto)
4. Phone
5. SMS
6. Wi-Fi (SSID / password / encryption / hidden)
7. vCard (name, phone, email, url, note)
8. Event (BEGIN:VEVENT: location, start, end, description)
9. Barcode content (EAN/UPC/Code128/Code39 numeric)

Validation rules per template:
- URL: `new URL()` parse + http/https protocol check.
- Email: local/regexp check; body optional.
- Phone/SMS: digits + optional `+` prefix; SMS body optional.
- Wi-Fi: SSID required; password required unless open; hidden flag toggle.
- vCard: at least one of name / phone / email; BEGIN/END structure.
- Event: start + end required; end > start; location/description optional.
- Barcode: numeric; ean8 length 8, ean13 length 13, upc_a length 12, code128/code39 alphanumeric ≤ 48.
- Plain text / URL: length caps.

Flow: input → validate → render QR → result (Save Image / Share / Copy) → history write.

## History flow

```
list (search + filter by source/type)
  ├─ tap entry ──► detail (QR thumbnail, content, redactSensitive mask)
  │                ├─ Reuse ──► prefill /generate
  │                ├─ Regenerate ──► fresh image, history write
  │                └─ Delete ──► single remove
  └─ Clear All (from settings, with confirm)
```

## Settings flow

```
settings screen (opacity/pointerEvents guard when null)
  ├─ theme: dark / light / system
  ├─ scanner prefs: continuous scan, sound, haptics toggles
  ├─ Clear history (confirm dialog)
  ├─ Open System Settings (link)
  ├─ Privacy Policy (link)
  └─ Rate App / Share App (fixed URLs + description)
```

## Ads flow

Interstitial — shown **only** on generate result success:
- 60 s floor between interstitials (never more frequent than one / 60 s).
- **Never** shown during scanning (camera up).
- Skipped when ads disabled in settings.

Banner:
- Shown on **History** and **Generate** screens only.
- Not shown on Scan (camera) or Settings.

Rewarded (future, service-only):
- Not shown to user in current build; reserved for "Remove Ads" IAP post-release.
