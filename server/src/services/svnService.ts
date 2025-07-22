import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../utils/logger';

const SVN_REPOS_PATH = process.env.SVN_REPOS_PATH || '/svn/repos';

export interface SvnRepository {
  name: string;
  path: string;
  uuid?: string;
  revision?: number;
}

export class SvnService {
  private execCommand(command: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args);
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Command failed: ${stderr}`));
        }
      });
    });
  }

  async createRepository(name: string): Promise<void> {
    const repoPath = path.join(SVN_REPOS_PATH, name);
    
    try {
      await this.execCommand('svnadmin', ['create', repoPath]);
      
      // Set permissions
      await this.execCommand('chown', ['-R', 'apache:apache', repoPath]);
      
      logger.info(`Created SVN repository: ${name}`);
    } catch (error) {
      logger.error(`Failed to create repository ${name}:`, error);
      throw error;
    }
  }

  async deleteRepository(name: string): Promise<void> {
    const repoPath = path.join(SVN_REPOS_PATH, name);
    
    try {
      await fs.rm(repoPath, { recursive: true, force: true });
      logger.info(`Deleted SVN repository: ${name}`);
    } catch (error) {
      logger.error(`Failed to delete repository ${name}:`, error);
      throw error;
    }
  }

  async listRepositories(): Promise<SvnRepository[]> {
    try {
      const dirs = await fs.readdir(SVN_REPOS_PATH);
      const repos: SvnRepository[] = [];

      for (const dir of dirs) {
        const repoPath = path.join(SVN_REPOS_PATH, dir);
        const stat = await fs.stat(repoPath);

        if (stat.isDirectory()) {
          try {
            // Check if it's a valid SVN repository
            const formatFile = path.join(repoPath, 'format');
            await fs.access(formatFile);
            
            repos.push({
              name: dir,
              path: repoPath
            });
          } catch {
            // Not a valid SVN repository, skip
          }
        }
      }

      return repos;
    } catch (error) {
      logger.error('Failed to list repositories:', error);
      throw error;
    }
  }

  async getRepositoryInfo(name: string): Promise<SvnRepository> {
    const repoPath = path.join(SVN_REPOS_PATH, name);
    
    try {
      await this.execCommand('svnlook', ['info', repoPath]);
      const uuid = await this.execCommand('svnlook', ['uuid', repoPath]);
      const youngest = await this.execCommand('svnlook', ['youngest', repoPath]);

      return {
        name,
        path: repoPath,
        uuid: uuid.trim(),
        revision: parseInt(youngest.trim(), 10)
      };
    } catch (error) {
      logger.error(`Failed to get repository info for ${name}:`, error);
      throw error;
    }
  }

  async browseRepository(name: string, svnPath: string = '/', revision?: number): Promise<any> {
    const repoPath = path.join(SVN_REPOS_PATH, name);
    
    try {
      const args = ['tree', repoPath, '--full-paths'];
      if (revision !== undefined) {
        args.push('-r', revision.toString());
      }
      if (svnPath !== '/') {
        args.push(svnPath);
      }

      const output = await this.execCommand('svnlook', args);
      const lines = output.split('\n').filter(line => line.trim());
      
      const tree: any = { name: svnPath, type: 'directory', children: [] };
      const pathMap = new Map<string, any>();
      pathMap.set(svnPath, tree);

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const isDirectory = trimmed.endsWith('/');
        const fullPath = '/' + trimmed.replace(/\/$/, '');
        const parts = fullPath.split('/').filter(p => p);
        const name = parts[parts.length - 1];
        const parentPath = '/' + parts.slice(0, -1).join('/');

        const node = {
          name,
          path: fullPath,
          type: isDirectory ? 'directory' : 'file',
          children: isDirectory ? [] : undefined
        };

        const parent = pathMap.get(parentPath) || tree;
        if (parent.children) {
          parent.children.push(node);
        }
        
        if (isDirectory) {
          pathMap.set(fullPath, node);
        }
      }

      return tree;
    } catch (error) {
      logger.error(`Failed to browse repository ${name}:`, error);
      throw error;
    }
  }

  async getFileContent(repoName: string, filePath: string, revision?: number): Promise<string> {
    const repoPath = path.join(SVN_REPOS_PATH, repoName);
    
    try {
      const args = ['cat', repoPath, filePath];
      if (revision !== undefined) {
        args.push('-r', revision.toString());
      }

      const content = await this.execCommand('svnlook', args);
      return content;
    } catch (error) {
      logger.error(`Failed to get file content ${repoName}:${filePath}:`, error);
      throw error;
    }
  }

  async getCommitLog(repoName: string, limit: number = 20): Promise<any[]> {
    const repoPath = path.join(SVN_REPOS_PATH, repoName);
    
    try {
      const youngest = await this.execCommand('svnlook', ['youngest', repoPath]);
      const latestRev = parseInt(youngest.trim(), 10);
      
      const commits = [];
      const startRev = Math.max(1, latestRev - limit + 1);

      for (let rev = latestRev; rev >= startRev; rev--) {
        try {
          const author = await this.execCommand('svnlook', ['author', repoPath, '-r', rev.toString()]);
          const date = await this.execCommand('svnlook', ['date', repoPath, '-r', rev.toString()]);
          const log = await this.execCommand('svnlook', ['log', repoPath, '-r', rev.toString()]);
          const changed = await this.execCommand('svnlook', ['changed', repoPath, '-r', rev.toString()]);

          commits.push({
            revision: rev,
            author: author.trim(),
            date: date.trim(),
            message: log.trim(),
            changes: changed.trim().split('\n').filter(line => line.trim())
          });
        } catch {
          // Skip if revision doesn't exist
          continue;
        }
      }

      return commits;
    } catch (error) {
      logger.error(`Failed to get commit log for ${repoName}:`, error);
      throw error;
    }
  }
}

export const svnService = new SvnService();