import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import passport from 'passport';
import dotenv from 'dotenv';

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

// Production CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:3001'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || !isProduction || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS origin blocked by SentinelVault security policy'));
      }
    },
    credentials: true,
  })
);
app.use(express.json());

// Session & Passport Configuration
const sessionSecret = process.env.SESSION_SECRET || (isProduction ? null : 'sentinel_vault_dev_session_secret');
if (isProduction && !process.env.SESSION_SECRET) {
  console.warn('⚠️ WARNING: SESSION_SECRET is not defined in environment variables.');
}

app.use(
  session({
    secret: sessionSecret || 'sentinel_vault_fallback_secret_2026',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: isProduction, maxAge: 24 * 60 * 60 * 1000 },
  })
);

configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// Mount API Routers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/vault', vaultRoutes);
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/admin', adminRoutes);

// Serve compiled static assets from Vite `dist/` directory in production
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

export default app;
