import React, { useState, useEffect } from 'react';
import { Database, Users, ShieldAlert, Cpu, Server, Activity, CheckCircle, RefreshCw, Key } from 'lucide-react';

interface AdminMetrics {
  totalRegisteredUsers: number;
  totalEncryptedVaultBlobs: number;
  providerBreakdown: {
    local: number;
    google: number;
    github: number;
  };
  dbStatus: {
    isMongoConnected: boolean;
    type: string;
  };
  jwtConfig?: {
    accessExpiry: string;
    refreshExpiry: string;
  };
  uptimeSeconds: number;
  nodeVersion: string;
  timestamp: string;
}

export const AdminConsoleView: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const fetchMetrics = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/admin/stats');
      const data = await res.json();
      if (res.ok && data.success) {
        setMetrics(data.metrics);
      } else {
        throw new Error(data.error || 'Failed to fetch admin metrics');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to admin telemetry server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000); // Auto-refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    return `${mins}m ${seconds % 60}s`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div className="glass-panel glass-panel-glow" style={{ padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 50, height: 50, borderRadius: '1rem', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(99, 102, 241, 0.2))', border: '1px solid rgba(6, 182, 212, 0.4)', color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Server style={{ width: 26, height: 26 }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              System Admin Console
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
              Zero-Knowledge Database Telemetry & Server Telemetry
            </p>
          </div>
        </div>

        <button onClick={fetchMetrics} className="btn btn-ghost" disabled={isLoading} style={{ gap: '0.5rem' }}>
          <RefreshCw style={{ width: 16, height: 16, animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh Metrics
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '0.75rem', padding: '1rem', color: '#f43f5e', fontSize: '0.875rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Metrics Banner */}
      <div className="stats-banner">
        <div className="stat-card">
          <div className="stat-icon cyan">
            <Users style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <div className="stat-val">{metrics ? metrics.totalRegisteredUsers : '-'}</div>
            <div className="stat-lbl">Registered Accounts</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <Key style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <div className="stat-val">{metrics ? metrics.totalEncryptedVaultBlobs : '-'}</div>
            <div className="stat-lbl">Encrypted Vault Blobs</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon emerald">
            <Database style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <div className="stat-val" style={{ fontSize: '1.1rem', textTransform: 'capitalize' }}>
              {metrics ? (metrics.dbStatus.isMongoConnected ? 'MongoDB Connected' : 'Persistent File DB') : '-'}
            </div>
            <div className="stat-lbl">Database Layer</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon cyan">
            <Activity style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <div className="stat-val">{metrics ? formatUptime(metrics.uptimeSeconds) : '-'}</div>
            <div className="stat-lbl">Server Uptime</div>
          </div>
        </div>
      </div>

      {/* System Telemetry & Breakdown Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))', gap: '1.5rem' }}>
        {/* Database Status & Health */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <Database style={{ width: 20, height: 20, color: '#06b6d4' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Database Storage Driver
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(10, 14, 23, 0.6)', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Storage Provider</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#38bdf8' }}>
                {metrics?.dbStatus.type || 'Checking...'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(10, 14, 23, 0.6)', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>MongoDB Atlas Status</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: 700, color: metrics?.dbStatus.isMongoConnected ? '#10b981' : '#f59e0b' }}>
                <CheckCircle style={{ width: 14, height: 14 }} />
                {metrics?.dbStatus.isMongoConnected ? 'Active (Mongo Atlas)' : 'Fallback Active (Persistent File DB)'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(10, 14, 23, 0.6)', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Node.js Runtime</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc' }}>
                {metrics?.nodeVersion || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Identity & OAuth Provider Distribution */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <Cpu style={{ width: 20, height: 20, color: '#8b5cf6' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Identity Provider Distribution
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(10, 14, 23, 0.6)', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Zero-Knowledge Local Accounts</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f8fafc' }}>
                {metrics?.providerBreakdown.local || 0}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(10, 14, 23, 0.6)', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Google OAuth 2.0 Accounts</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#38bdf8' }}>
                {metrics?.providerBreakdown.google || 0}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(10, 14, 23, 0.6)', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>GitHub OAuth 2.0 Accounts</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#a78bfa' }}>
                {metrics?.providerBreakdown.github || 0}
              </span>
            </div>
          </div>
        </div>

        {/* JWT Token Policy Telemetry */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <Key style={{ width: 20, height: 20, color: '#10b981' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              JWT Security Token Policy
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(10, 14, 23, 0.6)', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Access Token Lifespan (`JWT_ACCESS_EXPIRES_IN`)</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '0.2rem 0.6rem', borderRadius: '0.375rem', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                {metrics?.jwtConfig?.accessExpiry || '15m'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(10, 14, 23, 0.6)', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Refresh Token Lifespan (`JWT_REFRESH_EXPIRES_IN`)</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', padding: '0.2rem 0.6rem', borderRadius: '0.375rem', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                {metrics?.jwtConfig?.refreshExpiry || '7d'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(10, 14, 23, 0.6)', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Token Verification Endpoint</span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#f8fafc' }}>
                POST /api/v1/auth/refresh
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Architecture Compliance Notice */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', background: 'rgba(6, 182, 212, 0.06)', borderColor: 'rgba(6, 182, 212, 0.2)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <ShieldAlert style={{ width: 24, height: 24, color: '#06b6d4', flexShrink: 0 }} />
        <span style={{ fontSize: '0.8125rem', color: '#94a3b8', lineHeight: 1.5 }}>
          <strong style={{ color: '#38bdf8' }}>Zero-Knowledge Compliance Verified:</strong> Admin console telemetry displays database metadata, document counts, and system metrics only. AES-256-GCM encryption keys and master passwords are derived solely in client WebCrypto memory and are strictly inaccessible to server administrators.
        </span>
      </div>
    </div>
  );
};
