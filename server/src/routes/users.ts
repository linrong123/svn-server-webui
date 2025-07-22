import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { db } from '../services/database';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import asyncHandler from 'express-async-handler';
import { execSync } from 'child_process';

const router = Router();

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['user', 'admin']).optional()
});

// Get all users (admin only)
router.get('/', authenticate, authorize(['admin']), asyncHandler(async (_req, res) => {
  const users = db.prepare(`
    SELECT id, username, email, role, created_at, updated_at
    FROM users
    ORDER BY created_at DESC
  `).all();

  res.json(users);
}));

// Get current user profile
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const user = db.prepare(`
    SELECT id, username, email, role, created_at, updated_at
    FROM users
    WHERE id = ?
  `).get(req.user!.id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json(user);
}));

// Update user
router.patch('/:id', authenticate, asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const updates = updateUserSchema.parse(req.body);

  // Check if user can update (admin or self)
  if (req.user!.role !== 'admin' && req.user!.id !== userId) {
    throw new AppError('Forbidden', 403);
  }

  // Don't allow non-admins to change role
  if (req.user!.role !== 'admin' && updates.role) {
    throw new AppError('Only admins can change user roles', 403);
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const updateFields: string[] = [];
  const updateValues: any[] = [];

  if (updates.email !== undefined) {
    updateFields.push('email = ?');
    updateValues.push(updates.email);
  }

  if (updates.password) {
    const hashedPassword = await bcrypt.hash(updates.password, 10);
    updateFields.push('password = ?');
    updateValues.push(hashedPassword);

    // Update SVN password
    execSync(`htpasswd -b /svn/conf/svn-auth-file ${user.username} ${updates.password}`, {
      stdio: 'ignore'
    });
  }

  if (updates.role && req.user!.role === 'admin') {
    updateFields.push('role = ?');
    updateValues.push(updates.role);
  }

  if (updateFields.length > 0) {
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(userId);

    db.prepare(`
      UPDATE users
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `).run(...updateValues);
  }

  const updatedUser = db.prepare(`
    SELECT id, username, email, role, created_at, updated_at
    FROM users
    WHERE id = ?
  `).get(userId);

  res.json(updatedUser);
}));

// Delete user (admin only)
router.delete('/:id', authenticate, authorize(['admin']), asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.id, 10);

  if (userId === req.user!.id) {
    throw new AppError('Cannot delete yourself', 400);
  }

  const user = db.prepare('SELECT username FROM users WHERE id = ?').get(userId) as any;
  if (!user) {
    throw new AppError('User not found', 404);
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(userId);

  // Remove from SVN auth file
  try {
    execSync(`htpasswd -D /svn/conf/svn-auth-file ${user.username}`, {
      stdio: 'ignore'
    });
  } catch {
    // Ignore if user doesn't exist in auth file
  }

  res.status(204).send();
}));

// Get user's repository permissions
router.get('/:id/permissions', authenticate, asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.id, 10);

  // Check if user can view (admin or self)
  if (req.user!.role !== 'admin' && req.user!.id !== userId) {
    throw new AppError('Forbidden', 403);
  }

  const permissions = db.prepare(`
    SELECT 
      p.*,
      r.name as repository_name,
      r.description as repository_description
    FROM permissions p
    JOIN repositories r ON p.repository_id = r.id
    WHERE p.user_id = ?
    ORDER BY r.name
  `).all(userId);

  res.json(permissions);
}));

export default router;