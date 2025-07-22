import { Router } from 'express';
import { z } from 'zod';
import { db } from '../services/database';
import { svnService } from '../services/svnService';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import asyncHandler from 'express-async-handler';
import { execSync } from 'child_process';

const router = Router();

const createRepoSchema = z.object({
  name: z.string().regex(/^[a-zA-Z0-9_-]+$/, 'Invalid repository name'),
  description: z.string().optional()
});

// List all repositories
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const svnRepos = await svnService.listRepositories();
  
  const dbRepos = db.prepare(`
    SELECT r.*, u.username as created_by_username
    FROM repositories r
    LEFT JOIN users u ON r.created_by = u.id
  `).all() as any[];

  const reposMap = new Map(dbRepos.map(repo => [repo.name, repo]));

  const repositories = svnRepos.map(svnRepo => ({
    ...svnRepo,
    ...(reposMap.get(svnRepo.name) || {}),
    exists: true
  }));

  res.json(repositories);
}));

// Create new repository
router.post('/', authenticate, authorize(['admin']), asyncHandler(async (req, res) => {
  const { name, description } = createRepoSchema.parse(req.body);

  // Check if repository already exists
  const existing = db.prepare('SELECT id FROM repositories WHERE name = ?').get(name);
  if (existing) {
    throw new AppError('Repository already exists', 400);
  }

  // Create SVN repository
  await svnService.createRepository(name);

  // Add to database
  const result = db.prepare(
    'INSERT INTO repositories (name, description, created_by) VALUES (?, ?, ?)'
  ).run(name, description || null, req.user!.id);

  res.status(201).json({
    id: result.lastInsertRowid,
    name,
    description,
    created_by: req.user!.id,
    created_at: new Date().toISOString()
  });
}));

// Get repository info
router.get('/:name', authenticate, asyncHandler(async (req, res) => {
  const { name } = req.params;

  const repoInfo = await svnService.getRepositoryInfo(name);
  const dbInfo = db.prepare('SELECT * FROM repositories WHERE name = ?').get(name) as any;

  res.json({
    ...repoInfo,
    ...dbInfo
  });
}));

// Delete repository
router.delete('/:name', authenticate, authorize(['admin']), asyncHandler(async (req, res) => {
  const { name } = req.params;

  await svnService.deleteRepository(name);
  db.prepare('DELETE FROM repositories WHERE name = ?').run(name);

  res.status(204).send();
}));

// Browse repository
router.get('/:name/browse/*', authenticate, asyncHandler(async (req, res) => {
  const { name } = req.params;
  const path = '/' + (req.params[0] || '');
  const revision = req.query.revision ? parseInt(req.query.revision as string, 10) : undefined;

  const tree = await svnService.browseRepository(name, path, revision);
  res.json(tree);
}));

// Get file content
router.get('/:name/content/*', authenticate, asyncHandler(async (req, res) => {
  const { name } = req.params;
  const filePath = '/' + (req.params[0] || '');
  const revision = req.query.revision ? parseInt(req.query.revision as string, 10) : undefined;

  const content = await svnService.getFileContent(name, filePath, revision);
  res.send(content);
}));

// Get commit log
router.get('/:name/log', authenticate, asyncHandler(async (req, res) => {
  const { name } = req.params;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

  const commits = await svnService.getCommitLog(name, limit);
  res.json(commits);
}));

// Manage permissions
router.post('/:name/permissions', authenticate, authorize(['admin']), asyncHandler(async (req, res) => {
  const { name } = req.params;
  const { userId, permission } = z.object({
    userId: z.number(),
    permission: z.enum(['read', 'write', 'admin'])
  }).parse(req.body);

  const repo = db.prepare('SELECT id FROM repositories WHERE name = ?').get(name) as any;
  if (!repo) {
    throw new AppError('Repository not found', 404);
  }

  db.prepare(`
    INSERT INTO permissions (user_id, repository_id, permission)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, repository_id)
    DO UPDATE SET permission = excluded.permission
  `).run(userId, repo.id, permission);

  res.json({ success: true });
}));

export default router;