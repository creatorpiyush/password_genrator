import { describe, it, expect } from 'vitest';
import { computeSHA1 } from '../breachCheckService';

describe('Breach Check Service', () => {
  it('should compute correct SHA-1 hash for passwords', async () => {
    // SHA-1 of "password" is 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8
    const hash = await computeSHA1('password');
    expect(hash).toBe('5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8');
    expect(hash.substring(0, 5)).toBe('5BAA6');
  });

  it('should generate uppercase hex prefix of 5 characters', async () => {
    const hash = await computeSHA1('SentinelVault2026!');
    expect(hash.length).toBe(40);
    expect(hash.substring(0, 5)).toMatch(/^[0-9A-F]{5}$/);
  });
});
