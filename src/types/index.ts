export interface VaultItem {
  id: string;
  applicationName: string;
  applicationUsername: string;
  encryptedPassword: {
    iv: string;
    ciphertext: string;
  };
  category: 'web' | 'banking' | 'social' | 'work' | 'other';
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface DecryptedVaultItem extends Omit<VaultItem, 'encryptedPassword'> {
  password: string;
  strengthEntropy: number;
  isBreached?: boolean;
}

export interface UserSession {
  email: string;
  username: string;
  token: string;
  salt: string;
  accessToken?: string;
  refreshToken?: string;
  role?: 'admin' | 'user';
  provider?: 'google' | 'github' | 'local';
}

export interface GeneratorOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  mode: 'password' | 'passphrase';
  passphraseWords: number;
}

export interface VaultEngineStats {
  trieNodeCount: number;
  bloomFilterBits: number;
  bloomFilterHashes: number;
  lruCacheCapacity: number;
  lruCacheSize: number;
  levenshteinScans: number;
}

export interface SecurityAuditResult {
  totalPasswords: number;
  weakCount: number;
  reusedClusters: Array<{
    targetApp: string;
    similarApps: Array<{ appName: string; editDistance: number }>;
  }>;
  overallScore: number;
}
