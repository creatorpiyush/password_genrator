/**
 * Admin Router Definitions
 */
import { Router } from 'express';
import { AdminController } from '../controllers/adminController.js';
import { requireAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/stats', requireAdmin, AdminController.getSystemStats);

export default router;
