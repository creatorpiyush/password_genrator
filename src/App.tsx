import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { VaultView } from './components/VaultView';
import { GeneratorView } from './components/GeneratorView';
import { SecurityAuditView } from './components/SecurityAuditView';
import { AdminConsoleView } from './components/AdminConsoleView';
import { InspectorModal } from './components/InspectorModal';
import { ProfileModal } from './components/ProfileModal';
import { AuthModal } from './components/AuthModal';
import { ImportExportModal } from './components/ImportExportModal';
import { ShareSecretModal } from './components/ShareSecretModal';
import { PublicShareView } from './components/PublicShareView';
import { ImportedCredential } from './services/importExportService';
import { VaultTrie } from './engines/trie';
import { PasswordBloomFilter } from './engines/bloomFilter';
import { PasswordGenerator } from './engines/generator';
import { DecryptedLRUCache } from './engines/lruCache';
import { KeyDerivationEngine } from './crypto/keyDerivation';
import { AesGcmEngine } from './crypto/aesGcm';
import { EncryptedIndexedDB } from './store/indexedDb';
import { SyncEngine } from './store/syncEngine';
import { VaultItem, DecryptedVaultItem, VaultEngineStats, UserSession } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'vault' | 'generator' | 'audit' | 'admin'>('vault');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [userSalt, setUserSalt] = useState<string>('');
  const [mekKey, setMekKey] = useState<CryptoKey | null>(null);
  const [unlockError, setUnlockError] = useState<string>('');
  const [isDeriving, setIsDeriving] = useState<boolean>(false);

  // Vault Items & Engine Instances
  const [encryptedItems, setEncryptedItems] = useState<VaultItem[]>([]);
  const [decryptedItems, setDecryptedItems] = useState<DecryptedVaultItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState<boolean>(false);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);

  // Check if current URL is a Public Share Link (#share=...&key=...)
  const isShareViewRoute = window.location.hash.includes('share=');

  const [trieEngine] = useState(() => new VaultTrie());
  const [bloomFilter] = useState(() => new PasswordBloomFilter());
  const [lruCache] = useState(() => new DecryptedLRUCache<string, string>(20, 300000));
  const [idb] = useState(() => new EncryptedIndexedDB());
  const [syncEngine] = useState(() => new SyncEngine());

  // Restore session from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('sentinel_active_session');
    if (stored) {
      try {
        const sessionObj: UserSession = JSON.parse(stored);
        setUserSession(sessionObj);
        if (sessionObj.salt) setUserSalt(sessionObj.salt);
      } catch (err) {}
    }
  }, []);

  // Save active session to sessionStorage when updated
  useEffect(() => {
    if (userSession) {
      sessionStorage.setItem('sentinel_active_session', JSON.stringify(userSession));
    }
  }, [userSession]);

  // Handle Passport OAuth Return URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('oauth') === 'success') {
      fetch('/api/v1/auth/me', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.email) {
            setUserSalt(data.salt);
            setUserSession({
              email: data.email,
              username: data.username,
              token: `oauth_${Date.now()}`,
              salt: data.salt,
              provider: data.provider || 'local',
              role: data.role || 'user',
            });
          }
        })
        .catch(() => {});

      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Initial Load of Encrypted Items from IndexedDB
  useEffect(() => {
    idb.getAllVaultItems().then(items => {
      if (items.length === 0) {
        const sampleSalt = KeyDerivationEngine.generateSalt();
        setUserSalt(sampleSalt);
      } else {
        setEncryptedItems(items);
      }
    });
  }, []);

  // Update Trie Engine whenever decrypted items change
  useEffect(() => {
    trieEngine.clear();
    decryptedItems.forEach(item => {
      trieEngine.insert(item.applicationName, {
        id: item.id,
        applicationName: item.applicationName,
        applicationUsername: item.applicationUsername,
        category: item.category,
      });
    });
  }, [decryptedItems]);

  // Decrypt Items Helper
  const decryptVaultItems = async (items: VaultItem[], mek: CryptoKey) => {
    const decryptedList: DecryptedVaultItem[] = [];
    for (const item of items) {
      try {
        const plain = await AesGcmEngine.decrypt(item.encryptedPassword, mek);
        lruCache.put(item.id, plain);

        const entropy = PasswordGenerator.calculateEntropy(plain);
        const { encryptedPassword, ...itemWithoutPayload } = item;
        decryptedList.push({
          ...itemWithoutPayload,
          password: plain,
          strengthEntropy: entropy,
          isBreached: bloomFilter.mightContain(plain) || plain.length < 8 || entropy < 40,
        });
      } catch (err) {
        // Failed decryption block handled silently for memory safety
      }
    }
    setDecryptedItems(decryptedList);
  };

  // 1. Instant Quick Unlock
  const handleUnlockLocal = async (masterPassword: string) => {
    setIsDeriving(true);
    setUnlockError('');

    try {
      const salt = userSalt || KeyDerivationEngine.generateSalt();
      setUserSalt(salt);

      const derived = await KeyDerivationEngine.deriveKeys(masterPassword, salt);
      setMekKey(derived.masterEncryptionKey);
      setIsUnlocked(true);
      setUserSession({ email: 'local_guest', username: 'Guest Vault', token: 'local', salt });

      await decryptVaultItems(encryptedItems, derived.masterEncryptionKey);
    } catch (err: any) {
      setUnlockError(err.message || 'Unlock failed');
    } finally {
      setIsDeriving(false);
    }
  };

  // 2. Sign Up Account
  const handleRegisterAccount = async (email: string, username: string, masterPassword: string) => {
    setIsDeriving(true);
    setUnlockError('');

    try {
      const salt = KeyDerivationEngine.generateSalt();
      const derived = await KeyDerivationEngine.deriveKeys(masterPassword, salt);

      // Register with backend Express API
      try {
        const res = await fetch('/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, username, salt, authKeyHash: derived.authKeyHash }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');
      } catch (apiErr) {
        // Fallback for offline usage
      }

      setMekKey(derived.masterEncryptionKey);
      setUserSalt(salt);
      setIsUnlocked(true);
      setUserSession({ email, username, token: `zk_${Date.now()}`, salt });

      await decryptVaultItems(encryptedItems, derived.masterEncryptionKey);
    } catch (err: any) {
      setUnlockError(err.message || 'Account registration failed');
    } finally {
      setIsDeriving(false);
    }
  };

  // 3. Sign In Account
  const handleLoginAccount = async (email: string, masterPassword: string) => {
    setIsDeriving(true);
    setUnlockError('');
    const currentProvider = userSession?.provider || 'local';

    let remoteItems: VaultItem[] = [];
    let activeUsername = email.split('@')[0];
    let userRole: 'admin' | 'user' = 'user';

    try {
      // 1. Fetch user salt & details from backend if salt isn't set yet
      let salt = userSalt;
      try {
        const infoRes = await fetch(`/api/v1/auth/user-info?email=${encodeURIComponent(email)}`);
        const infoData = await infoRes.json();
        if (infoData.success && infoData.salt) {
          salt = infoData.salt;
          setUserSalt(salt);
          if (infoData.username) activeUsername = infoData.username;
          if (infoData.role) userRole = infoData.role;
        }
      } catch (err) {}

      if (!salt) {
        salt = KeyDerivationEngine.generateSalt();
        setUserSalt(salt);
      }

      // 2. Derive encryption keys with account salt
      const derived = await KeyDerivationEngine.deriveKeys(masterPassword, salt);

      let jwtAccessToken = '';
      let jwtRefreshToken = '';

      // 3. Authenticate with backend Express API
      try {
        const res = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, authKeyHash: derived.authKeyHash }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          activeUsername = data.username || activeUsername;
          if (data.role) userRole = data.role;
          if (data.salt) {
            salt = data.salt;
            setUserSalt(salt);
          }
          if (data.accessToken) jwtAccessToken = data.accessToken;
          if (data.refreshToken) jwtRefreshToken = data.refreshToken;
        }
      } catch (apiErr) {
        // Fallback for offline usage
      }

      // 4. Pull remote encrypted vault items from database
      try {
        const headers: Record<string, string> = {};
        if (jwtAccessToken) headers['Authorization'] = `Bearer ${jwtAccessToken}`;
        const pullRes = await fetch(`/api/v1/vault/pull?email=${encodeURIComponent(email)}`, { headers });
        const pullData = await pullRes.json();
        if (pullData && Array.isArray(pullData.items)) {
          remoteItems = pullData.items;
        }
      } catch (pullErr) {}

      // 5. Read local items from IndexedDB
      const localItems = await idb.getAllVaultItems();

      // 6. CRDT LWW Conflict Resolution (merge remote + local items)
      const mergedItems = syncEngine.resolveLWWConflict(localItems, remoteItems);
      setEncryptedItems(mergedItems);

      // 7. Persist merged items to IndexedDB
      for (const item of mergedItems) {
        await idb.saveVaultItem(item);
      }

      setMekKey(derived.masterEncryptionKey);
      setIsUnlocked(true);
      setUserSession({
        email,
        username: activeUsername,
        token: jwtAccessToken || `zk_${Date.now()}`,
        accessToken: jwtAccessToken,
        refreshToken: jwtRefreshToken,
        salt,
        role: userRole,
        provider: currentProvider,
      });

      await decryptVaultItems(mergedItems, derived.masterEncryptionKey);
    } catch (err: any) {
      setUnlockError(err.message || 'Sign in failed');
    } finally {
      setIsDeriving(false);
    }
  };

  const handleLockVault = () => {
    lruCache.clear();
    setMekKey(null);
    setIsUnlocked(false);
    setUserSession(null);
    sessionStorage.removeItem('sentinel_active_session');
    setDecryptedItems([]);
  };

  // Add Item to Encrypted Vault
  const handleAddItem = async (newItemData: { applicationName: string; applicationUsername: string; password: string; category: VaultItem['category'] }) => {
    if (!mekKey) return;

    const encryptedPayload = await AesGcmEngine.encrypt(newItemData.password, mekKey);
    const newItem: VaultItem = {
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      applicationName: newItemData.applicationName,
      applicationUsername: newItemData.applicationUsername,
      encryptedPassword: encryptedPayload,
      category: newItemData.category,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updatedEncryptedItems = [...encryptedItems, newItem];
    await syncEngine.recordMutation('UPSERT', newItem);
    setEncryptedItems(updatedEncryptedItems);

    // Async sync to backend API if logged in
    if (userSession && userSession.email !== 'local_guest') {
      fetch('/api/v1/vault/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userSession.token}`,
        },
        body: JSON.stringify({ email: userSession.email, encryptedItems: updatedEncryptedItems }),
      }).catch(() => {});
    }

    const entropy = PasswordGenerator.calculateEntropy(newItemData.password);
    const decryptedNewItem: DecryptedVaultItem = {
      ...newItem,
      password: newItemData.password,
      strengthEntropy: entropy,
      isBreached: bloomFilter.mightContain(newItemData.password) || newItemData.password.length < 8 || entropy < 40,
    };

    lruCache.put(newItem.id, newItemData.password);
    setDecryptedItems(prev => [...prev, decryptedNewItem]);
  };

  // Delete Vault Item
  const handleDeleteItem = async (id: string) => {
    const itemToDelete = encryptedItems.find(i => i.id === id);
    if (itemToDelete) {
      await idb.deleteVaultItem(id);
      await syncEngine.recordMutation('DELETE', itemToDelete);
    }

    const updatedEncrypted = encryptedItems.filter(i => i.id !== id);
    setEncryptedItems(updatedEncrypted);
    setDecryptedItems(prev => prev.filter(i => i.id !== id));

    if (userSession && userSession.email !== 'local_guest') {
      fetch('/api/v1/vault/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userSession.token}`,
        },
        body: JSON.stringify({ email: userSession.email, encryptedItems: updatedEncrypted }),
      }).catch(() => {});
    }
  };

  // Batch Import Credentials (from Bitwarden, 1Password, or Encrypted JSON)
  const handleBatchImportItems = async (importedList: ImportedCredential[]) => {
    if (!mekKey) return;

    const newVaultItems: VaultItem[] = [];
    const newDecryptedItems: DecryptedVaultItem[] = [];

    for (const item of importedList) {
      const encryptedPayload = await AesGcmEngine.encrypt(item.password, mekKey);
      const newItem: VaultItem = {
        id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        applicationName: item.applicationName,
        applicationUsername: item.applicationUsername,
        encryptedPassword: encryptedPayload,
        category: item.category || 'web',
        notes: item.notes,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      newVaultItems.push(newItem);
      await idb.saveVaultItem(newItem);
      await syncEngine.recordMutation('UPSERT', newItem);

      const entropy = PasswordGenerator.calculateEntropy(item.password);
      newDecryptedItems.push({
        ...newItem,
        password: item.password,
        strengthEntropy: entropy,
        isBreached: bloomFilter.mightContain(item.password) || item.password.length < 8 || entropy < 40,
      });

      lruCache.put(newItem.id, item.password);
    }

    const updatedEncrypted = [...encryptedItems, ...newVaultItems];
    setEncryptedItems(updatedEncrypted);
    setDecryptedItems(prev => [...prev, ...newDecryptedItems]);

    if (userSession && userSession.email !== 'local_guest') {
      fetch('/api/v1/vault/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userSession.token}`,
        },
        body: JSON.stringify({ email: userSession.email, encryptedItems: updatedEncrypted }),
      }).catch(() => {});
    }
  };

  // Trie-based Filtered Search Results
  const filteredItems = searchQuery
    ? trieEngine.searchPrefix(searchQuery).map(trieMatch => {
        return decryptedItems.find(item => item.id === trieMatch.id)!;
      }).filter(Boolean)
    : decryptedItems;

  const engineStats: VaultEngineStats = {
    trieNodeCount: trieEngine.getNodeCount(),
    bloomFilterBits: 958505,
    bloomFilterHashes: 7,
    lruCacheCapacity: lruCache.getCapacity(),
    lruCacheSize: lruCache.getSize(),
    levenshteinScans: decryptedItems.length,
  };

  if (isShareViewRoute) {
    return <PublicShareView />;
  }

  return (
    <div className="app-container">
      <div className="content-wrapper">
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenInspector={() => setIsInspectorOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenImportExport={() => setIsImportExportOpen(true)}
          onOpenShare={() => setIsShareOpen(true)}
          isUnlocked={isUnlocked}
          userSession={userSession}
          onLockVault={handleLockVault}
        />

        {!isUnlocked ? (
          /* Sign In / Sign Up / OAuth / Quick Unlock Auth Modal */
          <AuthModal
            onUnlockLocal={handleUnlockLocal}
            onRegisterAccount={handleRegisterAccount}
            onLoginAccount={handleLoginAccount}
            isDeriving={isDeriving}
            error={unlockError}
            userSession={userSession}
            onClearSession={() => {
              setUserSession(null);
              sessionStorage.removeItem('sentinel_active_session');
            }}
          />
        ) : (
          /* Active Views */
          <div>
            {activeTab === 'vault' && (
              <VaultView
                items={filteredItems}
                onAddItem={handleAddItem}
                onDeleteItem={handleDeleteItem}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            )}

            {activeTab === 'generator' && <GeneratorView />}

            {activeTab === 'audit' && <SecurityAuditView items={decryptedItems} />}

            {activeTab === 'admin' && (
              userSession?.role === 'admin' ? (
                <AdminConsoleView />
              ) : (
                <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f43f5e', marginBottom: '0.5rem' }}>403 - Access Denied</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Administrator privileges are required to view telemetry metrics.</p>
                </div>
              )
            )}
          </div>
        )}
      </div>

      <InspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        stats={engineStats}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userSession={userSession}
      />

      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        vaultItems={decryptedItems}
        onImportItems={handleBatchImportItems}
      />

      <ShareSecretModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
    </div>
  );
};

export default App;
