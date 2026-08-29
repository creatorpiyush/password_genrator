/**
 * Offline Sync Engine with Last-Write-Wins (LWW) CRDT Conflict Resolution
 * Queues offline mutation events and synchronizes with Render backend when online.
 */

import { VaultItem } from '../types';
import { EncryptedIndexedDB } from './indexedDb';

export interface SyncMutationEvent {
  id: string;
  type: 'UPSERT' | 'DELETE';
  item?: VaultItem;
  timestamp: number;
}

export class SyncEngine {
  private idb: EncryptedIndexedDB;
  private queueKey = 'sentinel_sync_queue';
  private inMemoryQueue: SyncMutationEvent[] = [];

  constructor() {
    this.idb = new EncryptedIndexedDB();
  }

  private getStorage(): Storage | null {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
    if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) return (globalThis as any).localStorage;
    return null;
  }

  /**
   * Records a mutation locally and queues for remote sync
   */
  async recordMutation(type: 'UPSERT' | 'DELETE', item?: VaultItem): Promise<void> {
    if (item && type === 'UPSERT') {
      await this.idb.saveVaultItem(item);
    } else if (item && type === 'DELETE') {
      await this.idb.deleteVaultItem(item.id);
    }

    const queue = this.getQueue();
    const event: SyncMutationEvent = {
      id: item?.id || '',
      type,
      item,
      timestamp: Date.now(),
    };
    queue.push(event);
    this.saveQueue(queue);
  }

  getQueue(): SyncMutationEvent[] {
    const storage = this.getStorage();
    if (storage) {
      const data = storage.getItem(this.queueKey);
      return data ? JSON.parse(data) : [];
    }
    return this.inMemoryQueue;
  }

  private saveQueue(queue: SyncMutationEvent[]): void {
    const storage = this.getStorage();
    if (storage) {
      storage.setItem(this.queueKey, JSON.stringify(queue));
    } else {
      this.inMemoryQueue = queue;
    }
  }

  /**
   * Resolves remote items against local items using Last-Write-Wins (LWW) timestamp rule
   */
  resolveLWWConflict(localItems: VaultItem[], remoteItems: VaultItem[]): VaultItem[] {
    const itemMap = new Map<string, VaultItem>();

    for (const item of localItems) {
      itemMap.set(item.id, item);
    }

    for (const remote of remoteItems) {
      const existing = itemMap.get(remote.id);
      if (!existing || remote.updatedAt > existing.updatedAt) {
        itemMap.set(remote.id, remote);
      }
    }

    return Array.from(itemMap.values());
  }

  clearSyncQueue(): void {
    const storage = this.getStorage();
    if (storage) {
      storage.removeItem(this.queueKey);
    }
    this.inMemoryQueue = [];
  }
}
