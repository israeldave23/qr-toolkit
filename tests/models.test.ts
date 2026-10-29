import { DEFAULT_SETTINGS, QRGEN_DEFAULTS, STORAGE_VERSION, type AppSettings } from '../src/models';

describe('models', () => {
  it('DEFAULT_SETTINGS has correct shape', () => {
    const s = DEFAULT_SETTINGS as AppSettings;
    expect(s.theme).toBe('system');
    expect(s.scanner.soundEnabled).toBe(true);
    expect(s.scanner.hapticsEnabled).toBe(true);
    expect(s.scanner.continuousScan).toBe(false);
    expect(s.qrGen.fg).toBe('#000000');
    expect(s.qrGen.bg).toBe('#FFFFFF');
    expect(s.qrGen.errorCorrection).toBe('M');
    expect(s.qrGen.size).toBe(180);
    expect(s.adsEnabled).toBe(true);
  });

  it('genColors field removed (no longer present)', () => {
    expect((DEFAULT_SETTINGS as any).genColors).toBeUndefined();
  });

  it('QRGEN_DEFAULTS values', () => {
    expect(QRGEN_DEFAULTS.fg).toBe('#000000');
    expect(QRGEN_DEFAULTS.bg).toBe('#FFFFFF');
    expect(QRGEN_DEFAULTS.errorCorrection).toBe('M');
    expect(QRGEN_DEFAULTS.size).toBe(180);
  });

  it('STORAGE_VERSION is 2', () => {
    expect(STORAGE_VERSION).toBe(2);
  });
});
