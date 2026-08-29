/**
 * Auth Controller (HTTP Request/Response Handling with Async DB Services)
 */
import passport from 'passport';
import { AuthService } from '../services/authService.js';
import { hasRealGoogleKeys, hasRealGitHubKeys } from '../config/passport.js';

const isProduction = process.env.NODE_ENV === 'production';

const getClientRedirectUrl = (params) => {
  const rawUrl = process.env.FRONTEND_URL || process.env.RENDER_EXTERNAL_URL || (isProduction ? '' : 'http://localhost:5173');
  const cleanBase = rawUrl ? rawUrl.trim().replace(/\/$/, '') : '';
  return `${cleanBase}${params}`;
};

export const AuthController = {
  async register(req, res) {
    const { email, username, salt, authKeyHash } = req.body;
    if (!email || !authKeyHash || !salt) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
      await AuthService.registerUser({ email, username, salt, authKeyHash });
      res.json({ success: true, message: 'User registered with zero-knowledge keys', salt });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async login(req, res) {
    const { email, authKeyHash } = req.body;
    try {
      const result = await AuthService.loginUser({ email, authKeyHash });
      await AuthService.updateUserLoginTelemetry({
        email,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      });
      res.json({
        success: true,
        token: result.token,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        salt: result.salt,
        username: result.username,
        role: result.role,
      });
    } catch (err) {
      res.status(401).json({ error: err.message });
    }
  },

  async refresh(req, res) {
    const refreshToken = req.body?.refreshToken || req.headers['x-refresh-token'];
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const payload = AuthService.verifyRefreshToken(refreshToken);
    if (!payload || !payload.email) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    try {
      const user = await AuthService.getUserByEmail(payload.email);
      if (!user) return res.status(404).json({ error: 'User account not found' });

      const tokens = AuthService.generateTokens(user);
      res.json({
        success: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        token: tokens.accessToken,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async me(req, res) {
    const sessionEmail = req.session?.oauthEmail || req.user?.email;
    if (!sessionEmail) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const user = await AuthService.getUserByEmail(sessionEmail);
      if (!user) return res.status(404).json({ error: 'User account not found' });
      res.json({
        success: true,
        email: user.email,
        username: user.username,
        salt: user.salt,
        role: user.role || 'user',
        provider: user.provider || 'local',
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getUserInfo(req, res) {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: 'Email parameter required' });

    try {
      const user = await AuthService.getUserByEmail(email);
      if (!user) return res.status(404).json({ error: 'User account not found' });
      res.json({
        success: true,
        salt: user.salt,
        username: user.username,
        role: user.role || 'user',
        provider: user.provider || 'local',
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async googleAuth(req, res, next) {
    if (hasRealGoogleKeys()) {
      return passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
    }
    if (isProduction) {
      return res.status(533).json({ error: 'Google OAuth is not configured on this production server.' });
    }
    const mockEmail = process.env.DEV_GOOGLE_EMAIL || 'alex.smith@gmail.com';
    const mockUser = 'Alex Smith';
    const mockProviderId = 'google_mock_1001';
    await AuthService.findOrCreateOAuthUser({ email: mockEmail, username: mockUser, provider: 'google', providerId: mockProviderId });
    if (req.session) {
      req.session.oauthEmail = mockEmail;
      return req.session.save(() => {
        res.redirect(getClientRedirectUrl('/?oauth=success'));
      });
    }
    res.redirect(getClientRedirectUrl('/?oauth=success'));
  },

  googleCallback(req, res, next) {
    if (hasRealGoogleKeys()) {
      return passport.authenticate('google', { failureRedirect: getClientRedirectUrl('/?error=oauth_failed') })(req, res, (err) => {
        if (err || !req.user) return res.redirect(getClientRedirectUrl('/?error=oauth_failed'));
        if (req.session) {
          req.session.oauthEmail = req.user.email;
          return req.session.save(() => {
            res.redirect(getClientRedirectUrl('/?oauth=success'));
          });
        }
        res.redirect(getClientRedirectUrl('/?oauth=success'));
      });
    }
    res.redirect(getClientRedirectUrl('/?oauth=success'));
  },

  async githubAuth(req, res, next) {
    if (hasRealGitHubKeys()) {
      return passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
    }
    if (isProduction) {
      return res.status(533).json({ error: 'GitHub OAuth is not configured on this production server.' });
    }
    const mockEmail = process.env.DEV_GITHUB_EMAIL || 'piyush.anand@gmail.com';
    const mockUser = 'Piyush Anand';
    const mockProviderId = 'github_mock_1002';
    await AuthService.findOrCreateOAuthUser({ email: mockEmail, username: mockUser, provider: 'github', providerId: mockProviderId });
    if (req.session) {
      req.session.oauthEmail = mockEmail;
      return req.session.save(() => {
        res.redirect(getClientRedirectUrl('/?oauth=success'));
      });
    }
    res.redirect(getClientRedirectUrl('/?oauth=success'));
  },

  githubCallback(req, res, next) {
    if (hasRealGitHubKeys()) {
      return passport.authenticate('github', { failureRedirect: getClientRedirectUrl('/?error=oauth_failed') })(req, res, async (err) => {
        if (err || !req.user) return res.redirect(getClientRedirectUrl('/?error=oauth_failed'));
        await AuthService.updateUserLoginTelemetry({
          email: req.user.email,
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
        });
        if (req.session) {
          req.session.oauthEmail = req.user.email;
          return req.session.save(() => {
            res.redirect(getClientRedirectUrl('/?oauth=success'));
          });
        }
        res.redirect(getClientRedirectUrl('/?oauth=success'));
      });
    }
    res.redirect(getClientRedirectUrl('/?oauth=success'));
  },

  async profile(req, res) {
    const email = req.user?.email || req.session?.oauthEmail || req.query.email;
    if (!email) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const profileData = await AuthService.getUserProfile(email);
      if (!profileData) return res.status(404).json({ error: 'User profile not found' });
      res.json({ success: true, profile: profileData });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
