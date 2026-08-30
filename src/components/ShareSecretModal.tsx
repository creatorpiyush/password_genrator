import React, { useState } from 'react';
import { Share2, Lock, Copy, Check, Clock, Eye, X, AlertCircle } from 'lucide-react';
import { AesGcmEngine } from '../crypto/aesGcm';

interface ShareSecretModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSecret?: string;
}

export const ShareSecretModal: React.FC<ShareSecretModalProps> = ({
  isOpen,
  onClose,
  initialSecret = '',
}) => {
  const [secretText, setSecretText] = useState(initialSecret);
  const [maxViews, setMaxViews] = useState<number>(1);
  const [expireHours, setExpireHours] = useState<number>(24);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateShareLink = async () => {
    if (!secretText.trim()) {
      setError('Please enter a secret password or note to share.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Generate random 256-bit AES key for key fragment
      const keyBytes = new Uint8Array(32);
      crypto.getRandomValues(keyBytes);
      const keyHex = Array.from(keyBytes).map(b => b.toString(16).padStart(2, '0')).join('');

      // 2. Import raw key bytes as AES-GCM CryptoKey
      const mek = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );

      // 3. Encrypt payload client-side
      const encryptedPayload = await AesGcmEngine.encrypt(secretText, mek);

      // 4. Send encrypted payload to server
      const res = await fetch('/api/v1/share/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ciphertext: encryptedPayload.ciphertext,
          iv: encryptedPayload.iv,
          maxViews,
          expireHours,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create share link on server');
      }

      // 5. Construct Zero-Knowledge Share URL with key in hash fragment
      const shareUrl = `${window.location.origin}/#share=${data.shareId}&key=${keyHex}`;
      setGeneratedUrl(shareUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to generate self-destructing link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedUrl) {
      navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div className="glass-panel" style={{ maxWidth: '32rem', width: '100%', padding: '2rem', borderRadius: '1rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '0.75rem', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
              <Share2 style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                One-Time Encrypted Share
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Zero-Knowledge self-destructing secret link generator
              </span>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#f43f5e', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.8125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle style={{ width: 16, height: 16 }} />
            <span>{error}</span>
          </div>
        )}

        {!generatedUrl ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.375rem' }}>
                Secret Password or Note
              </label>
              <textarea
                value={secretText}
                onChange={(e) => setSecretText(e.target.value)}
                placeholder="Paste sensitive password or secret note..."
                rows={3}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(10, 14, 23, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  color: '#f8fafc',
                  fontSize: '0.8125rem',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.375rem' }}>
                  <Eye style={{ width: 14, height: 14, color: '#c084fc' }} /> Max Views
                </label>
                <select
                  value={maxViews}
                  onChange={(e) => setMaxViews(Number(e.target.value))}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: 'rgba(10, 14, 23, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '0.5rem',
                    padding: '0.625rem',
                    color: '#f8fafc',
                    fontSize: '0.8125rem',
                    outline: 'none',
                  }}
                >
                  <option value={1}>1 View (Self-Destructs)</option>
                  <option value={3}>3 Views</option>
                  <option value={5}>5 Views</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.375rem' }}>
                  <Clock style={{ width: 14, height: 14, color: '#c084fc' }} /> Expiration
                </label>
                <select
                  value={expireHours}
                  onChange={(e) => setExpireHours(Number(e.target.value))}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: 'rgba(10, 14, 23, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '0.5rem',
                    padding: '0.625rem',
                    color: '#f8fafc',
                    fontSize: '0.8125rem',
                    outline: 'none',
                  }}
                >
                  <option value={1}>1 Hour</option>
                  <option value={24}>24 Hours</option>
                  <option value={72}>3 Days</option>
                </select>
              </div>
            </div>

            <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '0.5rem', padding: '0.75rem', fontSize: '0.75rem', color: '#e9d5ff', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <Lock style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2, color: '#c084fc' }} />
              <span>
                <strong>Zero-Knowledge Guarantee:</strong> The encryption key is appended to the URL hash fragment (<code>#key</code>). Browsers never send URL hash fragments to our servers.
              </span>
            </div>

            <button
              onClick={handleCreateShareLink}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.2s ease',
              }}
            >
              {loading ? 'Encrypting & Generating Link...' : 'Generate Self-Destructing Link'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Check style={{ width: 18, height: 18 }} /> Link successfully created!
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.375rem' }}>
                Shareable URL
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  readOnly
                  value={generatedUrl}
                  style={{
                    flex: 1,
                    boxSizing: 'border-box',
                    background: 'rgba(10, 14, 23, 0.9)',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    borderRadius: '0.5rem',
                    padding: '0.625rem',
                    color: '#c084fc',
                    fontSize: '0.75rem',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleCopy}
                  style={{
                    background: 'rgba(168, 85, 247, 0.2)',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    color: '#c084fc',
                    borderRadius: '0.5rem',
                    padding: '0.625rem 1rem',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                  }}
                >
                  {copied ? <Check style={{ width: 14, height: 14, color: '#10b981' }} /> : <Copy style={{ width: 14, height: 14 }} />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => setGeneratedUrl(null)}
              style={{
                width: '100%',
                padding: '0.625rem',
                borderRadius: '0.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Generate Another Share Link
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
