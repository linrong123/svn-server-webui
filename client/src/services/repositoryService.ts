import { api } from './api';
import { Repository, TreeNode, Commit } from '../types';

export const repositoryService = {
  async list(): Promise<Repository[]> {
    const response = await api.get<Repository[]>('/repositories');
    return response.data;
  },

  async create(name: string, description?: string): Promise<Repository> {
    const response = await api.post<Repository>('/repositories', {
      name,
      description,
    });
    return response.data;
  },

  async get(name: string): Promise<Repository> {
    const response = await api.get<Repository>(`/repositories/${name}`);
    return response.data;
  },

  async delete(name: string): Promise<void> {
    await api.delete(`/repositories/${name}`);
  },

  async browse(name: string, path: string = '/', revision?: number): Promise<TreeNode> {
    const params = revision ? { revision } : {};
    const response = await api.get<TreeNode>(
      `/repositories/${name}/browse${path}`,
      { params }
    );
    return response.data;
  },

  async getFileContent(name: string, path: string, revision?: number): Promise<string> {
    const params = revision ? { revision } : {};
    const response = await api.get<string>(
      `/repositories/${name}/content${path}`,
      { params }
    );
    return response.data;
  },

  async getCommitLog(name: string, limit: number = 20): Promise<Commit[]> {
    const response = await api.get<Commit[]>(`/repositories/${name}/log`, {
      params: { limit },
    });
    return response.data;
  },

  async setPermission(name: string, userId: number, permission: string): Promise<void> {
    await api.post(`/repositories/${name}/permissions`, {
      userId,
      permission,
    });
  },
};