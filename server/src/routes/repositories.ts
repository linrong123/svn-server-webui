import { Router } from 'express';
import { z } from 'zod';
import { db } from '../services/database';
import { svnService } from '../services/svnService';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import asyncHandler from 'express-async-handler';
import { logger } from '../utils/logger';

const router = Router();

const createRepoSchema = z.object({
  name: z.string().regex(/^[a-zA-Z0-9_-]+$/, 'Invalid repository name'),
  description: z.string().optional()
});

// List all repositories
router.get('/', authenticate, asyncHandler(async (_req, res) => {
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

// Sync repositories from file system to database
router.post('/sync', authenticate, authorize(['admin']), asyncHandler(async (req, res) => {
  logger.info('Starting repository synchronization...');
  
  // Get all repositories from file system
  const fsRepos = await svnService.listRepositories();
  
  // Get all repositories from database
  const dbRepos = db.prepare('SELECT name FROM repositories').all() as { name: string }[];
  const dbRepoNames = new Set(dbRepos.map(r => r.name));
  
  // Find repositories that need to be added to database
  const reposToAdd = fsRepos.filter(repo => !dbRepoNames.has(repo.name));
  
  if (reposToAdd.length === 0) {
    res.json({ 
      message: 'All repositories are already synchronized',
      added: 0
    });
    return;
  }
  
  // Add missing repositories to database
  const insertStmt = db.prepare(`
    INSERT INTO repositories (name, description, created_by, created_at)
    VALUES (?, ?, ?, datetime('now'))
  `);
  
  let addedCount = 0;
  const addedRepos: string[] = [];
  
  for (const repo of reposToAdd) {
    try {
      insertStmt.run(
        repo.name,
        'Synchronized from file system',
        req.user!.id
      );
      addedCount++;
      addedRepos.push(repo.name);
      logger.info(`Synchronized repository: ${repo.name}`);
    } catch (error) {
      logger.error(`Failed to sync repository ${repo.name}:`, error);
    }
  }
  
  res.json({ 
    message: 'Synchronization completed',
    added: addedCount,
    repositories: addedRepos
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