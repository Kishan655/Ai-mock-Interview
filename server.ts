import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Import backend modules
import { connectDB, getDBStatus } from './backend/config/db.js';
import authRoutes from './backend/routes/authRoutes.js';
import interviewRoutes from './backend/routes/interviewRoutes.js';
import dashboardRoutes from './backend/routes/dashboardRoutes.js';
import profileRoutes from './backend/routes/profileRoutes.js';
import { notFound, errorHandler } from './backend/middleware/errorMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Connect to Database (MongoDB with automatic persistent fallback)
  await connectDB();

  // Middleware
  app.use(cors({
    origin: true,
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Health and Diagnostic API
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'InterviewAI Full-Stack Platform',
      database: getDBStatus(),
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString(),
    });
  });

  // Mount Backend API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/interviews', interviewRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/profile', profileRoutes);

  const isProduction = process.env.NODE_ENV === 'production';
  const distPath = path.resolve(__dirname, 'dist');

  if (!isProduction || !fs.existsSync(distPath)) {
    // Mount Vite middleware in development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Error handling for API routes
  app.use('/api/*', notFound);
  app.use(errorHandler);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n=================================================`);
    console.log(`🎯 InterviewAI Platform running on http://localhost:${PORT}`);
    console.log(`📦 Database: ${getDBStatus().type}`);
    console.log(`🤖 Gemini AI: ${process.env.GEMINI_API_KEY ? 'Active & Ready' : 'Key missing (curated fallback ready)'}`);
    console.log(`=================================================\n`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup failure:', err);
  process.exit(1);
});
