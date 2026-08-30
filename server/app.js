import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import passport from 'passport';
import dotenv from 'dotenv';

import MongoStore from 'connect-mongo';

import { connectDb } from './config/db.js';
import { configurePassport } from './config/passport.js';
import authRoutes from './routes/authRoutes.js';
import vaultRoutes from './routes/vaultRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

// Connect Database (MongoDB Mongoose or File Fallback)
connectDb().catch(() => {});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  app.set('trust proxy', 1);
}

// Production CORS Configuration
const getNormalizedOrigins = () => {
  const origins = [];
  if (process.env.ALLOWED_ORIGINS) {
    origins.push(...process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim().replace(/\/$/, '')));
  }
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL.trim().replace(/\/$/, ''));
  }
  if (process.env.RENDER_EXTERNAL_URL) {
    origins.push(process.env.RENDER_EXTERNAL_URL.trim().replace(/\/$/, ''));
  }
  origins.push('http://localhost:5173', 'http://localhost:3001');
  return origins;
};

const allowedOrigins = getNormalizedOrigins();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || !isProduction) {
        return callback(null, true);
      }
      const normalized = origin.trim().replace(/\/$/, '');
      if (allowedOrigins.includes(normalized)) {
        return callback(null, true);
      }
      callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json());

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Session & Passport Configuration
const sessionSecret = process.env.SESSION_SECRET || (isProduction ? null : 'sentinel_vault_dev_session_secret');
if (isProduction && !process.env.SESSION_SECRET) {
  console.warn('⚠️ WARNING: SESSION_SECRET is not defined in environment variables.');
}

import mongoose from 'mongoose';

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DB_URL;
const sessionStore = mongoUri
  ? MongoStore.create({
      clientPromise: mongoose.connection.asPromise().then(c => c.getClient()),
      ttl: 24 * 60 * 60,
    })
  : undefined;

app.use(
  session({
    secret: sessionSecret || 'sentinel_vault_fallback_secret_2026',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

configurePassport();
app.use(passport.initialize());
app.use(passport.session());

import breachRoutes from './routes/breachRoutes.js';
import shareRoutes from './routes/shareRoutes.js';

// Mount API Routers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/vault', vaultRoutes);
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/breach', breachRoutes);
app.use('/api/v1/share', shareRoutes);

// Serve compiled static assets from Vite `dist/` directory in production
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

export default app;
