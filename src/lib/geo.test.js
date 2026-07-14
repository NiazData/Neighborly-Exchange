import { describe, it, expect } from 'vitest';
import { distanceKm, formatDistance } from './geo';

describe('distanceKm', () => {
  it('returns 0 for identical points', () => {
    expect(distanceKm(40.7128, -74.006, 40.7128, -74.006)).toBe(0);
  });
  it('computes known distance (NYC → Newark ≈ 14.5 km)', () => {
    const d = distanceKm(40.7128, -74.006, 40.7357, -74.1724);
    expect(d).toBeGreaterThan(13.5);
    expect(d).toBeLessThan(15.5);
  });
});

describe('formatDistance', () => {
  it('uses meters under 1 km', () => expect(formatDistance(0.85)).toBe('850 m'));
  it('uses one decimal km at 1 km and above', () => expect(formatDistance(1.234)).toBe('1.2 km'));
});
