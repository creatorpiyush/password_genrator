import { describe, it, expect } from 'vitest';
import { KeyDerivationEngine } from '../keyDerivation';
import { AesGcmEngine } from '../aesGcm';

describe('AesGcmEngine (AES-256-GCM Encryption)', () => {
  it('should encrypt and decrypt plaintext strings matching exact value', async () => {
    const derived = await KeyDerivationEngine.deriveKeys('TestPass123!', 'fixed_salt_123456');
    const plaintext = 'SuperSecretVaultPassword$2026';

    const encrypted = await AesGcmEngine.encrypt(plaintext, derived.masterEncryptionKey);
    expect(encrypted.iv).toHaveLength(24); // 12 bytes = 24 hex chars
    expect(encrypted.ciphertext).not.toBe(plaintext);

    const decrypted = await AesGcmEngine.decrypt(encrypted, derived.masterEncryptionKey);
    expect(decrypted).toBe(plaintext);
  });

  it('should generate unique IVs for identical plaintexts', async () => {
    const derived = await KeyDerivationEngine.deriveKeys('TestPass123!', 'fixed_salt_123456');
    const plaintext = 'SamePassword';

    const enc1 = await AesGcmEngine.encrypt(plaintext, derived.masterEncryptionKey);
    const enc2 = await AesGcmEngine.encrypt(plaintext, derived.masterEncryptionKey);

    expect(enc1.iv).not.toEqual(enc2.iv);
    expect(enc1.ciphertext).not.toEqual(enc2.ciphertext);
  });
});
