import React, { useState } from 'react';
import { VaultItem, DecryptedVaultItem } from '../types';
import { Search, Plus, Eye, EyeOff, Copy, Check, Trash2, Lock, Globe, Briefcase, User, Landmark, Tag, Zap, ShieldCheck } from 'lucide-react';

interface VaultViewProps {
  items: DecryptedVaultItem[];
  onAddItem: (item: { applicationName: string; applicationUsername: string; password: string; category: VaultItem['category'] }) => void;
  onDeleteItem: (id: string) => void;
  onSearchChange: (query: string) => void;
  searchQuery: string;
}

export const VaultView: React.FC<VaultViewProps> = ({
  items,
  onAddItem,
  onDeleteItem,
  onSearchChange,
  searchQuery,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<{ [id: string]: boolean }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [appName, setAppName] = useState('');
  const [appUsername, setAppUsername] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [category, setCategory] = useState<VaultItem['category']>('web');

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName || !appUsername || !appPassword) return;
    onAddItem({
      applicationName: appName,
      applicationUsername: appUsername,
      password: appPassword,
      category,
    });
    setAppName('');
    setAppUsername('');
    setAppPassword('');
    setShowAddModal(false);
  };

  const getCategoryIcon = (cat: VaultItem['category']) => {
    switch (cat) {
      case 'web': return <Globe style={{ width: 14, height: 14, color: '#38bdf8' }} />;
      case 'banking': return <Landmark style={{ width: 14, height: 14, color: '#10b981' }} />;
      case 'work': return <Briefcase style={{ width: 14, height: 14, color: '#a855f7' }} />;
      default: return <Tag style={{ width: 14, height: 14, color: '#06b6d4' }} />;
    }
  };

  return (
    <div>
      {/* Top Quick Stats Banner */}
      <div className="stats-banner">
        <div className="stat-card">
          <div className="stat-icon cyan">
            <Lock style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <div className="stat-val">{items.length}</div>
            <div className="stat-lbl">Encrypted Entries</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon emerald">
            <ShieldCheck style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <div className="stat-val">Zero-Knowledge</div>
            <div className="stat-lbl">Client AES-256-GCM</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <Zap style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <div className="stat-val">O(K) Trie Engine</div>
            <div className="stat-lbl">Prefix Search Active</div>
          </div>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '18rem' }}>
          <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#64748b' }} />
          <input
            type="text"
            className="input-glass"
            placeholder="Search vault (Trie O(K) Engine prefix search)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ width: '100%', paddingLeft: '2.75rem' }}
          />
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn btn-gradient">
          <Plus style={{ width: 18, height: 18 }} /> Add Vault Item
        </button>
      </div>

      {/* Items Grid */}
      {items.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <Lock style={{ width: 48, height: 48, color: '#64748b', margin: '0 auto 1rem auto' }} />
          <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>No Vault Items Found</h4>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Click "Add Vault Item" to create your first encrypted password.</p>
          <button onClick={() => setShowAddModal(true)} className="btn btn-gradient">
            <Plus style={{ width: 18, height: 18 }} /> Create First Item
          </button>
        </div>
      ) : (
        <div className="vault-grid">
          {items.map((item) => {
            const isVisible = visiblePasswords[item.id];
            const isCopied = copiedId === item.id;

            return (
              <div key={item.id} className="glass-panel vault-item-card">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className="category-tag">
                        {getCategoryIcon(item.category)} {item.category}
                      </span>
                      {item.isBreached && (
                        <span style={{ fontSize: '0.6875rem', background: 'rgba(244, 63, 94, 0.2)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.4)', borderRadius: '0.25rem', padding: '0.125rem 0.375rem', fontWeight: 600 }}>
                          Weak Password
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="icon-btn danger"
                      title="Delete entry"
                    >
                      <Trash2 style={{ width: 16, height: 16 }} />
                    </button>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.25rem' }}>
                    {item.applicationName}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <User style={{ width: 14, height: 14, color: '#64748b' }} /> {item.applicationUsername}
                  </p>
                </div>

                {/* Password Display Box */}
                <div className="password-box">
                  <span className="password-text">
                    {isVisible ? item.password : '••••••••••••••••'}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <button
                      onClick={() => togglePasswordVisibility(item.id)}
                      className="icon-btn"
                      title={isVisible ? 'Hide Password' : 'Show Password'}
                    >
                      {isVisible ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                    </button>

                    <button
                      onClick={() => handleCopy(item.id, item.password)}
                      className="icon-btn"
                      style={{ color: isCopied ? '#10b981' : '#38bdf8' }}
                      title="Copy Password"
                    >
                      {isCopied ? <Check style={{ width: 16, height: 16 }} /> : <Copy style={{ width: 16, height: 16 }} />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel glass-panel-glow" style={{ maxWidth: '28rem', width: '100%', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '1.5rem', color: '#f8fafc' }}>Add New Vault Item</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: '#94a3b8', marginBottom: '0.375rem', fontWeight: 600 }}>Application Name</label>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="e.g. GitHub, Netflix, Bank"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: '#94a3b8', marginBottom: '0.375rem', fontWeight: 600 }}>Username / Email</label>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="e.g. user@example.com"
                  value={appUsername}
                  onChange={(e) => setAppUsername(e.target.value)}
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: '#94a3b8', marginBottom: '0.375rem', fontWeight: 600 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showAddPassword ? 'text' : 'password'}
                    className="input-glass"
                    placeholder="Enter application password"
                    value={appPassword}
                    onChange={(e) => setAppPassword(e.target.value)}
                    style={{ width: '100%', paddingRight: '2.5rem' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPassword(!showAddPassword)}
                    className="icon-btn"
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
                    title={showAddPassword ? 'Hide password' : 'Show password'}
                  >
                    {showAddPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: '#94a3b8', marginBottom: '0.375rem', fontWeight: 600 }}>Category</label>
                <select
                  className="input-glass"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as VaultItem['category'])}
                  style={{ width: '100%', cursor: 'pointer' }}
                >
                  <option value="web">Web Account</option>
                  <option value="banking">Banking & Finance</option>
                  <option value="work">Work & Infrastructure</option>
                  <option value="social">Social Media</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-ghost" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-gradient" style={{ flex: 1 }}>
                  Save Encrypted
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
