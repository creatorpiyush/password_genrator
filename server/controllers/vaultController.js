/**
 * Vault Controller (HTTP Request/Response Handling with Async DB Services)
 */
import { VaultService } from '../services/vaultService.js';

export const VaultController = {
  async sync(req, res) {
    try {
      const { email, encryptedItems } = req.body;
      const result = await VaultService.syncVault(email, encryptedItems);
      res.json({ success: true, count: result.count });
    } catch (err) {
      res.status(500).json({ error: 'Failed to sync vault items', message: err.message });
    }
  },

  async pull(req, res) {
    try {
      const email = req.query.email;
      const result = await VaultService.pullVault(email);
      res.json({ success: true, items: result.items });
    } catch (err) {
      res.status(500).json({ error: 'Failed to pull vault items', message: err.message });
    }
  },
};
