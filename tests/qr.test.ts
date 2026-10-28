import { buildContent, detectType, getTemplateFields, TEMPLATES } from '../src/utils/qr';

describe('buildContent', () => {
  it('url — prepends https:// when missing', () => {
    expect(buildContent('url', { url: 'example.com' })).toBe('https://example.com');
  });

  it('url — keeps existing scheme', () => {
    expect(buildContent('url', { url: 'http://example.com' })).toBe('http://example.com');
  });

  it('email', () => {
    expect(buildContent('email', { email: 'a@b.com' })).toBe('mailto:a@b.com');
  });

  it('phone', () => {
    expect(buildContent('phone', { phone: '+123' })).toBe('tel:+123');
  });

  it('sms', () => {
    expect(buildContent('sms', { sms: '+123' })).toBe('sms:+123');
  });

  it('wifi with password', () => {
    expect(buildContent('wifi', { wifiSSID: 'MyNet', wifiPassword: 'pw' })).toBe(
      'WIFI:T:WPA;S:MyNet;P:pw;;'
    );
  });

  it('wifi without password', () => {
    expect(buildContent('wifi', { wifiSSID: 'Open' })).toBe('WIFI:T:nopass;S:Open;;');
  });

  it('vcard', () => {
    const out = buildContent('vcard', { vcardName: 'J', vcardPhone: '1', vcardEmail: 'e@x' });
    expect(out).toContain('BEGIN:VCARD');
    expect(out).toContain('FN:J');
    expect(out).toContain('TEL:1');
    expect(out).toContain('END:VCARD');
  });

  it('location', () => {
    expect(buildContent('location', { locLat: '40.7', locLon: '-74.0' })).toBe(
      'geo:40.7,-74.0'
    );
  });

  it('event', () => {
    const out = buildContent('event', { eventTitle: 'T', eventDate: '20250101', eventLocation: 'L', eventDesc: 'D' });
    expect(out).toContain('BEGIN:VEVENT');
    expect(out).toContain('SUMMARY:T');
    expect(out).toContain('END:VEVENT');
  });

  it('text passthrough', () => {
    expect(buildContent('text', { text: 'hello' })).toBe('hello');
  });

  it('empty values produce empty/fallback', () => {
    expect(buildContent('text', {})).toBe('');
    expect(buildContent('email', {})).toBe('mailto:');
  });
});

describe('detectType', () => {
  it('http/https → url', () => {
    expect(detectType('http://x.com')).toBe('url');
    expect(detectType('https://x.com')).toBe('url');
  });

  it('bare domain → url', () => {
    expect(detectType('example.com')).toBe('url');
    expect(detectType('example.com:8080/path')).toBe('url');
  });

  it('mailto → email', () => expect(detectType('mailto:a@b.com')).toBe('email'));
  it('tel → phone', () => expect(detectType('tel:+123')).toBe('phone'));
  it('sms → sms', () => expect(detectType('sms:+123')).toBe('sms'));

  it('WiFi: → wifi', () => expect(detectType('WIFI:T:WPA;S:x;P:y;;')).toBe('wifi'));
  it('wifi lowercase prefix also matches', () =>
    expect(detectType('WIFI:T:nopass;S:x;;')).toBe('wifi'));

  it('BEGIN:VCARD → vcard', () => expect(detectType('BEGIN:VCARD\nVERSION:3.0\nEND:VCARD')).toBe('vcard'));
  it('geo: → location', () => expect(detectType('geo:40.7,-74.0')).toBe('location'));
  it('BEGIN:VEVENT → event', () => expect(detectType('BEGIN:VEVENT\nSUMMARY:X\nEND:VEVENT')).toBe('event'));

  it('EAN-13 (13 digits, 97x prefix)', () =>
    expect(detectType('9781234567890')).toBe('ean13'));
  it('EAN-8 (8 digits)', () => expect(detectType('12345678')).toBe('ean8'));
  it('UPC-A (12 digits)', () => expect(detectType('123456789012')).toBe('upc_a'));

  it('plain text falls through to text', () =>
    expect(detectType('just some words')).toBe('text'));
  it('empty → unknown', () => expect(detectType('')).toBe('unknown'));

  it('alphanumeric high-density string → code128', () =>
    expect(detectType('ABC-12345-XYZ')).toBe('code128'));
  it('short alphanumeric does NOT trigger code128 (length guard)', () =>
    expect(detectType('ABC123')).toBe('text'));
  it('scheme-prefixed URL never matches code128', () =>
    expect(detectType('https://example.com/path')).toBe('url'));
});

describe('getTemplateFields', () => {
  it('returns expected fields for each template', () => {
    expect(getTemplateFields('url')).toEqual(['url']);
    expect(getTemplateFields('wifi')).toEqual(['wifiSSID', 'wifiPassword']);
    expect(getTemplateFields('text')).toEqual(['text']);
    expect(getTemplateFields('event')).toEqual([
      'eventTitle', 'eventDate', 'eventLocation', 'eventDesc',
    ]);
  });
});

describe('TEMPLATES', () => {
  it('has 9 templates', () => {
    expect(TEMPLATES).toHaveLength(9);
  });

  it('all ids are unique', () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
