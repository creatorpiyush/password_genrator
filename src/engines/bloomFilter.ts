/**
 * Bloom Filter (Probabilistic Data Structure)
 * Used for zero-latency offline check of weak and leaked passwords with 0 false negatives.
 * Bit array m = 958,505 bits (~117 KB), k = 7 hash functions.
 * False positive probability < 1% for 100,000 passwords.
 */

export class PasswordBloomFilter {
  private bitArray: Uint8Array;
  private size: number; // m bits
  private numHashes: number; // k hash functions

  constructor(sizeInBits: number = 958505, numHashes: number = 7) {
    this.size = sizeInBits;
    this.numHashes = numHashes;
    // Each byte holds 8 bits
    this.bitArray = new Uint8Array(Math.ceil(sizeInBits / 8));
    this.seedCommonWeakPasswords();
  }

  /**
   * Murmur3-like hash function for bit distribution
   */
  private hash(str: string, seed: number): number {
    let h1 = seed ^ str.length;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 0x5bd1e995);
      h1 ^= h1 >>> 15;
    }
    return Math.abs(h1) % this.size;
  }

  /**
   * Adds a string to the Bloom Filter
   */
  add(item: string): void {
    const normalized = item.toLowerCase();
    for (let i = 0; i < this.numHashes; i++) {
      const bitIndex = this.hash(normalized, i * 0x9e3779b9);
      const byteIndex = Math.floor(bitIndex / 8);
      const bitOffset = bitIndex % 8;
      this.bitArray[byteIndex] |= (1 << bitOffset);
    }
  }

  /**
   * Checks if an item might exist in the filter
   * Returns FALSE if definitely NOT in set (0% false negative)
   * Returns TRUE if MAYBE in set (< 1% false positive)
   */
  mightContain(item: string): boolean {
    const normalized = item.toLowerCase();
    for (let i = 0; i < this.numHashes; i++) {
      const bitIndex = this.hash(normalized, i * 0x9e3779b9);
      const byteIndex = Math.floor(bitIndex / 8);
      const bitOffset = bitIndex % 8;

      if ((this.bitArray[byteIndex] & (1 << bitOffset)) === 0) {
        return false; // Definitely not present
      }
    }
    return true; // Likely present
  }

  /**
   * Seeds common known weak/leaked password patterns
   */
  private seedCommonWeakPasswords(): void {
    const commonWeak = [
      // Standard weak numbers & sequences
      '123456', '123456789', '12345678', '12345', '111111', '1234567', '1234567890', '000000', '123123', '654321', '666666', '7777777', '888888',
      // Common passwords & patterns
      'password', 'password123', 'pass123', 'admin', 'admin123', 'welcome', 'welcome1', 'sunshine', 'iloveyou', 'qwerty', 'qwertyuiop', 'asdfghjkl',
      'zxcvbnm', 'abc123', 'monkey', 'dragon', 'master', 'superman', 'letmein', 'trustno1', 'football', 'baseball', 'shadow', 'mustang', 'starwars',
      'princess', 'solo', 'computer', 'login', 'system', 'root', 'user', 'guest', 'test', 'testing', 'test123', 'pass', '1234',
      // Common names & simple words
      'michael', 'jordan', 'harley', 'rachel', 'charlie', 'daniel', 'hannah', 'thomas', 'jessica', 'andrew', 'michelle', 'alexander', 'anthony',
      // Default IoT & Server credentials
      'ubnt', 'cisco', 'default', 'passphrase', 'changeme', 'secret', 'toor', 'p@ssword', 'p@ssword1', 'p@ss123'
    ];
    for (const pwd of commonWeak) {
      this.add(pwd);
    }
  }

  getStats(): { sizeBits: number; numHashes: number; memoryBytes: number } {
    return {
      sizeBits: this.size,
      numHashes: this.numHashes,
      memoryBytes: this.bitArray.byteLength,
    };
  }
}
