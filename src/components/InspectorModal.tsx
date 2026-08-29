import React from 'react';
import { Terminal, X, Cpu, Lock, Database, Zap } from 'lucide-react';
import { VaultEngineStats } from '../types';

interface InspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: VaultEngineStats;
}

export const InspectorModal: React.FC<InspectorModalProps> = ({ isOpen, onClose, stats }) => {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div className="glass-panel" style={{ maxWidth: '44rem', width: '100%', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Terminal style={{ width: 22, height: 22, color: '#38bdf8' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Engine & System Design Inspector
            </h3>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {/* Engine Grid Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {/* 1. Trie Engine */}
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '0.75rem', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#38bdf8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap style={{ width: 16, height: 16 }} /> Trie Engine (Prefix Search)
            </h4>
            <div style={{ fontSize: '0.8125rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div>Time Complexity: <strong style={{ color: '#38bdf8' }}>O(K) Search</strong></div>
              <div>Trie Memory Nodes: <strong style={{ fontFamily: "'Fira Code', monospace" }}>{stats.trieNodeCount} nodes</strong></div>
              <div>Subtree Traversal: <span style={{ color: '#10b981' }}>Active</span></div>
            </div>
          </div>

          {/* 2. Bloom Filter Engine */}
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '0.75rem', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#a855f7', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cpu style={{ width: 16, height: 16 }} /> Bloom Filter (Breach Check)
            </h4>
            <div style={{ fontSize: '0.8125rem', color: '#cbd5e1' }}>
              <div>Bit Array Size (m): <strong style={{ fontFamily: "'Fira Code', monospace" }}>{stats.bloomFilterBits} bits</strong></div>
              <div>Hash Functions (k): <strong>{stats.bloomFilterHashes} (Murmur3)</strong></div>
              <div>False Positive Rate: <span style={{ color: '#10b981' }}>&lt; 1%</span></div>
            </div>
          </div>

          {/* 3. Zero-Knowledge Key Derivation */}
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '0.75rem', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#10b981', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock style={{ width: 16, height: 16 }} /> Zero-Knowledge Crypto
            </h4>
            <div style={{ fontSize: '0.8125rem', color: '#cbd5e1' }}>
              <div>PBKDF2 Iterations: <strong>100,000 rounds</strong></div>
              <div>Ciphertext: <strong>AES-256-GCM (96-bit IV)</strong></div>
              <div>MEK Memory Isolation: <span style={{ color: '#10b981' }}>WebWorker Only</span></div>
            </div>
          </div>

          {/* 4. LRU Cache Engine */}
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '0.75rem', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#f43f5e', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database style={{ width: 16, height: 16 }} /> LRU Cache & Hygiene
            </h4>
            <div style={{ fontSize: '0.8125rem', color: '#cbd5e1' }}>
              <div>Capacity / Cached: <strong>{stats.lruCacheSize} / {stats.lruCacheCapacity}</strong></div>
              <div>TTL Expiry: <strong>5 minutes (300s)</strong></div>
              <div>Eviction Memory Zeroing: <span style={{ color: '#10b981' }}>fill(0) active</span></div>
            </div>
          </div>
        </div>

        <div style={{ padding: '0.875rem 1rem', background: 'rgba(14, 165, 233, 0.1)', border: '1px solid rgba(14, 165, 233, 0.2)', borderRadius: '0.5rem', fontSize: '0.8125rem', color: '#38bdf8' }}>
          💡 <strong>Interview Showcase Tip:</strong> Mention how Trie $O(K)$ search eliminates $O(N)$ main thread scanning, while Web Worker PBKDF2 offloading maintains a fluid 60 FPS frame rate.
        </div>
      </div>
    </div>
  );
};
