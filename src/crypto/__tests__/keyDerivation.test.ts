import { describe, it, expect } from 'vitest';
import { KeyDerivationEngine } from '../keyDerivation';

describe('KeyDerivationEngine (PBKDF2 Dual-Key Derivation)', () => {
  it('should generate a 16-byte random hex salt', () => {
    const salt = KeyDerivationEngine.generateSalt();
    expect(salt).toHaveLength(32); // 16 bytes = 32 hex chars
  });

  it('should derive isolated MEK and Auth Key Hash deterministically', async () => {
    const masterPassword = 'MySecretMasterPassword123!';
    const salt = 'a1b2c3d4e5f67890a1b2c3d4e5f67890';

    const res1 = await KeyDerivationEngine.deriveKeys(masterPassword, salt);
    const res2 = await KeyDerivationEngine.deriveKeys(masterPassword, salt);

    expect(res1.authKeyHash).toEqual(res2.authKeyHash);
    expect(res1.masterEncryptionKey.algorithm.name).toBe('AES-GCM');
    expect(res1.authKeyHash).toHaveLength(64); // SHA-256 hex string
  });
});
