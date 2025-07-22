export interface User {
  id: number;
  username: string;
  email?: string;
  role: 'user' | 'admin';
  created_at?: string;
  updated_at?: string;
}

export interface Repository {
  id?: number;
  name: string;
  description?: string;
  path?: string;
  uuid?: string;
  revision?: number;
  created_by?: number;
  created_by_username?: string;
  created_at?: string;
  updated_at?: string;
  exists?: boolean;
}

export interface Permission {
  id: number;
  user_id: number;
  repository_id: number;
  permission: 'read' | 'write' | 'admin';
  created_at: string;
  repository_name?: string;
  repository_description?: string;
}

export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
}

export interface Commit {
  revision: number;
  author: string;
  date: string;
  message: string;
  changes: string[];
}