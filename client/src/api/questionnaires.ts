import apiClient from './client';
import type { ApiResponse, Questionnaire, Pagination } from '../types';

export const questionnaireApi = {
  list: (params?: { search?: string; status?: string; page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<Questionnaire[]> & { pagination: Pagination }>('/questionnaires', { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Questionnaire>>(`/questionnaires/${id}`),

  create: (data: Partial<Questionnaire>) =>
    apiClient.post<ApiResponse<Questionnaire>>('/questionnaires', data),

  update: (id: string, data: Partial<Questionnaire>) =>
    apiClient.put<ApiResponse<Questionnaire>>(`/questionnaires/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/questionnaires/${id}`),

  getByShareCode: (shareCode: string) =>
    apiClient.get<ApiResponse<Questionnaire>>(`/questionnaires/public/${shareCode}`),
};
