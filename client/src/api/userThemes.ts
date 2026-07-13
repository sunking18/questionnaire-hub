import apiClient from './client';
import type { ApiResponse, QuestionnaireTheme } from '../types';

export interface UserTheme {
  id: string;
  userId: string;
  name: string;
  theme: QuestionnaireTheme;
  createdAt: string;
  updatedAt: string;
}

export const userThemeApi = {
  list: () =>
    apiClient.get<ApiResponse<UserTheme[]>>('/user-themes'),

  getById: (id: string) =>
    apiClient.get<ApiResponse<UserTheme>>(`/user-themes/${id}`),

  create: (data: { name: string; theme: QuestionnaireTheme }) =>
    apiClient.post<ApiResponse<UserTheme>>('/user-themes', data),

  update: (id: string, data: { name?: string; theme?: QuestionnaireTheme }) =>
    apiClient.put<ApiResponse<UserTheme>>(`/user-themes/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/user-themes/${id}`),

  apply: (id: string, questionnaireId: string) =>
    apiClient.post<ApiResponse<any>>(`/user-themes/${id}/apply`, { questionnaireId }),
};
