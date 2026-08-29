/**
 * Zero-Knowledge Dual-Key Derivation Protocol
 * Uses Web Crypto API (PBKDF2-HMAC-SHA256 with 100,000 iterations)
 * 
 * Derives two distinct keys:
 * 1. Master Encryption Key (MEK): 256-bit AES-GCM CryptoKey for client-side vault encryption. NEVER leaves browser.
 * 2. Authentication Key Hash (AK-Hash): SHA-256 hash of second 256-bit key material. Sent to server for login validation.
 */

export interface DerivedKeyBundle {
  masterEncryptionKey: CryptoKey;
  authKeyHash: string;
  salt: string;
}

export class KeyDerivationEngine {
  private static ITERATIONS = 100000;
  private static HASH_ALGO = 'SHA-256';

  private static getSubtle(): SubtleCrypto {
    const cryptoObj = typeof window !== 'undefined' && window.crypto ? window.crypto : globalThis.crypto;
    return cryptoObj.subtle;
  }

  private static getCrypto(): Crypto {
    return typeof window !== 'undefined' && window.crypto ? window.crypto : (globalThis.crypto as Crypto);
  }

  /**
   * Generates a cryptographically random 16-byte salt
   */
  static generateSalt(): string {
    const saltArray = new Uint8Array(16);
    this.getCrypto().getRandomValues(saltArray);
    return Array.from(saltArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Derives MEK and Auth Key Hash from Master Password and Salt
   */
  static async deriveKeys(masterPassword: string, saltString: string): Promise<DerivedKeyBundle> {
    const encoder = new TextEncoder();
    const passwordBytes = encoder.encode(masterPassword);
    const saltBytes = encoder.encode(saltString);

    const subtle = this.getSubtle();

    // 1. Import raw master password as base key
    const baseKey = await subtle.importKey(
      'raw',
      passwordBytes,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    // 2. Derive 512 bits (64 bytes) using PBKDF2-HMAC-SHA256 with 100,000 iterations
    const derivedBits = await subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBytes,
        iterations: this.ITERATIONS,
        hash: this.HASH_ALGO,
      },
      baseKey,
      512 // 64 bytes total
    );

    // 3. Split 512 bits into MEK (first 32 bytes) and AK (next 32 bytes)
    const mekBits = derivedBits.slice(0, 32);
    const akBits = derivedBits.slice(32, 64);

    // 4. Import MEK as 256-bit AES-GCM CryptoKey
    const masterEncryptionKey = await subtle.importKey(
      'raw',
      mekBits,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    // 5. Hash Authentication Key (AK) with SHA-256 to produce authKeyHash
    const akHashBuffer = await subtle.digest(this.HASH_ALGO, akBits);
    const authKeyHash = Array.from(new Uint8Array(akHashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return {
      masterEncryptionKey,
      authKeyHash,
      salt: saltString,
    };
  }
}
