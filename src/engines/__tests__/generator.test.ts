import { describe, it, expect } from 'vitest';
import { PasswordGenerator } from '../generator';

describe('PasswordGenerator (CSPRNG Unbiased Engine)', () => {
  const generator = new PasswordGenerator();

  it('should generate password matching requested length', () => {
    const res = generator.generate({
      length: 24,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      mode: 'password',
      passphraseWords: 4,
    });

    expect(res.password).toHaveLength(24);
    expect(res.entropyBits).toBeGreaterThan(100);
  });

  it('should generate passphrase with specified word count', () => {
    const res = generator.generate({
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      mode: 'passphrase',
      passphraseWords: 5,
    });

    const words = res.password.split('-');
    expect(words).toHaveLength(5);
    expect(res.entropyBits).toBeGreaterThan(20);
  });

  it('should respect character pool constraints', () => {
    const res = generator.generate({
      length: 20,
      includeUppercase: false,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: false,
      mode: 'password',
      passphraseWords: 4,
    });

    // Should not contain uppercase letters or symbols
    expect(res.password).not.toMatch(/[A-Z]/);
    expect(res.password).not.toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/);
  });
});
