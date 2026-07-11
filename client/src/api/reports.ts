import apiClient from './client';
import type { ApiResponse, Report, ReportConfig, AggregateAnalysis, Pagination } from '../types';

export const reportApi = {
  list: (params?: { questionnaireId?: string; severityLevel?: string; page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<Report[]> & { pagination: Pagination }>('/reports', { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Report>>(`/reports/${id}`),

  getByResponseId: (responseId: string) =>
    apiClient.get<ApiResponse<Report>>(`/reports/respondent/${responseId}`),

  regenerate: (responseId: string) =>
    apiClient.post<ApiResponse<Report>>(`/reports/${responseId}/regenerate`),

  getConfig: (questionnaireId: string) =>
    apiClient.get<ApiResponse<ReportConfig>>(`/reports/config/${questionnaireId}`),

  updateConfig: (questionnaireId: string, data: Partial<ReportConfig>) =>
    apiClient.put<ApiResponse<ReportConfig>>(`/reports/config/${questionnaireId}`, data),

  generateAggregate: (questionnaireId: string) =>
    apiClient.post<ApiResponse<AggregateAnalysis>>(`/reports/aggregate/${questionnaireId}`),

  getAggregate: (questionnaireId: string) =>
    apiClient.get<ApiResponse<AggregateAnalysis>>(`/reports/aggregate/${questionnaireId}`),
};
