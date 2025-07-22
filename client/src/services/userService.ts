import { api } from './api';
import { User, Permission } from '../types';

export const userService = {
  async list(): Promise<User[]> {
    const response = await api.get<User[]>('/users');
    return response.data;
  },

  async update(id: number, data: Partial<User> & { password?: string }): Promise<User> {
    const response = await api.patch<User>(`/users/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  async getPermissions(id: number): Promise<Permission[]> {
    const response = await api.get<Permission[]>(`/users/${id}/permissions`);
    return response.data;
  },
};