import React from 'react';
import { Shield, Key, Cpu, Lock, Terminal, User, Server } from 'lucide-react';
import { UserSession } from '../types';

interface NavbarProps {
  activeTab: 'vault' | 'generator' | 'audit' | 'admin';
  setActiveTab: (tab: 'vault' | 'generator' | 'audit' | 'admin') => void;
  onOpenInspector: () => void;
  isUnlocked: boolean;
  userSession: UserSession | null;
  onLockVault: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenInspector,
  isUnlocked,
  userSession,
  onLockVault,
}) => {
  return (
    <header
      className="glass-panel nav-header"
      style={!isUnlocked ? { justifyContent: 'center', padding: '1rem' } : undefined}
    >
      {/* Brand & Logo */}
      <div className="nav-logo">
        <div className="logo-badge">
          <Shield style={{ width: 22, height: 22, color: '#ffffff' }} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: 0, lineHeight: 1.1 }}>
            SentinelVault
          </h2>
          <span style={{ fontSize: '0.75rem', color: '#06b6d4', fontWeight: 600 }}>
            Zero-Knowledge Engine v2.0
          </span>
        </div>
      </div>

      {/* Center Tabs (Visible ONLY when Unlocked) */}
      {isUnlocked && (
        <>
          <div className="nav-tabs">
            <button
              onClick={() => setActiveTab('vault')}
              className={`btn ${activeTab === 'vault' ? 'btn-active' : 'btn-ghost'}`}
            >
              <Lock style={{ width: 16, height: 16 }} /> Vault
            </button>

            <button
              onClick={() => setActiveTab('generator')}
              className={`btn ${activeTab === 'generator' ? 'btn-active' : 'btn-ghost'}`}
            >
              <Key style={{ width: 16, height: 16 }} /> Generator
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`btn ${activeTab === 'audit' ? 'btn-active' : 'btn-ghost'}`}
            >
              <Cpu style={{ width: 16, height: 16 }} /> Security Audit
            </button>

            {userSession?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`btn ${activeTab === 'admin' ? 'btn-active' : 'btn-ghost'}`}
              >
                <Server style={{ width: 16, height: 16 }} /> Admin Console
              </button>
            )}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {userSession && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', borderRadius: '0.5rem', background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.3)', fontSize: '0.8125rem', color: '#38bdf8', fontWeight: 600 }}>
                <User style={{ width: 14, height: 14 }} /> {userSession.username || userSession.email}
              </span>
            )}

            <button
              onClick={onOpenInspector}
              className="btn btn-ghost"
              style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)', background: 'rgba(14, 165, 233, 0.1)' }}
            >
              <Terminal style={{ width: 15, height: 15 }} /> Engine Inspector
            </button>

            <button
              onClick={onLockVault}
              className="btn btn-ghost"
              style={{ color: '#f43f5e', borderColor: 'rgba(244, 63, 94, 0.3)' }}
            >
              <Lock style={{ width: 15, height: 15 }} /> Lock
            </button>
          </div>
        </>
      )}
    </header>
  );
};
