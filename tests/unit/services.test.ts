import { describe, expect, it } from 'vitest';
import services from '../../src/content/services.json';

const FILTERS_IN_USE = [
  'ai-automation',
  'broadcast-networking',
  'business',
  'cloud-and-hosted',
  'data-and-databases',
  'design-and-deployment',
  'networking',
  'software-development',
  'storage',
  'web-development',
];

describe('services.json', () => {
  it('has unique ids that are URL-safe', () => {
    const ids = services.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
  });
  it('claims every hireme_filter value in use exactly once', () => {
    const all = services.flatMap((s) => s.filters);
    expect([...all].sort()).toEqual([...FILTERS_IN_USE].sort());
  });
  it('exposes exactly four nav entries in the legacy order', () => {
    expect(services.filter((s) => s.inNav).map((s) => s.id)).toEqual([
      'web-development',
      'business-apps',
      'networking-and-security',
      'storage-and-nas',
    ]);
  });
});
