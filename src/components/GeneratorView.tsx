import React, { useState, useEffect, useMemo } from 'react';
import { PasswordGenerator } from '../engines/generator';
import { GeneratorOptions } from '../types';
import { Copy, Check, RefreshCw, Sparkles } from 'lucide-react';

export const GeneratorView: React.FC = () => {
  const [options, setOptions] = useState<GeneratorOptions>({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    mode: 'password',
    passphraseWords: 4,
  });

  const [generatedPassword, setGeneratedPassword] = useState('');
  const [entropy, setEntropy] = useState(0);
  const [copied, setCopied] = useState(false);

  const generator = useMemo(() => new PasswordGenerator(), []);

  const handleGenerate = () => {
    const res = generator.generate(options);
    setGeneratedPassword(res.password);
    setEntropy(res.entropyBits);
    setCopied(false);
  };

  useEffect(() => {
    handleGenerate();
  }, [options]);

  const handleCopy = () => {
    if (!generatedPassword) return;
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const getStrengthLabel = (bits: number) => {
    if (bits < 40) return { text: 'Very Weak', color: '#f43f5e', pct: 25 };
    if (bits < 60) return { text: 'Moderate', color: '#eab308', pct: 50 };
    if (bits < 80) return { text: 'Strong', color: '#10b981', pct: 75 };
    return { text: 'Cryptographically Superior', color: '#06b6d4', pct: 100 };
  };

  const strength = getStrengthLabel(entropy);

  return (
    <div className="glass-panel" style={{ padding: '2rem', maxWidth: '42rem', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles style={{ width: 22, height: 22, color: '#06b6d4' }} /> Password & Passphrase Generator
        </h3>
        <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', fontWeight: 600 }}>
          CSPRNG Unbiased Sampling
        </span>
      </div>

      {/* Generated Password Output Box */}
      <div style={{
        background: 'rgba(7, 10, 16, 0.9)',
        border: '1px solid rgba(6, 182, 212, 0.35)',
        borderRadius: '0.875rem',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        boxShadow: '0 0 25px rgba(6, 182, 212, 0.15)'
      }}>
        <span style={{
          fontFamily: "'Fira Code', monospace",
          fontSize: '1.25rem',
          fontWeight: 600,
          color: '#f8fafc',
          wordBreak: 'break-all'
        }}>
          {generatedPassword}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={handleGenerate}
            className="btn btn-ghost"
            style={{ padding: '0.625rem' }}
            title="Re-generate"
          >
            <RefreshCw style={{ width: 18, height: 18 }} />
          </button>

          <button
            onClick={handleCopy}
            className="btn btn-gradient"
            style={{ padding: '0.625rem 1.25rem' }}
          >
            {copied ? <Check style={{ width: 16, height: 16 }} /> : <Copy style={{ width: 16, height: 16 }} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Entropy Strength Indicator Bar */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
          <span style={{ color: '#94a3b8' }}>Strength: <strong style={{ color: strength.color }}>{strength.text}</strong></span>
          <span style={{ fontFamily: "'Fira Code', monospace", color: '#06b6d4' }}>Entropy: {entropy} bits</span>
        </div>
        <div style={{ height: '8px', background: 'rgba(30, 41, 59, 0.8)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${strength.pct}%`,
            background: `linear-gradient(90deg, ${strength.color}, #06b6d4)`,
            transition: 'all 0.3s ease'
          }} />
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Mode Selector */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
          <button
            onClick={() => setOptions({ ...options, mode: 'password' })}
            className={`btn ${options.mode === 'password' ? 'btn-active' : 'btn-ghost'}`}
            style={{ flex: 1 }}
          >
            Random Password Mode
          </button>
          <button
            onClick={() => setOptions({ ...options, mode: 'passphrase' })}
            className={`btn ${options.mode === 'passphrase' ? 'btn-active' : 'btn-ghost'}`}
            style={{ flex: 1 }}
          >
            Memorable Passphrase Mode
          </button>
        </div>

        {options.mode === 'password' ? (
          <>
            {/* Length Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                <span style={{ color: '#94a3b8' }}>Password Length</span>
                <span style={{ fontFamily: "'Fira Code', monospace", color: '#f8fafc', fontWeight: 600 }}>{options.length} characters</span>
              </div>
              <input
                type="range"
                min="8"
                max="64"
                value={options.length}
                onChange={(e) => setOptions({ ...options, length: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#06b6d4', cursor: 'pointer' }}
              />
            </div>

            {/* Checkboxes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', paddingTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', color: '#cbd5e1' }}>
                <input
                  type="checkbox"
                  checked={options.includeUppercase}
                  onChange={(e) => setOptions({ ...options, includeUppercase: e.target.checked })}
                  style={{ accentColor: '#06b6d4', width: 16, height: 16 }}
                />
                Uppercase (A-Z)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', color: '#cbd5e1' }}>
                <input
                  type="checkbox"
                  checked={options.includeLowercase}
                  onChange={(e) => setOptions({ ...options, includeLowercase: e.target.checked })}
                  style={{ accentColor: '#06b6d4', width: 16, height: 16 }}
                />
                Lowercase (a-z)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', color: '#cbd5e1' }}>
                <input
                  type="checkbox"
                  checked={options.includeNumbers}
                  onChange={(e) => setOptions({ ...options, includeNumbers: e.target.checked })}
                  style={{ accentColor: '#06b6d4', width: 16, height: 16 }}
                />
                Numbers (0-9)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', color: '#cbd5e1' }}>
                <input
                  type="checkbox"
                  checked={options.includeSymbols}
                  onChange={(e) => setOptions({ ...options, includeSymbols: e.target.checked })}
                  style={{ accentColor: '#06b6d4', width: 16, height: 16 }}
                />
                Symbols (!@#$%)
              </label>
            </div>
          </>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              <span style={{ color: '#94a3b8' }}>Passphrase Word Count</span>
              <span style={{ fontFamily: "'Fira Code', monospace", color: '#f8fafc', fontWeight: 600 }}>{options.passphraseWords} words</span>
            </div>
            <input
              type="range"
              min="3"
              max="8"
              value={options.passphraseWords}
              onChange={(e) => setOptions({ ...options, passphraseWords: parseInt(e.target.value) })}
              style={{ width: '100%', accentColor: '#06b6d4', cursor: 'pointer' }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
