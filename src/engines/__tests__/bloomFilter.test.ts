import { describe, it, expect, beforeEach } from 'vitest';
import { PasswordBloomFilter } from '../bloomFilter';

describe('PasswordBloomFilter (Breach Check Engine)', () => {
  let bloomFilter: PasswordBloomFilter;

  beforeEach(() => {
    bloomFilter = new PasswordBloomFilter();
  });

  it('should flag seeded common weak passwords', () => {
    expect(bloomFilter.mightContain('123456')).toBe(true);
    expect(bloomFilter.mightContain('password')).toBe(true);
    expect(bloomFilter.mightContain('qwerty')).toBe(true);
  });

  it('should not flag complex high-entropy random passwords', () => {
    expect(bloomFilter.mightContain('xK9#vL2$pQ8@zM1!4729')).toBe(false);
    expect(bloomFilter.mightContain('G9#mK2$pW8@zL1!9834')).toBe(false);
  });

  it('should allow dynamically adding new weak patterns', () => {
    const customWeak = 'CustomSecretWeakPass2026';
    expect(bloomFilter.mightContain(customWeak)).toBe(false);
    bloomFilter.add(customWeak);
    expect(bloomFilter.mightContain(customWeak)).toBe(true);
  });

  it('should report correct size and memory stats', () => {
    const stats = bloomFilter.getStats();
    expect(stats.sizeBits).toBe(958505);
    expect(stats.numHashes).toBe(7);
    expect(stats.memoryBytes).toBeGreaterThan(100000); // ~117 KB
  });
});
