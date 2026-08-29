/**
 * Trie (Prefix Tree) Data Structure
 * Used for O(K) instant client-side vault search and domain auto-complete.
 * Time Complexity: Insert O(L), Search O(K), Prefix Search O(K + M)
 * Space Complexity: O(N * L) where N is items and L is average length.
 */

export interface TrieNodeData {
  id: string;
  applicationName: string;
  applicationUsername: string;
  category: string;
}

class TrieNode {
  children: Map<char, TrieNode> = new Map();
  isEndOfWord: boolean = false;
  vaultItems: TrieNodeData[] = [];
}

type char = string;

export class VaultTrie {
  private root: TrieNode;
  private totalNodes: number = 1;

  constructor() {
    this.root = new TrieNode();
  }

  /**
   * Inserts an application name or username into the Trie
   */
  insert(key: string, itemData: TrieNodeData): void {
    if (!key) return;
    const normalizedKey = key.toLowerCase().trim();
    let current = this.root;

    for (const char of normalizedKey) {
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode());
        this.totalNodes++;
      }
      current = current.children.get(char)!;
    }

    current.isEndOfWord = true;
    // Avoid duplicate item insertions for the same node
    if (!current.vaultItems.some(i => i.id === itemData.id)) {
      current.vaultItems.push(itemData);
    }
  }

  /**
   * Searches for exact match or prefix matches in O(K) time
   */
  searchPrefix(prefix: string): TrieNodeData[] {
    if (!prefix) return [];
    const normalizedPrefix = prefix.toLowerCase().trim();
    let current = this.root;

    for (const char of normalizedPrefix) {
      if (!current.children.has(char)) {
        return []; // Prefix not found
      }
      current = current.children.get(char)!;
    }

    // Collect all items in subtree under this prefix node
    const results: TrieNodeData[] = [];
    const visitedIds = new Set<string>();

    this.collectSubtreeItems(current, results, visitedIds);
    return results;
  }

  private collectSubtreeItems(node: TrieNode, results: TrieNodeData[], visitedIds: Set<string>): void {
    if (node.isEndOfWord) {
      for (const item of node.vaultItems) {
        if (!visitedIds.has(item.id)) {
          visitedIds.add(item.id);
          results.push(item);
        }
      }
    }

    for (const childNode of node.children.values()) {
      this.collectSubtreeItems(childNode, results, visitedIds);
    }
  }

  /**
   * Clears and resets the Trie
   */
  clear(): void {
    this.root = new TrieNode();
    this.totalNodes = 1;
  }

  getNodeCount(): number {
    return this.totalNodes;
  }
}
