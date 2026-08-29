/**
 * Auth & User Persistent Service Layer (MongoDB Mongoose + File DB Fallback)
 */
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Vault from '../models/Vault.js';
import { getFileDb, saveFileDb, getDbStatus } from '../config/db.js';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'sentinel_access_secret_2026';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'sentinel_refresh_secret_2026';
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '5m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export const AuthService = {
  generateTokens(user) {
    const payload = {
      email: user.email,
      username: user.username,
      role: user.role || 'user',
      provider: user.provider || 'local',
      type: 'access',
    };

    const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
    const refreshToken = jwt.sign({ email: user.email, type: 'refresh' }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });

    return { accessToken, refreshToken };
  },

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, ACCESS_SECRET);
    } catch (err) {
      return null;
    }
  },

  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, REFRESH_SECRET);
    } catch (err) {
      return null;
    }
  },

  async registerUser({ email, username, salt, authKeyHash, provider = 'local', role = 'user' }) {
    const status = getDbStatus();

    if (status.isMongoConnected) {
      const existing = await User.findOne({ email });
      if (existing) {
        throw new Error('User account already exists');
      }
      const user = await User.create({ email, username, salt, authKeyHash, provider, role });
      await Vault.create({ email, encryptedItems: [] });
      return user;
    }

    // File DB Fallback
    const db = getFileDb();
    if (db.users.some(u => u.email === email)) {
      throw new Error('User account already exists');
    }
    const user = { email, username, salt, authKeyHash, provider, role, createdAt: new Date().toISOString() };
    db.users.push(user);
    db.vaults.push({ email, encryptedItems: [] });
    saveFileDb(db);
    return user;
  },

  async loginUser({ email, authKeyHash }) {
    const status = getDbStatus();
    let user = null;

    if (status.isMongoConnected) {
      user = await User.findOne({ email });
    } else {
      const db = getFileDb();
      user = db.users.find(u => u.email === email);
    }

    if (!user) {
      throw new Error('Invalid authentication key or email');
    }

    if (user.authKeyHash === 'oauth_hash' || user.provider !== 'local') {
      user.authKeyHash = authKeyHash;
      if (status.isMongoConnected) {
        await user.save();
      } else {
        const db = getFileDb();
        saveFileDb(db);
      }
    } else if (user.authKeyHash !== authKeyHash) {
      throw new Error('Invalid authentication key or email');
    }

    const { accessToken, refreshToken } = this.generateTokens(user);

    return {
      accessToken,
      refreshToken,
      token: accessToken,
      salt: user.salt,
      username: user.username,
      role: user.role || 'user',
    };
  },

  async findOrCreateOAuthUser({ email, username, provider, providerId }) {
    const status = getDbStatus();

    if (status.isMongoConnected) {
      let user = providerId ? await User.findOne({ provider, providerId }) : null;
      if (!user) {
        user = await User.findOne({ email });
      }

      if (user) {
        let modified = false;
        if (email && user.email !== email) {
          user.email = email;
          modified = true;
        }
        if (providerId && user.providerId !== providerId) {
          user.providerId = providerId;
          modified = true;
        }
        if (modified) await user.save();
      } else {
        user = await User.create({
          email,
          username,
          salt: 'oauth_salt_' + Date.now(),
          authKeyHash: 'oauth_hash',
          provider,
          providerId,
        });
        await Vault.create({ email, encryptedItems: [] });
      }
      return { email: user.email, username: user.username, provider: user.provider, providerId: user.providerId };
    }

    // File DB Fallback
    const db = getFileDb();
    let user = (providerId && db.users.find(u => u.provider === provider && u.providerId === providerId)) ||
      db.users.find(u => u.email === email);

    if (user) {
      let modified = false;
      if (email && user.email !== email) {
        user.email = email;
        modified = true;
      }
      if (providerId && user.providerId !== providerId) {
        user.providerId = providerId;
        modified = true;
      }
      if (modified) saveFileDb(db);
    } else {
      user = {
        email,
        username,
        salt: 'oauth_salt_' + Date.now(),
        authKeyHash: 'oauth_hash',
        provider,
        providerId,
        createdAt: new Date().toISOString(),
      };
      db.users.push(user);
      db.vaults.push({ email, encryptedItems: [] });
      saveFileDb(db);
    }
    return { email: user.email, username: user.username, provider: user.provider, providerId: user.providerId };
  },

  async isRegisteredUser(email) {
    const status = getDbStatus();
    if (status.isMongoConnected) {
      const count = await User.countDocuments({ email });
      return count > 0;
    }
    const db = getFileDb();
    return db.users.some(u => u.email === email);
  },

  async getUserByEmail(email) {
    const status = getDbStatus();
    if (status.isMongoConnected) {
      return await User.findOne({ email });
    }
    const db = getFileDb();
    return db.users.find(u => u.email === email);
  },

  async getUserCount() {
    const status = getDbStatus();
    if (status.isMongoConnected) {
      return await User.countDocuments();
    }
    const db = getFileDb();
    return db.users.length;
  },

  async getProviderBreakdown() {
    const status = getDbStatus();
    if (status.isMongoConnected) {
      const local = await User.countDocuments({ provider: 'local' });
      const google = await User.countDocuments({ provider: 'google' });
      const github = await User.countDocuments({ provider: 'github' });
      return { local, google, github };
    }
    const db = getFileDb();
    const local = db.users.filter(u => u.provider === 'local').length;
    const google = db.users.filter(u => u.provider === 'google').length;
    const github = db.users.filter(u => u.provider === 'github').length;
    return { local, google, github };
  },

  parseUserAgent(uaString = '') {
    if (!uaString) return 'Unknown Web Browser';
    let browser = 'Web Browser';
    let os = 'Unknown OS';

    if (uaString.includes('Firefox/')) browser = 'Firefox';
    else if (uaString.includes('Edg/')) browser = 'Microsoft Edge';
    else if (uaString.includes('Chrome/')) browser = 'Chrome';
    else if (uaString.includes('Safari/')) browser = 'Safari';

    if (uaString.includes('Macintosh') || uaString.includes('Mac OS X')) os = 'macOS';
    else if (uaString.includes('Windows')) os = 'Windows';
    else if (uaString.includes('Android')) os = 'Android';
    else if (uaString.includes('iPhone') || uaString.includes('iPad')) os = 'iOS';
    else if (uaString.includes('Linux')) os = 'Linux';

    return `${browser} on ${os}`;
  },

  async updateUserLoginTelemetry({ email, userAgent, ipAddress }) {
    if (!email) return;
    const deviceName = this.parseUserAgent(userAgent);
    const now = new Date();
    const cleanIp = ipAddress ? ipAddress.replace(/^.*:/, '') : '127.0.0.1';

    const status = getDbStatus();
    if (status.isMongoConnected) {
      const user = await User.findOne({ email });
      if (user) {
        user.lastLoginTime = now;
        user.lastLoginDevice = deviceName;

        if (!user.activeSessions) user.activeSessions = [];
        const existingIdx = user.activeSessions.findIndex(s => s.deviceName === deviceName);
        if (existingIdx >= 0) {
          user.activeSessions[existingIdx].lastActiveAt = now;
          user.activeSessions[existingIdx].ipAddress = cleanIp;
        } else {
          user.activeSessions.push({
            deviceId: 'dev_' + Date.now(),
            deviceName,
            ipAddress: cleanIp,
            lastActiveAt: now,
          });
        }
        await user.save();
      }
      return;
    }

    // File DB
    const db = getFileDb();
    const user = db.users.find(u => u.email === email);
    if (user) {
      user.lastLoginTime = now.toISOString();
      user.lastLoginDevice = deviceName;
      if (!user.activeSessions) user.activeSessions = [];
      const existingIdx = user.activeSessions.findIndex(s => s.deviceName === deviceName);
      if (existingIdx >= 0) {
        user.activeSessions[existingIdx].lastActiveAt = now.toISOString();
        user.activeSessions[existingIdx].ipAddress = cleanIp;
      } else {
        user.activeSessions.push({
          deviceId: 'dev_' + Date.now(),
          deviceName,
          ipAddress: cleanIp,
          lastActiveAt: now.toISOString(),
        });
      }
      saveFileDb(db);
    }
  },

  async getUserProfile(email) {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    return {
      email: user.email,
      username: user.username,
      provider: user.provider || 'local',
      role: user.role || 'user',
      salt: user.salt,
      lastLoginTime: user.lastLoginTime || user.createdAt || new Date(),
      lastLoginDevice: user.lastLoginDevice || 'Chrome on macOS',
      activeSessions: user.activeSessions && user.activeSessions.length > 0 ? user.activeSessions : [
        {
          deviceId: 'dev_primary',
          deviceName: user.lastLoginDevice || 'Chrome on macOS',
          ipAddress: '127.0.0.1',
          lastActiveAt: user.lastLoginTime || new Date(),
        }
      ],
    };
  },
};
