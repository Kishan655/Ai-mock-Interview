import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

let isConnected = false;
let useFallback = false;

// Fallback in-memory/file storage when MongoDB is not running or URI not supplied
const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

export const getFallbackData = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      const initialData = { users: [], interviews: [] };
      fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(content || '{"users":[],"interviews":[]}');
  } catch (error) {
    console.error('Error reading fallback db:', error);
    return { users: [], interviews: [] };
  }
};

export const saveFallbackData = (data) => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving fallback db:', error);
  }
};

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.log('ℹ️ No MONGODB_URI provided in environment. Using embedded persistent JSON database for seamless instant preview.');
    useFallback = true;
    return;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    isConnected = true;
    useFallback = false;
    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`⚠️ Could not connect to MongoDB at ${uri} (${error.message}). Falling back to embedded persistent database.`);
    useFallback = true;
  }
};

export const getDBStatus = () => ({
  isConnected,
  useFallback,
  type: useFallback ? 'Embedded JSON Database (Local Persistence)' : 'MongoDB Atlas / Server',
});
