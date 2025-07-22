import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../services/database';
import { AppError } from '../middleware/errorHandler';
import asyncHandler from 'express-async-handler';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  email: z.string().email().optional()
});

router.post('/login', asyncHandler(async (req, res) => {
  const { username, password } = loginSchema.parse(req.body);

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  });
}));

router.post('/register', asyncHandler(async (req, res) => {
  const { username, password, email } = registerSchema.parse(req.body);

  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);

  if (existingUser) {
    throw new AppError('Username already exists', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = db.prepare(
    'INSERT INTO users (username, password, email) VALUES (?, ?, ?)'
  ).run(username, hashedPassword, email || null);

  const token = jwt.sign(
    { id: result.lastInsertRowid, username, role: 'user' },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.status(201).json({
    token,
    user: {
      id: result.lastInsertRowid,
      username,
      email,
      role: 'user'
    }
  });
}));

export default router;