import { describe, it, expect } from 'vitest';
import {
  parseCSV,
  parseImportCSV,
  deduplicateCredentials,
  exportVaultToCSV,
  exportVaultEncryptedJSON,
  importVaultEncryptedJSON,
} from '../importExportService';
import { DecryptedVaultItem } from '../../types';

describe('Import & Export Service', () => {
  it('should correctly parse CSV rows with quotes and commas', () => {
    const csvData = `name,username,password,notes\n"Google, Inc.",user@gmail.com,"p@ss,word","notes with ""quotes"""\nBitwarden,user2,pass2,normal note`;
    const parsed = parseCSV(csvData);
    expect(parsed.length).toBe(3);
    expect(parsed[1][0]).toBe('Google, Inc.');
    expect(parsed[1][2]).toBe('p@ss,word');
    expect(parsed[1][3]).toBe('notes with "quotes"');
  });

  it('should parse Bitwarden / 1Password format CSV', () => {
    const bitwardenCsv = `folder,favorite,type,name,notes,fields,reprompt,login_uri,login_username,login_password,login_totp\n,0,1,GitHub,dev account,,0,https://github.com,octocat,gitpass123,`;
    const imported = parseImportCSV(bitwardenCsv);
    expect(imported.length).toBe(1);
    expect(imported[0].applicationName).toBe('GitHub');
    expect(imported[0].applicationUsername).toBe('octocat');
    expect(imported[0].password).toBe('gitpass123');
  });

  it('should deduplicate imported credentials against existing vault items', () => {
    const existing: DecryptedVaultItem[] = [
      {
        id: '1',
        applicationName: 'GitHub',
        applicationUsername: 'octocat',
        password: 'pass1',
        category: 'web',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        strengthEntropy: 80,
      },
    ];

    const incoming = [
      { applicationName: 'GitHub', applicationUsername: 'octocat', password: 'pass1' },
      { applicationName: 'GitLab', applicationUsername: 'octocat', password: 'newpass' },
    ];

    const deduplicated = deduplicateCredentials(existing, incoming);
    expect(deduplicated.length).toBe(1);
    expect(deduplicated[0].applicationName).toBe('GitLab');
  });

  it('should encrypt vault to JSON and decrypt back successfully', async () => {
    const items: DecryptedVaultItem[] = [
      {
        id: '1',
        applicationName: 'SentinelVault Test',
        applicationUsername: 'testuser',
        password: 'SuperSecretPass123!',
        category: 'work',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        strengthEntropy: 95,
      },
    ];

    const exportPassphrase = 'MyExportSecretKey2026!';
    const encryptedJson = await exportVaultEncryptedJSON(items, exportPassphrase);

    expect(encryptedJson).toContain('ciphertext');
    expect(encryptedJson).toContain('salt');

    const restored = await importVaultEncryptedJSON(encryptedJson, exportPassphrase);
    expect(restored.length).toBe(1);
    expect(restored[0].applicationName).toBe('SentinelVault Test');
    expect(restored[0].password).toBe('SuperSecretPass123!');
  });
});
