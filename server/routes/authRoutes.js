/**
 * Auth Router Definitions
 */
import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { createTokenBucketLimiter } from '../rateLimiter.js';

const router = Router();
const authLimiter = createTokenBucketLimiter(5, 0.5);
const loginLimiter = createTokenBucketLimiter(10, 1);

// Zero-Knowledge Auth Routes
router.post('/register', authLimiter, AuthController.register);
router.post('/login', loginLimiter, AuthController.login);
router.post('/refresh', loginLimiter, AuthController.refresh);
router.get('/user-info', authLimiter, AuthController.getUserInfo);
router.get('/me', AuthController.me);

// Passport OAuth Routes
router.get('/google', AuthController.googleAuth);
router.get('/google/callback', AuthController.googleCallback);
router.get('/github', AuthController.githubAuth);
router.get('/github/callback', AuthController.githubCallback);

export default router;
