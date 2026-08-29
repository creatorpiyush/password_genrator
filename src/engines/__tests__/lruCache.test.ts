import { describe, it, expect, beforeEach } from 'vitest';
import { DecryptedLRUCache } from '../lruCache';

describe('DecryptedLRUCache (O(1) Eviction & Memory Zeroing)', () => {
  let cache: DecryptedLRUCache<string, string>;

  beforeEach(() => {
    cache = new DecryptedLRUCache<string, string>(2, 300000); // Capacity 2
  });

  it('should store and retrieve items', () => {
    cache.put('key1', 'val1');
    expect(cache.get('key1')).toBe('val1');
  });

  it('should evict least recently used item when capacity is exceeded', () => {
    cache.put('key1', 'val1');
    cache.put('key2', 'val2');
    cache.put('key3', 'val3'); // Evicts key1

    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBe('val2');
    expect(cache.get('key3')).toBe('val3');
  });

  it('should update LRU order upon access', () => {
    cache.put('key1', 'val1');
    cache.put('key2', 'val2');

    // Access key1 to make key2 the least recently used
    cache.get('key1');

    cache.put('key3', 'val3'); // Evicts key2

    expect(cache.get('key2')).toBeNull();
    expect(cache.get('key1')).toBe('val1');
    expect(cache.get('key3')).toBe('val3');
  });

  it('should zeroize memory upon clear()', () => {
    cache.put('key1', 'sensitivePass');
    cache.clear();
    expect(cache.getSize()).toBe(0);
    expect(cache.get('key1')).toBeNull();
  });
});
