/**
 * Health Check Router Definitions
 */
import { Router } from 'express';
import { HealthController } from '../controllers/healthController.js';

const router = Router();

router.get('/', HealthController.getHealth);

export default router;
