import apiClient from './client';
import type { ApiResponse, User } from '../types';

export const authApi = {
  register: (data: { email: string; password: string; displayName?: string }) =>
    apiClient.post<ApiResponse<{ user: User; token: string }>>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<ApiResponse<{ user: User; token: string }>>('/auth/login', data),

  getMe: () =>
    apiClient.get<ApiResponse<User>>('/auth/me'),

  updateProfile: (data: { displayName?: string; avatarUrl?: string }) =>
    apiClient.put<ApiResponse<User>>('/auth/profile', data),
};
