/**
 * Cryptographically Secure Unbiased Password & Passphrase Generator
 * Employs CSPRNG Rejection Sampling (to eliminate modulo bias) and Fisher-Yates Shuffle.
 * Entropy math: H = L * log2(R)
 */

import { GeneratorOptions } from '../types';

const CHAR_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

const DICELINE_WORDS = [
  'correct', 'horse', 'battery', 'staple', 'rocket', 'shield', 'vault', 'cyber',
  'vector', 'quantum', 'matrix', 'crystal', 'phoenix', 'shadow', 'aurora', 'nebula',
  'zenith', 'beacon', 'orbit', 'pulse', 'glitch', 'prism', 'vortex', 'titan',
  'cascade', 'hologram', 'cipher', 'echo', 'solstice', 'radiant', 'horizon', 'falcon'
];

export class PasswordGenerator {
  private getCrypto(): Crypto {
    return typeof window !== 'undefined' && window.crypto
      ? window.crypto
      : (globalThis.crypto as Crypto);
  }

  /**
   * Generates a CSPRNG byte using Rejection Sampling to prevent modulo bias
   */
  private getRandomByteUnbiased(range: number): number {
    if (range <= 0) return 0;
    const maxValid = 256 - (256 % range);
    const randomArray = new Uint8Array(1);

    while (true) {
      this.getCrypto().getRandomValues(randomArray);
      const byte = randomArray[0];
      if (byte < maxValid) {
        return byte % range;
      }
    }
  }

  /**
   * Fisher-Yates Uniform Shuffle Algorithm
   */
  private shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.getRandomByteUnbiased(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Generates a random password or passphrase based on options
   */
  generate(options: GeneratorOptions): { password: string; entropyBits: number } {
    if (options.mode === 'passphrase') {
      const selectedWords: string[] = [];
      for (let i = 0; i < options.passphraseWords; i++) {
        const randomIndex = this.getRandomByteUnbiased(DICELINE_WORDS.length);
        selectedWords.push(DICELINE_WORDS[randomIndex]);
      }
      const passphrase = selectedWords.join('-');
      const entropy = Math.round(options.passphraseWords * Math.log2(DICELINE_WORDS.length));
      return { password: passphrase, entropyBits: entropy };
    }

    // Standard Password Mode
    let pool = '';
    const guaranteedChars: string[] = [];

    if (options.includeUppercase) {
      pool += CHAR_SETS.uppercase;
      guaranteedChars.push(CHAR_SETS.uppercase[this.getRandomByteUnbiased(CHAR_SETS.uppercase.length)]);
    }
    if (options.includeLowercase) {
      pool += CHAR_SETS.lowercase;
      guaranteedChars.push(CHAR_SETS.lowercase[this.getRandomByteUnbiased(CHAR_SETS.lowercase.length)]);
    }
    if (options.includeNumbers) {
      pool += CHAR_SETS.numbers;
      guaranteedChars.push(CHAR_SETS.numbers[this.getRandomByteUnbiased(CHAR_SETS.numbers.length)]);
    }
    if (options.includeSymbols) {
      pool += CHAR_SETS.symbols;
      guaranteedChars.push(CHAR_SETS.symbols[this.getRandomByteUnbiased(CHAR_SETS.symbols.length)]);
    }

    if (pool.length === 0) {
      pool = CHAR_SETS.lowercase; // Fallback
    }

    const remainingLength = Math.max(0, options.length - guaranteedChars.length);
    const randomChars: string[] = [];

    for (let i = 0; i < remainingLength; i++) {
      const randomIndex = this.getRandomByteUnbiased(pool.length);
      randomChars.push(pool[randomIndex]);
    }

    const combined = [...guaranteedChars, ...randomChars];
    const finalPassword = this.shuffle(combined).join('');
    const entropyBits = Math.round(options.length * Math.log2(pool.length));

    return { password: finalPassword, entropyBits };
  }

  static calculateEntropy(password: string): number {
    if (!password) return 0;
    let poolSize = 0;
    if (/[a-z]/.test(password)) poolSize += 26;
    if (/[A-Z]/.test(password)) poolSize += 26;
    if (/[0-9]/.test(password)) poolSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;
    if (poolSize === 0) poolSize = 26;
    return Math.round(password.length * Math.log2(poolSize));
  }
}

