/**
 * Authentication Middleware for Protected Routes
 */
import { AuthService } from '../services/authService.js';

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const email = req.body?.email || req.query?.email || req.session?.oauthEmail;

  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = AuthService.verifyAccessToken(token);
    if (payload) {
      req.user = payload;
      return next();
    }
  }

  const isAuthenticatedSession = req.isAuthenticated && req.isAuthenticated();
  if (isAuthenticatedSession || (req.session && req.session.oauthEmail)) {
    const userEmail = email || req.session?.oauthEmail;
    if (userEmail) {
      const user = await AuthService.getUserByEmail(userEmail);
      if (user) {
        req.user = { email: user.email, username: user.username, role: user.role, provider: user.provider };
        return next();
      }
    }
  }

  return res.status(401).json({ error: 'Unauthorized access: Invalid or expired JWT token.' });
};

export const requireAdmin = async (req, res, next) => {
  const email = req.user?.email || req.body?.email || req.query?.email || req.headers['x-user-email'];
  if (!email) {
    return res.status(401).json({ error: 'Unauthorized: missing user credentials' });
  }
  const user = req.user && req.user.role ? req.user : await AuthService.getUserByEmail(email);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin privileges required' });
  }
  next();
};
