/**
 * AES-256-GCM Cryptographic Vault Engine
 * Provides authenticated encryption/decryption with 96-bit unique IVs per item.
 */

export interface EncryptedPayload {
  iv: string; // Hex string (12 bytes / 96 bits)
  ciphertext: string; // Hex string
}

export class AesGcmEngine {
  private static IV_LENGTH_BYTES = 12; // 96 bits standard for AES-GCM

  private static getSubtle(): SubtleCrypto {
    const cryptoObj = typeof window !== 'undefined' && window.crypto ? window.crypto : globalThis.crypto;
    return cryptoObj.subtle;
  }

  private static getCrypto(): Crypto {
    return typeof window !== 'undefined' && window.crypto ? window.crypto : (globalThis.crypto as Crypto);
  }

  /**
   * Encrypts plaintext string using AES-256-GCM and a unique random IV
   */
  static async encrypt(plaintext: string, mek: CryptoKey): Promise<EncryptedPayload> {
    const encoder = new TextEncoder();
    const plaintextBytes = encoder.encode(plaintext);

    const iv = new Uint8Array(this.IV_LENGTH_BYTES);
    this.getCrypto().getRandomValues(iv);

    const ciphertextBuffer = await this.getSubtle().encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      mek,
      plaintextBytes
    );

    const ivHex = Array.from(iv)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const ciphertextHex = Array.from(new Uint8Array(ciphertextBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return {
      iv: ivHex,
      ciphertext: ciphertextHex,
    };
  }

  /**
   * Decrypts ciphertext back to plaintext string using AES-256-GCM
   */
  static async decrypt(payload: EncryptedPayload, mek: CryptoKey): Promise<string> {
    const ivBytes = new Uint8Array(
      payload.iv.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
    );

    const ciphertextBytes = new Uint8Array(
      payload.ciphertext.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
    );

    const decryptedBuffer = await this.getSubtle().decrypt(
      {
        name: 'AES-GCM',
        iv: ivBytes,
      },
      mek,
      ciphertextBytes
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  }
}
