/**
 * Background Web Worker Crypto Engine
 * Offloads heavy PBKDF2 iterations and bulk vault AES-GCM operations to a background thread
 * to maintain 60 FPS UI performance.
 */

import { KeyDerivationEngine } from './keyDerivation';
import { AesGcmEngine } from './aesGcm';

export type CryptoWorkerAction =
  | { type: 'DERIVE_KEYS'; payload: { masterPassword: string; salt: string } }
  | { type: 'ENCRYPT_ITEM'; payload: { plaintext: string; mekRaw: ArrayBuffer } }
  | { type: 'DECRYPT_ITEM'; payload: { iv: string; ciphertext: string; mekRaw: ArrayBuffer } };

export type CryptoWorkerResponse =
  | { type: 'KEYS_DERIVED'; success: true; result: { authKeyHash: string; mekRaw: ArrayBuffer; salt: string } }
  | { type: 'ITEM_ENCRYPTED'; success: true; result: { iv: string; ciphertext: string } }
  | { type: 'ITEM_DECRYPTED'; success: true; result: { plaintext: string } }
  | { type: 'ERROR'; success: false; error: string };

self.onmessage = async (event: MessageEvent<CryptoWorkerAction>) => {
  const action = event.data;

  try {
    switch (action.type) {
      case 'DERIVE_KEYS': {
        const { masterPassword, salt } = action.payload;
        const derived = await KeyDerivationEngine.deriveKeys(masterPassword, salt);
        
        // Export CryptoKey to raw ArrayBuffer for worker transfer
        const mekRaw = await self.crypto.subtle.exportKey('raw', derived.masterEncryptionKey);
        
        self.postMessage({
          type: 'KEYS_DERIVED',
          success: true,
          result: {
            authKeyHash: derived.authKeyHash,
            mekRaw,
            salt: derived.salt,
          },
        } as CryptoWorkerResponse, [mekRaw]);
        break;
      }

      case 'ENCRYPT_ITEM': {
        const { plaintext, mekRaw } = action.payload;
        const mek = await self.crypto.subtle.importKey(
          'raw',
          mekRaw,
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt']
        );
        const encrypted = await AesGcmEngine.encrypt(plaintext, mek);
        
        self.postMessage({
          type: 'ITEM_ENCRYPTED',
          success: true,
          result: encrypted,
        } as CryptoWorkerResponse);
        break;
      }

      case 'DECRYPT_ITEM': {
        const { iv, ciphertext, mekRaw } = action.payload;
        const mek = await self.crypto.subtle.importKey(
          'raw',
          mekRaw,
          { name: 'AES-GCM', length: 256 },
          false,
          ['decrypt']
        );
        const plaintext = await AesGcmEngine.decrypt({ iv, ciphertext }, mek);
        
        self.postMessage({
          type: 'ITEM_DECRYPTED',
          success: true,
          result: { plaintext },
        } as CryptoWorkerResponse);
        break;
      }

      default:
        throw new Error('Unknown worker action type');
    }
  } catch (err: any) {
    self.postMessage({
      type: 'ERROR',
      success: false,
      error: err.message || 'Worker execution error',
    } as CryptoWorkerResponse);
  }
};
