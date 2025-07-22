import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import { setupDatabase } from './services/database';
import authRoutes from './routes/auth';
import repoRoutes from './routes/repositories';
import userRoutes from './routes/users';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https:", "http:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      // 移除 upgrade-insecure-requests，允许 HTTP 访问
      upgradeInsecureRequests: null,
    },
  },
  // 禁用会导致 HTTP 问题的安全头
  crossOriginOpenerPolicy: false,
  hsts: false, // 禁用 HSTS，避免强制 HTTPS
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes should come before static files
app.use('/api/auth', authRoutes);
app.use('/api/repositories', repoRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Static files come after API routes
app.use(express.static(path.join(__dirname, '../public')));

// Catch-all route for React router
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.use(errorHandler);

async function startServer() {
  try {
    await setupDatabase();
    
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();