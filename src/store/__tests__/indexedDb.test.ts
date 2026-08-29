import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { EncryptedIndexedDB } from '../indexedDb';
import { VaultItem } from '../../types';

describe('EncryptedIndexedDB (Client-Side Storage Engine)', () => {
  let idb: EncryptedIndexedDB;

  const sampleItem: VaultItem = {
    id: 'test_item_1',
    applicationName: 'GitHub',
    applicationUsername: 'user@github.com',
    encryptedPassword: {
      iv: '1234567890abcdef12345678',
      ciphertext: 'fedcba0987654321',
    },
    category: 'web',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  beforeEach(async () => {
    idb = new EncryptedIndexedDB();
    await idb.clearVault();
  });

  it('should save and retrieve an encrypted vault item', async () => {
    await idb.saveVaultItem(sampleItem);
    const items = await idb.getAllVaultItems();

    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('test_item_1');
    expect(items[0].applicationName).toBe('GitHub');
    expect(items[0].encryptedPassword.ciphertext).toBe('fedcba0987654321');
  });

  it('should delete a vault item by ID', async () => {
    await idb.saveVaultItem(sampleItem);
    await idb.deleteVaultItem('test_item_1');

    const items = await idb.getAllVaultItems();
    expect(items).toHaveLength(0);
  });

  it('should clear all items when clearVault() is called', async () => {
    await idb.saveVaultItem(sampleItem);
    await idb.saveVaultItem({ ...sampleItem, id: 'test_item_2', applicationName: 'Google' });

    let items = await idb.getAllVaultItems();
    expect(items).toHaveLength(2);

    await idb.clearVault();
    items = await idb.getAllVaultItems();
    expect(items).toHaveLength(0);
  });
});
