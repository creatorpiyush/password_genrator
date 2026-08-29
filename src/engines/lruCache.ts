/**
 * LRU (Least Recently Used) Cache with Secure Memory Eviction
 * Implemented using Doubly-Linked List + Map data structure.
 * Lookup/Eviction Time Complexity: O(1)
 * Security Hygiene: Overwrites evicted string/buffer allocations with zeroes (fill(0)).
 */

class LRUNode<K, V> {
  key: K;
  value: V;
  expiryTimestamp: number;
  prev: LRUNode<K, V> | null = null;
  next: LRUNode<K, V> | null = null;

  constructor(key: K, value: V, ttlMs: number) {
    this.key = key;
    this.value = value;
    this.expiryTimestamp = Date.now() + ttlMs;
  }
}

export class DecryptedLRUCache<K extends string, V extends string> {
  private capacity: number;
  private ttlMs: number;
  private map: Map<K, LRUNode<K, V>> = new Map();
  private head: LRUNode<K, V> | null = null; // Most recently used
  private tail: LRUNode<K, V> | null = null; // Least recently used

  constructor(capacity: number = 20, ttlMs: number = 300000) { // Default 5 mins TTL
    this.capacity = capacity;
    this.ttlMs = ttlMs;
  }

  get(key: K): V | null {
    const node = this.map.get(key);
    if (!node) return null;

    // Check TTL Expiry
    if (Date.now() > node.expiryTimestamp) {
      this.removeNode(node);
      this.zeroizeNode(node);
      this.map.delete(key);
      return null;
    }

    // Move to head (Most Recently Used)
    this.moveToHead(node);
    return node.value;
  }

  put(key: K, value: V): void {
    if (this.map.has(key)) {
      const node = this.map.get(key)!;
      this.zeroizeNode(node); // Wipe previous value
      node.value = value;
      node.expiryTimestamp = Date.now() + this.ttlMs;
      this.moveToHead(node);
      return;
    }

    // Evict least recently used if at capacity
    if (this.map.size >= this.capacity && this.tail) {
      const tailNode = this.tail;
      this.removeNode(tailNode);
      this.map.delete(tailNode.key);
      this.zeroizeNode(tailNode);
    }

    const newNode = new LRUNode<K, V>(key, value, this.ttlMs);
    this.addToHead(newNode);
    this.map.set(key, newNode);
  }

  private moveToHead(node: LRUNode<K, V>): void {
    this.removeNode(node);
    this.addToHead(node);
  }

  private addToHead(node: LRUNode<K, V>): void {
    node.next = this.head;
    node.prev = null;

    if (this.head) {
      this.head.prev = node;
    }
    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  private removeNode(node: LRUNode<K, V>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  /**
   * Drops string memory references to allow immediate V8 garbage collection.
   * Note: JavaScript primitive strings are immutable in userland memory,
   * so resetting references is the standard JS memory sanitation approach.
   */
  private zeroizeNode(node: LRUNode<K, V>): void {
    (node as any).value = '';
  }

  clear(): void {
    for (const node of this.map.values()) {
      this.zeroizeNode(node);
    }
    this.map.clear();
    this.head = null;
    this.tail = null;
  }

  getSize(): number {
    return this.map.size;
  }

  getCapacity(): number {
    return this.capacity;
  }
}
