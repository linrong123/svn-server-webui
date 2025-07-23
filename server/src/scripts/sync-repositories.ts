import { db, setupDatabase } from '../services/database';
import { svnService } from '../services/svnService';
import { logger } from '../utils/logger';

async function syncRepositories() {
  try {
    // 确保数据库已初始化
    await setupDatabase();
    
    logger.info('Starting repository synchronization...');
    
    // 获取文件系统中的所有仓库
    const fsRepos = await svnService.listRepositories();
    logger.info(`Found ${fsRepos.length} repositories in file system`);
    
    // 获取数据库中的所有仓库
    const dbRepos = db.prepare('SELECT name FROM repositories').all() as { name: string }[];
    const dbRepoNames = new Set(dbRepos.map(r => r.name));
    logger.info(`Found ${dbRepos.length} repositories in database`);
    
    // 找出需要添加到数据库的仓库
    const reposToAdd = fsRepos.filter(repo => !dbRepoNames.has(repo.name));
    
    if (reposToAdd.length === 0) {
      logger.info('All repositories are already synchronized');
      return;
    }
    
    // 添加缺失的仓库到数据库
    const insertStmt = db.prepare(`
      INSERT INTO repositories (name, description, created_by, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `);
    
    for (const repo of reposToAdd) {
      try {
        // 插入数据库（使用系统用户ID 1，通常是admin）
        insertStmt.run(
          repo.name,
          `Synchronized from file system`,
          1
        );
        
        logger.info(`Synchronized repository: ${repo.name}`);
      } catch (error) {
        logger.error(`Failed to sync repository ${repo.name}:`, error);
      }
    }
    
    logger.info(`Synchronization completed. Added ${reposToAdd.length} repositories to database`);
    
  } catch (error) {
    logger.error('Repository synchronization failed:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  syncRepositories()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}