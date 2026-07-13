import apiClient from './client';
import type { ApiResponse, Questionnaire, Pagination, NotificationConfig } from '../types';

export const questionnaireApi = {
  list: (params?: { search?: string; status?: string; page?: number; limit?: number; trash?: boolean; starred?: boolean }) =>
    apiClient.get<ApiResponse<Questionnaire[]> & { pagination: Pagination }>('/questionnaires', { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Questionnaire>>(`/questionnaires/${id}`),

  create: (data: Partial<Questionnaire>) =>
    apiClient.post<ApiResponse<Questionnaire>>('/questionnaires', data),

  update: (id: string, data: Partial<Questionnaire>) =>
    apiClient.put<ApiResponse<Questionnaire>>(`/questionnaires/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/questionnaires/${id}`),

  clone: (id: string, data: { title?: string; includeSettings?: boolean }) =>
    apiClient.post<ApiResponse<Questionnaire>>(`/questionnaires/${id}/clone`, data),

  star: (id: string, isStarred: boolean) =>
    apiClient.put<ApiResponse<null>>(`/questionnaires/${id}/star`, { isStarred }),

  restore: (id: string) =>
    apiClient.put<ApiResponse<null>>(`/questionnaires/${id}/restore`, {}),

  permanentDelete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/questionnaires/${id}/permanent`),

  getNotifications: (id: string) =>
    apiClient.get<ApiResponse<NotificationConfig>>(`/questionnaires/${id}/notifications`),

  saveNotifications: (id: string, data: Partial<NotificationConfig>) =>
    apiClient.put<ApiResponse<NotificationConfig>>(`/questionnaires/${id}/notifications`, data),

  getByShareCode: (shareCode: string) =>
    apiClient.get<ApiResponse<Questionnaire>>(`/questionnaires/public/${shareCode}`),
};
