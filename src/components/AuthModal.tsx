import React, { useState, useEffect } from 'react';
import { Shield, Lock, Mail, User, AlertCircle, Key, ArrowRight, CheckCircle, RefreshCw } from 'lucide-react';
import { UserSession } from '../types';

interface AuthModalProps {
  onUnlockLocal: (masterPassword: string) => Promise<void>;
  onRegisterAccount: (email: string, username: string, masterPassword: string) => Promise<void>;
  onLoginAccount: (email: string, masterPassword: string) => Promise<void>;
  isDeriving: boolean;
  error?: string;
  userSession?: UserSession | null;
  onClearSession?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onUnlockLocal,
  onRegisterAccount,
  onLoginAccount,
  isDeriving,
  error,
  userSession,
  onClearSession,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'demo'>('login');

  // Form Fields
  const [email, setEmail] = useState(userSession?.email || '');
  const [username, setUsername] = useState(userSession?.username || '');
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (userSession?.email) {
      setEmail(userSession.email);
    }
    if (userSession?.username) {
      setUsername(userSession.username);
    }
  }, [userSession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!masterPassword) {
      setLocalError('Please enter your Master Password.');
      return;
    }

    if (userSession) {
      // OAuth or pre-populated user session unlock
      await onLoginAccount(email || userSession.email, masterPassword);
      return;
    }

    if (authMode === 'signup') {
      if (masterPassword !== confirmPassword) {
        setLocalError('Master Passwords do not match.');
        return;
      }
      if (!email || !username) {
        setLocalError('Please fill in all required fields.');
        return;
      }
      await onRegisterAccount(email, username, masterPassword);
    } else if (authMode === 'login') {
      if (!email) {
        setLocalError('Please enter your Email Address.');
        return;
      }
      await onLoginAccount(email, masterPassword);
    } else {
      await onUnlockLocal(masterPassword);
    }
  };

  const handleOAuthLogin = (provider: 'google' | 'github') => {
    window.location.href = `/api/v1/auth/${provider}`;
  };

  const displayError = localError || error;
  const isOAuthSession = Boolean(userSession);
  const isGitHub =
    userSession?.provider === 'github' ||
    userSession?.username?.toLowerCase().includes('github') ||
    userSession?.email?.toLowerCase().includes('github');

  // Dedicated OAuth Authenticated Unlock View
  if (isOAuthSession) {
    return (
      <div className="glass-panel glass-panel-glow" style={{ maxWidth: '28rem', margin: '3rem auto', padding: '2.5rem 2rem' }}>
        {/* OAuth Provider Badge Circle */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: isGitHub
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(15, 23, 42, 0.8))'
            : 'linear-gradient(135deg, rgba(66, 133, 244, 0.2), rgba(52, 168, 83, 0.2))',
          border: isGitHub ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(66, 133, 244, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem auto',
          boxShadow: '0 0 30px rgba(6, 182, 212, 0.3)'
        }}>
          {isGitHub ? (
            <svg style={{ width: 32, height: 32, fill: '#f8fafc' }} viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          ) : (
            <svg style={{ width: 28, height: 28 }} viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          )}
        </div>

        <h2 style={{ fontSize: '1.625rem', fontWeight: 800, color: '#f8fafc', textAlign: 'center', marginBottom: '0.375rem' }}>
          Welcome Back, {userSession?.username || 'User'}!
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.375rem 0.875rem',
            borderRadius: '1rem',
            background: 'rgba(6, 182, 212, 0.12)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            fontSize: '0.8125rem',
            color: '#38bdf8',
            fontWeight: 600
          }}>
            <CheckCircle style={{ width: 14, height: 14, color: '#10b981' }} />
            Verified via {isGitHub ? 'GitHub' : 'Google'} • {userSession?.email}
          </span>
        </div>

        <p style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          OAuth Identity Verified. Enter your Master Password to derive your 256-bit AES-GCM Master Encryption Key.
        </p>

        {displayError && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '0.625rem', padding: '0.75rem 1rem', color: '#f43f5e', fontSize: '0.8125rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} /> {displayError}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', color: '#94a3b8', marginBottom: '0.375rem', fontWeight: 600 }}>
              Master Encryption Password
            </label>
            <div style={{ position: 'relative' }}>
              <Key style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#06b6d4' }} />
              <input
                type="password"
                className="input-glass"
                placeholder="Enter Master Password..."
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.5rem' }}
                autoFocus
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-gradient"
            disabled={isDeriving}
            style={{ width: '100%', padding: '0.875rem', fontSize: '0.9375rem', justifyContent: 'center' }}
          >
            {isDeriving ? (
              'Deriving Keys (100k rounds)...'
            ) : (
              <>
                Decrypt & Unlock Vault
                <ArrowRight style={{ width: 16, height: 16 }} />
              </>
            )}
          </button>
        </form>

        {onClearSession && (
          <button
            type="button"
            onClick={onClearSession}
            className="btn btn-ghost"
            style={{ width: '100%', marginTop: '1rem', padding: '0.5rem', fontSize: '0.8125rem', justifyContent: 'center', color: '#64748b' }}
          >
            <RefreshCw style={{ width: 14, height: 14 }} /> Switch account or sign in with email
          </button>
        )}

        {/* Zero-Knowledge Security Badge */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center', fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
          <Shield style={{ width: 14, height: 14, color: '#06b6d4' }} />
          <span>Zero-Knowledge: Master Password never leaves your browser.</span>
        </div>
      </div>
    );
  }

  // Standard Login / Signup / Quick Unlock View
  return (
    <div className="glass-panel glass-panel-glow" style={{ maxWidth: '28rem', margin: '3rem auto', padding: '2.5rem 2rem' }}>
      {/* Top Icon Badge */}
      <div style={{
        width: 60,
        height: 60,
        borderRadius: '1.25rem',
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(99, 102, 241, 0.2))',
        border: '1px solid rgba(6, 182, 212, 0.4)',
        color: '#06b6d4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1.25rem auto',
        boxShadow: '0 0 25px rgba(6, 182, 212, 0.25)'
      }}>
        <Lock style={{ width: 28, height: 28 }} />
      </div>

      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', textAlign: 'center', marginBottom: '0.375rem' }}>
        {authMode === 'login' ? 'Welcome Back' : authMode === 'signup' ? 'Create Vault Account' : 'Instant Vault Unlock'}
      </h2>

      <p style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1.5rem', lineHeight: 1.5 }}>
        {authMode === 'login'
          ? 'Enter your email and Master Password to derive your Zero-Knowledge encryption keys.'
          : authMode === 'signup'
          ? 'Register your account with client-derived zero-knowledge keys.'
          : 'Unlock local encrypted vault instantly without a cloud account.'}
      </p>

      {/* Mode Selector Tabs */}
      <div style={{ display: 'flex', gap: '0.375rem', background: 'rgba(10, 14, 23, 0.8)', padding: '0.25rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '1.5rem' }}>
        <button
          onClick={() => { setAuthMode('login'); setLocalError(''); }}
          className={`btn ${authMode === 'login' ? 'btn-active' : 'btn-ghost'}`}
          style={{ flex: 1, padding: '0.5rem', fontSize: '0.8125rem' }}
        >
          Sign In
        </button>
        <button
          onClick={() => { setAuthMode('signup'); setLocalError(''); }}
          className={`btn ${authMode === 'signup' ? 'btn-active' : 'btn-ghost'}`}
          style={{ flex: 1, padding: '0.5rem', fontSize: '0.8125rem' }}
        >
          Sign Up
        </button>
        <button
          onClick={() => { setAuthMode('demo'); setLocalError(''); }}
          className={`btn ${authMode === 'demo' ? 'btn-active' : 'btn-ghost'}`}
          style={{ flex: 1, padding: '0.5rem', fontSize: '0.8125rem' }}
        >
          Quick Unlock
        </button>
      </div>

      {/* Passport OAuth Buttons */}
      {authMode !== 'demo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.25rem' }}>
          <button
            type="button"
            onClick={() => handleOAuthLogin('google')}
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'center', gap: '0.625rem', padding: '0.6875rem' }}
          >
            <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Continue with Google
          </button>

          <button
            type="button"
            onClick={() => handleOAuthLogin('github')}
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'center', gap: '0.625rem', padding: '0.6875rem' }}
          >
            <svg style={{ width: 18, height: 18, fill: '#f8fafc' }} viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Continue with GitHub
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.5rem 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.08)' }} />
            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>or with email</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.08)' }} />
          </div>
        </div>
      )}

      {displayError && (
        <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '0.625rem', padding: '0.75rem 1rem', color: '#f43f5e', fontSize: '0.8125rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} /> {displayError}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {(authMode === 'login' || authMode === 'signup') && (
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', color: '#94a3b8', marginBottom: '0.375rem', fontWeight: 600 }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#64748b' }} />
              <input
                type="email"
                className="input-glass"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.5rem' }}
                required={authMode === 'login' || authMode === 'signup'}
              />
            </div>
          </div>
        )}

        {authMode === 'signup' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', color: '#94a3b8', marginBottom: '0.375rem', fontWeight: 600 }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#64748b' }} />
              <input
                type="text"
                className="input-glass"
                placeholder="Choose username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.5rem' }}
                required
              />
            </div>
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', color: '#94a3b8', marginBottom: '0.375rem', fontWeight: 600 }}>
            Master Password
          </label>
          <div style={{ position: 'relative' }}>
            <Key style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#64748b' }} />
            <input
              type="password"
              className="input-glass"
              placeholder={authMode === 'demo' ? 'Enter any master password...' : 'Enter Master Password'}
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              style={{ width: '100%', paddingLeft: '2.5rem' }}
              autoFocus
              required
            />
          </div>
        </div>

        {authMode === 'signup' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', color: '#94a3b8', marginBottom: '0.375rem', fontWeight: 600 }}>
              Confirm Master Password
            </label>
            <div style={{ position: 'relative' }}>
              <Key style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#64748b' }} />
              <input
                type="password"
                className="input-glass"
                placeholder="Re-enter Master Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.5rem' }}
                required
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-gradient"
          disabled={isDeriving}
          style={{ width: '100%', padding: '0.875rem', fontSize: '0.9375rem', justifyContent: 'center', marginTop: '0.5rem' }}
        >
          {isDeriving ? (
            'Deriving Keys (100k rounds)...'
          ) : (
            <>
              {authMode === 'login' ? 'Sign In & Unlock' : authMode === 'signup' ? 'Create Zero-Knowledge Account' : 'Instant Unlock Vault'}
              <ArrowRight style={{ width: 16, height: 16 }} />
            </>
          )}
        </button>
      </form>

      {/* Zero-Knowledge Security Badge */}
      <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center', fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
        <Shield style={{ width: 14, height: 14, color: '#06b6d4' }} />
        <span>Master Password is never sent to the server.</span>
      </div>
    </div>
  );
};
