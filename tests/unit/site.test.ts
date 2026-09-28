import { describe, expect, it } from 'vitest';
import { NAV_ITEMS, SITE } from '../../src/lib/site';

describe('site constants', () => {
  it('has the production URL without trailing slash', () => {
    expect(SITE.url).toBe('https://simongreer.co.uk');
  });
  it('nav items have absolute paths and labels', () => {
    expect(NAV_ITEMS.length).toBeGreaterThanOrEqual(3);
    for (const item of NAV_ITEMS) {
      expect(item.href.startsWith('/')).toBe(true);
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.icon.startsWith('material-symbols:')).toBe(true);
    }
  });
});
