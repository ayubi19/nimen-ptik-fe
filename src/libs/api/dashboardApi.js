import apiClient from './client'

export const dashboardApi = {
  getAdminSummary: () => apiClient.get('/dashboard/admin-summary'),
}
