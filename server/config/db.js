import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

let isMongoConnected = false;

// Persistent File DB Fallback helper when MongoDB is offline
export const getFileDb = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], vaults: [] }, null, 2));
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return { users: [], vaults: [] };
  }
};

export const saveFileDb = (data) => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

export const connectDb = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DB_URL;

  if (mongoUri) {
    try {
      mongoose.connection.on('error', () => {});
      await mongoose.connect(mongoUri, {
        dbName: 'sentinel_vault',
        serverSelectionTimeoutMS: 5000,
      });
      isMongoConnected = true;
      console.log('🍃 MongoDB Atlas / Database Connected Successfully via Mongoose');
      return;
    } catch (err) {
      console.warn('⚠️ Mongoose connection failed. Falling back to persistent file database:', err.message);
    }
  }

  getFileDb(); // Initialize persistent file DB
  console.log('📁 SentinelVault running with persistent file-backed database (server/data/db.json)');
};

export const getDbStatus = () => {
  return {
    isMongoConnected: isMongoConnected && mongoose.connection.readyState === 1,
    mongoState: mongoose.connection.readyState,
    type: isMongoConnected && mongoose.connection.readyState === 1 ? 'MongoDB (Mongoose ODM)' : 'Persistent File Storage (JSON)',
  };
};
