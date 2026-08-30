import React, { useEffect, useState, useRef } from 'react';
import { ShieldCheck, AlertOctagon, Copy, Check, Lock, EyeOff } from 'lucide-react';
import { AesGcmEngine } from '../crypto/aesGcm';

export const PublicShareView: React.FC = () => {
  const [decryptedSecret, setDecryptedSecret] = useState<string | null>(null);
  const [viewsLeft, setViewsLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    async function loadAndDecryptShare() {
      setLoading(true);
      setError(null);

      // Parse hash format #share={shareId}&key={keyHex}
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const shareId = params.get('share');
      const keyHex = params.get('key');

      if (!shareId || !keyHex) {
        setError('Invalid share link structure. Missing decryption key fragment.');
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch encrypted payload from server
        const res = await fetch(`/api/v1/share/${shareId}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'This link has expired or reached maximum allowed view count.');
        }

        setViewsLeft(data.viewsLeft);

        // 2. Convert keyHex to Uint8Array and import CryptoKey
        const keyBytes = new Uint8Array(
          keyHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
        );

        const mek = await crypto.subtle.importKey(
          'raw',
          keyBytes,
          { name: 'AES-GCM', length: 256 },
          false,
          ['decrypt']
        );

        // 3. Decrypt ciphertext in browser
        const plaintext = await AesGcmEngine.decrypt(data.encryptedPayload, mek);
        setDecryptedSecret(plaintext);
      } catch (err: any) {
        setError(err.message || 'Failed to decrypt shared secret.');
      } finally {
        setLoading(false);
      }
    }

    loadAndDecryptShare();
  }, []);

  const handleCopy = () => {
    if (decryptedSecret) {
      navigator.clipboard.writeText(decryptedSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#090d16', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-panel" style={{ maxWidth: '32rem', width: '100%', padding: '2rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '0.75rem', background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
            <Lock style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: 0, lineHeight: 1.2 }}>SentinelVault Secret Share</h1>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Zero-Knowledge Self-Destructing Decryption</span>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <Lock style={{ width: 32, height: 32, color: '#38bdf8', opacity: 0.7 }} />
            <p>Decrypting shared secret locally in browser...</p>
          </div>
        ) : error ? (
          <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '0.75rem', padding: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <AlertOctagon style={{ width: 36, height: 36, color: '#f43f5e' }} />
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#fca5a5', margin: 0 }}>Secret Expired or Destroyed</h2>
            <p style={{ fontSize: '0.75rem', color: '#f8fafc', margin: 0, lineHeight: 1.5 }}>{error}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck style={{ width: 16, height: 16, flexShrink: 0 }} />
              <span>Decrypted successfully via zero-knowledge client decryption.</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.375rem' }}>
                Decrypted Secret Content
              </label>
              <div style={{
                background: 'rgba(10, 14, 23, 0.95)',
                border: '1px solid rgba(6, 182, 212, 0.4)',
                borderRadius: '0.5rem',
                padding: '1rem',
                color: '#38bdf8',
                fontSize: '0.875rem',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                wordBreak: 'break-all',
                userSelect: 'all',
              }}>
                {decryptedSecret}
              </div>
            </div>

            <button
              onClick={handleCopy}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              {copied ? <Check style={{ width: 16, height: 16, color: '#6ee7b7' }} /> : <Copy style={{ width: 16, height: 16 }} />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Secret to Clipboard'}</span>
            </button>

            <div style={{ background: 'rgba(10, 14, 23, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '0.5rem', padding: '0.625rem', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
              <EyeOff style={{ width: 14, height: 14, color: '#eab308' }} />
              <span>
                {viewsLeft === 0
                  ? '⚡ This secret was configured for 1 view and has now been permanently erased from the server.'
                  : `Views remaining: ${viewsLeft}`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
