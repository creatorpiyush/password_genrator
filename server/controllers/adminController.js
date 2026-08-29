/**
 * Admin Console Controller for Zero-Knowledge System Telemetry & Metrics
 */
import { AuthService } from '../services/authService.js';
import { VaultService } from '../services/vaultService.js';
import { getDbStatus } from '../config/db.js';

export const AdminController = {
  async getSystemStats(req, res) {
    try {
      const userCount = await AuthService.getUserCount();
      const totalVaultItems = await VaultService.getTotalVaultCount();
      const providers = await AuthService.getProviderBreakdown();
      const dbStatus = getDbStatus();

      res.json({
        success: true,
        metrics: {
          totalRegisteredUsers: userCount,
          totalEncryptedVaultBlobs: totalVaultItems,
          providerBreakdown: providers,
          dbStatus,
          jwtConfig: {
            accessExpiry: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
            refreshExpiry: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
          },
          uptimeSeconds: Math.floor(process.uptime()),
          nodeVersion: process.version,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch admin metrics', message: err.message });
    }
  },
};
