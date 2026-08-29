import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { SyncEngine } from '../syncEngine';
import { VaultItem } from '../../types';

describe('SyncEngine (Offline Event Queue & LWW Conflict Resolution)', () => {
  let syncEngine: SyncEngine;

  beforeEach(() => {
    syncEngine = new SyncEngine();
    syncEngine.clearSyncQueue();
  });

  it('should record mutation events in sync queue and IndexedDB', async () => {
    const item: VaultItem = {
      id: 'item_100',
      applicationName: 'Netflix',
      applicationUsername: 'user@netflix.com',
      encryptedPassword: { iv: '111', ciphertext: '222' },
      category: 'web',
      createdAt: 1000,
      updatedAt: 1000,
    };

    await syncEngine.recordMutation('UPSERT', item);

    const queue = syncEngine.getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].type).toBe('UPSERT');
    expect(queue[0].item?.applicationName).toBe('Netflix');
  });

  it('should resolve LWW conflicts correctly preferring newest timestamp', () => {
    const localItem: VaultItem = {
      id: 'item_200',
      applicationName: 'OldName',
      applicationUsername: 'user',
      encryptedPassword: { iv: '1', ciphertext: '1' },
      category: 'web',
      createdAt: 1000,
      updatedAt: 1000, // Older timestamp
    };

    const remoteItem: VaultItem = {
      id: 'item_200',
      applicationName: 'NewUpdatedName',
      applicationUsername: 'user',
      encryptedPassword: { iv: '2', ciphertext: '2' },
      category: 'web',
      createdAt: 1000,
      updatedAt: 2000, // Newer timestamp
    };

    const resolved = syncEngine.resolveLWWConflict([localItem], [remoteItem]);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].applicationName).toBe('NewUpdatedName');
    expect(resolved[0].updatedAt).toBe(2000);
  });
});
