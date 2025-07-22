import { api } from './api';
import { User } from '../types';

interface LoginResponse {
  token: string;
  user: User;
}

export const authService = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', {
      username,
      password,
    });
    return response.data;
  },

  async register(username: string, password: string, email?: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/register', {
      username,
      password,
      email,
    });
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/users/me');
    return response.data;
  },
};