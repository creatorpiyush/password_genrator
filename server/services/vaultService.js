/**
 * Vault Encrypted Blob Synchronization Service (MongoDB Mongoose + File DB Fallback)
 */
import Vault from '../models/Vault.js';
import { getFileDb, saveFileDb, getDbStatus } from '../config/db.js';

export const VaultService = {
  async syncVault(email, encryptedItems) {
    const status = getDbStatus();

    if (status.isMongoConnected) {
      await Vault.findOneAndUpdate(
        { email },
        { encryptedItems: encryptedItems || [] },
        { upsert: true, new: true }
      );
      return { count: (encryptedItems || []).length };
    }

    // File DB Fallback
    const db = getFileDb();
    let vaultEntry = db.vaults.find(v => v.email === email);
    if (vaultEntry) {
      vaultEntry.encryptedItems = encryptedItems || [];
    } else {
      vaultEntry = { email, encryptedItems: encryptedItems || [] };
      db.vaults.push(vaultEntry);
    }
    saveFileDb(db);
    return { count: (encryptedItems || []).length };
  },

  async pullVault(email) {
    const status = getDbStatus();

    if (status.isMongoConnected) {
      const doc = await Vault.findOne({ email });
      return { items: doc ? doc.encryptedItems : [] };
    }

    // File DB Fallback
    const db = getFileDb();
    const doc = db.vaults.find(v => v.email === email);
    return { items: doc ? doc.encryptedItems : [] };
  },

  async getTotalVaultCount() {
    const status = getDbStatus();
    if (status.isMongoConnected) {
      const vaults = await Vault.find();
      return vaults.reduce((acc, v) => acc + (v.encryptedItems ? v.encryptedItems.length : 0), 0);
    }
    const db = getFileDb();
    return db.vaults.reduce((acc, v) => acc + (v.encryptedItems ? v.encryptedItems.length : 0), 0);
  },
};
