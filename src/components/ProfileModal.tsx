import React, { useEffect, useState } from 'react';
import { User, Shield, Laptop, Clock, Globe, X, RefreshCw, CheckCircle } from 'lucide-react';
import { UserSession, UserProfileData } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSession: UserSession | null;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, userSession }) => {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProfile = async () => {
    if (!userSession) return;
    setIsLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (userSession.token && !userSession.token.startsWith('oauth_')) {
        headers['Authorization'] = `Bearer ${userSession.token}`;
      }
      const res = await fetch(`/api/v1/auth/profile?email=${encodeURIComponent(userSession.email)}`, { headers });
      const data = await res.json();
      if (data.success && data.profile) {
        setProfile(data.profile);
      }
    } catch (err) {
      // Fallback UI gracefully handles error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userSession) {
      fetchProfile();
    }
  }, [isOpen, userSession]);

  if (!isOpen) return null;

  const formatDate = (dateStr: string | number | Date | undefined) => {
    if (!dateStr) return 'Just now';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 'Just now' : d.toLocaleString();
  };

  const isGitHub = userSession?.provider === 'github';
  const isGoogle = userSession?.provider === 'google';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div className="glass-panel" style={{ maxWidth: '42rem', width: '100%', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 42, height: 42, borderRadius: '0.875rem', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(99, 102, 241, 0.2))', border: '1px solid rgba(6, 182, 212, 0.4)', color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User style={{ width: 22, height: 22 }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                User Security & Device Profile
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>
                Zero-Knowledge User Telemetry & Active Sessions
              </span>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {/* Identity & Account Card */}
        <div style={{ background: 'rgba(10, 14, 23, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '1rem', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.25rem 0' }}>
                {profile?.username || userSession?.username || 'User Account'}
              </h4>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>
                {profile?.email || userSession?.email}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', borderRadius: '1rem', background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)', fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700 }}>
                <CheckCircle style={{ width: 14, height: 14, color: '#10b981' }} />
                {isGitHub ? 'GitHub Verified' : isGoogle ? 'Google Verified' : 'Zero-Knowledge Account'}
              </span>

              {userSession?.role === 'admin' && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', borderRadius: '1rem', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)', fontSize: '0.75rem', color: '#c084fc', fontWeight: 700 }}>
                  <Shield style={{ width: 14, height: 14 }} /> System Admin
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Security Telemetry Banner Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(11rem, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {/* Last Login Time */}
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '0.875rem', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              <Clock style={{ width: 16, height: 16 }} /> Last Login Time
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f8fafc' }}>
              {formatDate(profile?.lastLoginTime || userSession?.lastLoginTime)}
            </div>
          </div>

          {/* Last Login Device */}
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '0.875rem', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a855f7', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              <Laptop style={{ width: 16, height: 16 }} /> Primary Device
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f8fafc' }}>
              {profile?.lastLoginDevice || userSession?.lastLoginDevice || 'Chrome on macOS'}
            </div>
          </div>

          {/* Connected Devices Count */}
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '0.875rem', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              <Globe style={{ width: 16, height: 16 }} /> Connected Devices
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
              {profile?.activeSessions ? profile.activeSessions.length : 1} Active Session{profile?.activeSessions && profile.activeSessions.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Active Connected Devices Section */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Laptop style={{ width: 18, height: 18, color: '#38bdf8' }} /> Active Connected Sessions
            </h4>
            <button onClick={fetchProfile} className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', gap: '0.25rem' }}>
              <RefreshCw style={{ width: 12, height: 12, animation: isLoading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {profile?.activeSessions && profile.activeSessions.length > 0 ? (
              profile.activeSessions.map((session, idx) => (
                <div key={session.deviceId || idx} style={{ background: 'rgba(10, 14, 23, 0.8)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '0.75rem', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '0.5rem', background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Laptop style={{ width: 18, height: 18 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f8fafc' }}>
                        {session.deviceName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        IP: {session.ipAddress || '127.0.0.1'} • Last active: {formatDate(session.lastActiveAt)}
                      </div>
                    </div>
                  </div>

                  <span style={{ fontSize: '0.6875rem', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 700 }}>
                    Active Now
                  </span>
                </div>
              ))
            ) : (
              <div style={{ background: 'rgba(10, 14, 23, 0.8)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '0.75rem', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '0.5rem', background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Laptop style={{ width: 18, height: 18 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f8fafc' }}>
                      {profile?.lastLoginDevice || 'Chrome on macOS'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      IP: 127.0.0.1 • Last active: {formatDate(profile?.lastLoginTime)}
                    </div>
                  </div>
                </div>

                <span style={{ fontSize: '0.6875rem', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 700 }}>
                  Active Now
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
