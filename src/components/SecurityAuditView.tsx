import React, { useMemo } from 'react';
import { DecryptedVaultItem } from '../types';
import { PasswordSimilarityAuditor } from '../engines/levenshtein';
import { PasswordBloomFilter } from '../engines/bloomFilter';
import { PasswordStrengthEngine } from '../engines/strengthEngine';
import { AlertTriangle, Cpu, CheckCircle2, ShieldAlert } from 'lucide-react';

interface SecurityAuditViewProps {
  items: DecryptedVaultItem[];
}

export const SecurityAuditView: React.FC<SecurityAuditViewProps> = ({ items }) => {
  const auditor = useMemo(() => new PasswordSimilarityAuditor(), []);
  const bloomFilter = useMemo(() => new PasswordBloomFilter(), []);
  const strengthEngine = useMemo(() => new PasswordStrengthEngine(bloomFilter), [bloomFilter]);

  const passwordsMap = items.map(item => ({ appName: item.applicationName, password: item.password }));
  const reusedClusters = auditor.findSimilarPasswords(passwordsMap, 3);

  const itemsWithAudit = items.map(item => ({
    item,
    audit: strengthEngine.evaluate(item.password),
  }));

  const weakItems = itemsWithAudit.filter(
    ({ audit }) => audit.label === 'Very Weak' || audit.label === 'Weak' || audit.isBreachedOrCommon
  );

  const total = items.length;
  const reusedCount = reusedClusters.length;

  const calculateScore = () => {
    if (total === 0) return 100;
    let sumScore = 0;
    itemsWithAudit.forEach(({ audit }) => {
      sumScore += audit.score;
    });
    let avgScore = sumScore / total;
    if (reusedCount > 0) {
      avgScore -= (reusedCount / total) * 30;
    }
    return Math.max(0, Math.round(avgScore));
  };

  const overallScore = calculateScore();

  return (
    <div style={{ maxWidth: '52rem', margin: '0 auto' }}>
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Vault Health Assessment
          </span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', margin: '0.25rem 0' }}>
            Security Score Card
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            Audited via Heuristic Strength Rules, Shannon Entropy, Levenshtein DP Matrix & Bloom Filter Bit Array.
          </p>
        </div>

        <div style={{
          width: 100,
          height: 100,
          borderRadius: '50%',
          border: `4px solid ${overallScore > 75 ? '#10b981' : overallScore > 50 ? '#eab308' : '#f43f5e'}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(15, 23, 42, 0.8)',
          boxShadow: `0 0 25px ${overallScore > 75 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'}`
        }}>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc' }}>{overallScore}%</span>
          <span style={{ fontSize: '0.6875rem', color: '#94a3b8', textTransform: 'uppercase' }}>Score</span>
        </div>
      </div>

      {/* Weak & Low Strength Passwords */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle style={{ width: 20, height: 20, color: '#f43f5e' }} />
          Weak, Breached & Low Entropy Passwords
        </h3>

        {weakItems.length === 0 ? (
          <p style={{ color: '#10b981', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 style={{ width: 16, height: 16 }} /> No weak, low entropy, or common breached passwords detected.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {weakItems.map(({ item, audit }) => (
              <div key={item.id} style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '0.5rem', padding: '0.875rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldAlert style={{ width: 18, height: 18, color: '#f43f5e' }} />
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>{item.applicationName}</h4>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>({item.applicationUsername})</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(244, 63, 94, 0.2)', color: '#f43f5e', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: 700 }}>
                    {audit.label} ({audit.score}/100)
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8125rem', color: '#fca5a5' }}>
                  {audit.issues.map((issue, idx) => (
                    <div key={idx}>• {issue}</div>
                  ))}
                </div>

                {audit.suggestions.length > 0 && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#38bdf8' }}>
                    💡 Recommendation: {audit.suggestions.join(' ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reused Passwords (Levenshtein DP Engine) */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Cpu style={{ width: 20, height: 20, color: '#a855f7' }} />
          Password Similarity & Reuse Clusters (Levenshtein DP Matrix)
        </h3>

        {reusedClusters.length === 0 ? (
          <p style={{ color: '#10b981', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 style={{ width: 16, height: 16 }} /> No password reuse or high-similarity clusters detected.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {reusedClusters.map((cluster, idx) => (
              <div key={idx} style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '0.5rem', padding: '0.875rem 1rem' }}>
                <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.375rem' }}>
                  Target: {cluster.appName}
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#c084fc' }}>
                  Similar or reused passwords found in: {cluster.similarApps.map(a => `${a.appName} (Edit Dist: ${a.editDistance})`).join(', ')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
