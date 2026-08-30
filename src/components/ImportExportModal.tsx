import React, { useState } from 'react';
import { Download, Upload, ShieldAlert, FileCode, FileText, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { DecryptedVaultItem } from '../types';
import {
  parseImportCSV,
  deduplicateCredentials,
  exportVaultToCSV,
  exportVaultEncryptedJSON,
  importVaultEncryptedJSON,
  ImportedCredential,
} from '../services/importExportService';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaultItems: DecryptedVaultItem[];
  onImportItems: (newItems: ImportedCredential[]) => Promise<void>;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  vaultItems,
  onImportItems,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [exportPassphrase, setExportPassphrase] = useState('');
  const [importPassphrase, setImportPassphrase] = useState('');
  const [importFileContent, setImportFileContent] = useState<string | null>(null);
  const [importFileName, setImportFileName] = useState('');
  const [importFormat, setImportFormat] = useState<'csv' | 'json'>('csv');
  const [parsedPreview, setParsedPreview] = useState<ImportedCredential[]>([]);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setStatusMsg(null);

    const isJson = file.name.endsWith('.json');
    setImportFormat(isJson ? 'json' : 'csv');

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportFileContent(content);

      if (!isJson) {
        try {
          const parsed = parseImportCSV(content);
          const deduplicated = deduplicateCredentials(vaultItems, parsed);
          setParsedPreview(deduplicated);
          if (parsed.length === 0) {
            setStatusMsg({ type: 'warning', text: 'No credentials found in CSV file.' });
          } else {
            setStatusMsg({
              type: 'success',
              text: `Parsed ${parsed.length} items (${deduplicated.length} new items after deduplication).`,
            });
          }
        } catch (err: any) {
          setStatusMsg({ type: 'error', text: 'Failed to parse CSV file: ' + err.message });
        }
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (!importFileContent) return;
    setLoading(true);
    setStatusMsg(null);

    try {
      let credentialsToImport: ImportedCredential[] = [];

      if (importFormat === 'csv') {
        const parsed = parseImportCSV(importFileContent);
        credentialsToImport = deduplicateCredentials(vaultItems, parsed);
      } else {
        if (!importPassphrase) {
          setStatusMsg({ type: 'error', text: 'Please enter the passphrase used to encrypt this JSON backup.' });
          setLoading(false);
          return;
        }
        const parsed = await importVaultEncryptedJSON(importFileContent, importPassphrase);
        credentialsToImport = deduplicateCredentials(vaultItems, parsed);
      }

      if (credentialsToImport.length === 0) {
        setStatusMsg({ type: 'warning', text: 'All credentials in file already exist in your vault.' });
        setLoading(false);
        return;
      }

      await onImportItems(credentialsToImport);
      setStatusMsg({ type: 'success', text: `Successfully imported ${credentialsToImport.length} vault credentials!` });
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Import failed. Check format or decryption passphrase.' });
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const csvContent = exportVaultToCSV(vaultItems);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SentinelVault_Backup_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setStatusMsg({ type: 'warning', text: 'Plaintext CSV downloaded. Keep this file stored securely!' });
  };

  const handleExportJSON = async () => {
    if (!exportPassphrase || exportPassphrase.length < 6) {
      setStatusMsg({ type: 'error', text: 'Please enter a passphrase of at least 6 characters to encrypt your export.' });
      return;
    }

    setLoading(true);
    try {
      const encryptedJson = await exportVaultEncryptedJSON(vaultItems, exportPassphrase);
      const blob = new Blob([encryptedJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SentinelVault_Encrypted_${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setStatusMsg({ type: 'success', text: 'AES-256 Encrypted JSON Backup downloaded successfully!' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'Export failed: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div className="glass-panel" style={{ maxWidth: '34rem', width: '100%', padding: '2rem', borderRadius: '1rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '0.75rem', background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
              <Upload style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                Vault Data Mobility
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Import from Bitwarden/1Password or create encrypted backups
              </span>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {/* Modal Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(10, 14, 23, 0.6)', padding: '0.25rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '1.25rem' }}>
          <button
            onClick={() => { setActiveTab('import'); setStatusMsg(null); }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.375rem',
              padding: '0.5rem',
              borderRadius: '0.5rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'import' ? '1px solid rgba(6, 182, 212, 0.3)' : 'none',
              background: activeTab === 'import' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
              color: activeTab === 'import' ? '#38bdf8' : '#94a3b8',
            }}
          >
            <Upload style={{ width: 14, height: 14 }} /> Import Vault Data
          </button>
          <button
            onClick={() => { setActiveTab('export'); setStatusMsg(null); }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.375rem',
              padding: '0.5rem',
              borderRadius: '0.5rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'export' ? '1px solid rgba(6, 182, 212, 0.3)' : 'none',
              background: activeTab === 'export' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
              color: activeTab === 'export' ? '#38bdf8' : '#94a3b8',
            }}
          >
            <Download style={{ width: 14, height: 14 }} /> Export Vault Data
          </button>
        </div>

        {statusMsg && (
          <div
            style={{
              padding: '0.75rem',
              borderRadius: '0.5rem',
              fontSize: '0.8125rem',
              fontWeight: 500,
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : statusMsg.type === 'warning' ? 'rgba(234, 179, 8, 0.12)' : 'rgba(244, 63, 94, 0.12)',
              border: `1px solid ${statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : statusMsg.type === 'warning' ? 'rgba(234, 179, 8, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
              color: statusMsg.type === 'success' ? '#10b981' : statusMsg.type === 'warning' ? '#eab308' : '#f43f5e',
            }}
          >
            {statusMsg.type === 'success' && <CheckCircle2 style={{ width: 16, height: 16, flexShrink: 0 }} />}
            {statusMsg.type === 'warning' && <AlertTriangle style={{ width: 16, height: 16, flexShrink: 0 }} />}
            {statusMsg.type === 'error' && <ShieldAlert style={{ width: 16, height: 16, flexShrink: 0 }} />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Tab 1: Import */}
        {activeTab === 'import' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ border: '2px dashed rgba(255, 255, 255, 0.15)', borderRadius: '0.75rem', background: 'rgba(10, 14, 23, 0.4)', padding: '1.5rem', textAlign: 'center' }}>
              <input
                type="file"
                id="fileImportInput"
                accept=".csv,.json"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <label
                htmlFor="fileImportInput"
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}
              >
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                  <FileCode style={{ width: 22, height: 22 }} />
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc' }}>
                  {importFileName ? importFileName : 'Click to select CSV or Encrypted JSON file'}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Supports Bitwarden CSV, 1Password CSV, or SentinelVault Encrypted Backup
                </span>
              </label>
            </div>

            {importFormat === 'json' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.375rem' }}>
                  Decryption Passphrase
                </label>
                <input
                  type="password"
                  value={importPassphrase}
                  onChange={(e) => setImportPassphrase(e.target.value)}
                  placeholder="Enter the passphrase used during export..."
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: 'rgba(10, 14, 23, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '0.5rem',
                    padding: '0.625rem',
                    color: '#f8fafc',
                    fontSize: '0.8125rem',
                    outline: 'none',
                  }}
                />
              </div>
            )}

            {parsedPreview.length > 0 && importFormat === 'csv' && (
              <div style={{ maxHeight: '9rem', overflowY: 'auto', background: 'rgba(10, 14, 23, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '0.5rem', padding: '0.75rem', fontSize: '0.75rem' }}>
                <div style={{ fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem' }}>Import Preview ({parsedPreview.length} items):</div>
                {parsedPreview.slice(0, 5).map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', padding: '0.25rem 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <span style={{ fontWeight: 600, color: '#38bdf8' }}>{item.applicationName}</span>
                    <span style={{ color: '#94a3b8' }}>{item.applicationUsername}</span>
                  </div>
                ))}
                {parsedPreview.length > 5 && (
                  <div style={{ color: '#64748b', fontSize: '0.6875rem', textAlign: 'center', paddingTop: '0.25rem' }}>+ {parsedPreview.length - 5} more items</div>
                )}
              </div>
            )}

            <button
              onClick={handleExecuteImport}
              disabled={!importFileContent || loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: (!importFileContent || loading) ? 'not-allowed' : 'pointer',
                opacity: (!importFileContent || loading) ? 0.6 : 1,
              }}
            >
              {loading ? 'Processing Import...' : 'Import Credentials to Vault'}
            </button>
          </div>
        )}

        {/* Tab 2: Export */}
        {activeTab === 'export' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '0.75rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 700, color: '#38bdf8' }}>
                <FileCode style={{ width: 18, height: 18 }} /> Recommended: Encrypted JSON Backup
              </div>
              <p style={{ fontSize: '0.75rem', color: '#cbd5e1', margin: 0, lineHeight: 1.4 }}>
                Encrypts all {vaultItems.length} vault items with AES-256-GCM using your custom passphrase. Safe to store on cloud or USB storage.
              </p>
              <input
                type="password"
                value={exportPassphrase}
                onChange={(e) => setExportPassphrase(e.target.value)}
                placeholder="Set export encryption passphrase (min 6 chars)..."
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(10, 14, 23, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '0.5rem',
                  padding: '0.625rem',
                  color: '#f8fafc',
                  fontSize: '0.75rem',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleExportJSON}
                disabled={loading || vaultItems.length === 0}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(6, 182, 212, 0.2)',
                  border: '1px solid rgba(6, 182, 212, 0.4)',
                  color: '#38bdf8',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: (loading || vaultItems.length === 0) ? 'not-allowed' : 'pointer',
                }}
              >
                Download Encrypted JSON Backup
              </button>
            </div>

            <div style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: '0.75rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 700, color: '#f43f5e' }}>
                <FileText style={{ width: 18, height: 18 }} /> Plaintext CSV Export
              </div>
              <p style={{ fontSize: '0.75rem', color: '#cbd5e1', margin: 0, lineHeight: 1.4 }}>
                Exports vault in unencrypted CSV format. Anyone with access to the downloaded file will be able to read your passwords.
              </p>
              <button
                onClick={handleExportCSV}
                disabled={vaultItems.length === 0}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: '#f43f5e',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: vaultItems.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                Download Plaintext CSV File
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
