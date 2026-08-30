import { DecryptedVaultItem } from '../types';
import { KeyDerivationEngine } from '../crypto/keyDerivation';
import { AesGcmEngine } from '../crypto/aesGcm';

export interface ImportedCredential {
  applicationName: string;
  applicationUsername: string;
  password: string;
  category?: 'web' | 'banking' | 'social' | 'work' | 'other';
  notes?: string;
}

/**
 * Custom CSV Parser handling quotes and commas inside fields
 */
export function parseCSV(csvText: string): string[][] {
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        // Ignore carriage return
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some(field => field.length > 0)) {
          lines.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(field => field.length > 0)) {
      lines.push(currentRow);
    }
  }

  return lines;
}

/**
 * Auto-detect and parse Bitwarden, 1Password, or Generic CSV format
 */
export function parseImportCSV(csvText: string): ImportedCredential[] {
  const rows = parseCSV(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.toLowerCase().replace(/[^a-z0-9_]/g, ''));
  const results: ImportedCredential[] = [];

  const getIndex = (possibleNames: string[]) => {
    return headers.findIndex(h => possibleNames.includes(h));
  };

  const nameIdx = getIndex(['name', 'title', 'applicationname', 'app_name', 'application']);
  const userIdx = getIndex(['login_username', 'username', 'user', 'email', 'applicationusername']);
  const passIdx = getIndex(['login_password', 'password', 'pass', 'secret']);
  const notesIdx = getIndex(['notes', 'note', 'comments']);
  const urlIdx = getIndex(['login_uri', 'url', 'website', 'link']);

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const rawName = nameIdx !== -1 ? row[nameIdx] : (urlIdx !== -1 ? row[urlIdx] : 'Imported Account');
    const username = userIdx !== -1 ? row[userIdx] : '';
    const password = passIdx !== -1 ? row[passIdx] : '';
    const notes = notesIdx !== -1 ? row[notesIdx] : '';

    if (!password && !username) continue;

    let applicationName = rawName || 'Imported Account';
    try {
      if (applicationName.startsWith('http://') || applicationName.startsWith('https://')) {
        const parsedUrl = new URL(applicationName);
        applicationName = parsedUrl.hostname.replace(/^www\./, '');
      }
    } catch (e) {}

    results.push({
      applicationName: applicationName || 'Imported Credential',
      applicationUsername: username || 'User',
      password: password || '',
      category: 'web',
      notes: notes || undefined,
    });
  }

  return results;
}

/**
 * Deduplicate & merge imported credentials with existing vault items
 */
export function deduplicateCredentials(
  existing: DecryptedVaultItem[],
  imported: ImportedCredential[]
): ImportedCredential[] {
  const existingSet = new Set(
    existing.map(item => `${item.applicationName.toLowerCase().trim()}_${item.applicationUsername.toLowerCase().trim()}_${item.password}`)
  );

  return imported.filter(item => {
    const key = `${item.applicationName.toLowerCase().trim()}_${item.applicationUsername.toLowerCase().trim()}_${item.password}`;
    if (existingSet.has(key)) return false;
    existingSet.add(key);
    return true;
  });
}

/**
 * Export Vault items as Plaintext CSV
 */
export function exportVaultToCSV(items: DecryptedVaultItem[]): string {
  const headers = ['Application Name', 'Username', 'Password', 'Category', 'Notes', 'Created At'];
  const rows = items.map(item => [
    `"${(item.applicationName || '').replace(/"/g, '""')}"`,
    `"${(item.applicationUsername || '').replace(/"/g, '""')}"`,
    `"${(item.password || '').replace(/"/g, '""')}"`,
    `"${(item.category || 'other').replace(/"/g, '""')}"`,
    `"${(item.notes || '').replace(/"/g, '""')}"`,
    `"${new Date(item.createdAt).toISOString()}"`,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Export Vault items as Encrypted JSON (AES-256-GCM + Passphrase)
 */
export async function exportVaultEncryptedJSON(
  items: DecryptedVaultItem[],
  passphrase: string
): Promise<string> {
  const salt = 'sentinel_vault_export_salt_' + Date.now();
  const bundle = await KeyDerivationEngine.deriveKeys(passphrase, salt);

  const payload = JSON.stringify({
    version: '2.0.0',
    exportedAt: Date.now(),
    count: items.length,
    items,
  });

  const encrypted = await AesGcmEngine.encrypt(payload, bundle.masterEncryptionKey);
  return JSON.stringify({
    salt,
    iv: encrypted.iv,
    ciphertext: encrypted.ciphertext,
  });
}

/**
 * Import Vault items from Encrypted JSON
 */
export async function importVaultEncryptedJSON(
  encryptedJsonString: string,
  passphrase: string
): Promise<ImportedCredential[]> {
  const data = JSON.parse(encryptedJsonString);
  if (!data.salt || !data.iv || !data.ciphertext) {
    throw new Error('Invalid SentinelVault Encrypted Backup format');
  }

  const bundle = await KeyDerivationEngine.deriveKeys(passphrase, data.salt);
  const decryptedText = await AesGcmEngine.decrypt({ iv: data.iv, ciphertext: data.ciphertext }, bundle.masterEncryptionKey);
  const parsed = JSON.parse(decryptedText);

  if (!parsed.items || !Array.isArray(parsed.items)) {
    throw new Error('Malformed backup content');
  }

  return parsed.items.map((item: any) => ({
    applicationName: item.applicationName || 'Restored App',
    applicationUsername: item.applicationUsername || 'User',
    password: item.password || '',
    category: item.category || 'web',
    notes: item.notes,
  }));
}
