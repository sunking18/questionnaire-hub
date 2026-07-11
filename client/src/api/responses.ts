import apiClient from './client';
import type { ApiResponse, Response, Pagination } from '../types';

export const responseApi = {
  submit: (shareCode: string, data: {
    answers: Record<string, any>;
    score: Record<string, any>;
    totalScore: number;
    severityLevel: string;
    duration?: number;
  }) => apiClient.post<ApiResponse<{ response: any; report: any }>>(`/responses/${shareCode}`, data),

  list: (params?: { questionnaireId?: string; page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<Response[]> & { pagination: Pagination }>('/responses', { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Response>>(`/responses/${id}`),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/responses/${id}`),

  exportCsv: (questionnaireId: string) =>
    apiClient.get(`/responses/export/${questionnaireId}`, { responseType: 'blob' }),
};
