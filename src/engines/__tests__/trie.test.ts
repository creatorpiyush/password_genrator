import { describe, it, expect, beforeEach } from 'vitest';
import { VaultTrie } from '../trie';

describe('VaultTrie (Prefix Search Engine)', () => {
  let trie: VaultTrie;

  beforeEach(() => {
    trie = new VaultTrie();
  });

  it('should insert items and retrieve exact prefix matches', () => {
    trie.insert('github.com', { id: '1', applicationName: 'github.com', applicationUsername: 'user1', category: 'web' });
    trie.insert('google.com', { id: '2', applicationName: 'google.com', applicationUsername: 'user2', category: 'web' });
    trie.insert('gitlab.com', { id: '3', applicationName: 'gitlab.com', applicationUsername: 'user3', category: 'web' });

    const results = trie.searchPrefix('git');
    expect(results).toHaveLength(2);
    const names = results.map(r => r.applicationName);
    expect(names).toContain('github.com');
    expect(names).toContain('gitlab.com');
  });

  it('should perform case-insensitive prefix search', () => {
    trie.insert('Netflix', { id: '1', applicationName: 'Netflix', applicationUsername: 'netuser', category: 'web' });
    const results = trie.searchPrefix('net');
    expect(results).toHaveLength(1);
    expect(results[0].applicationName).toEqual('Netflix');
  });

  it('should return empty array when prefix is not found', () => {
    trie.insert('Amazon', { id: '1', applicationName: 'Amazon', applicationUsername: 'azuser', category: 'web' });
    const results = trie.searchPrefix('xyz');
    expect(results).toEqual([]);
  });

  it('should clear all nodes when clear() is called', () => {
    trie.insert('Facebook', { id: '1', applicationName: 'Facebook', applicationUsername: 'fbuser', category: 'web' });
    expect(trie.getNodeCount()).toBeGreaterThan(1);
    trie.clear();
    expect(trie.getNodeCount()).toEqual(1);
    expect(trie.searchPrefix('Face')).toEqual([]);
  });
});
