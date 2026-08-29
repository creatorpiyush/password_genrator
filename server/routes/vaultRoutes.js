/**
 * Vault Sync Router Definitions
 */
import { Router } from 'express';
import { VaultController } from '../controllers/vaultController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/sync', requireAuth, VaultController.sync);
router.get('/pull', requireAuth, VaultController.pull);

export default router;
