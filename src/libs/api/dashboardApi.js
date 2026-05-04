import apiClient from './client'

export const dashboardApi = {
  getAdminSummary: () => apiClient.get('/dashboard/admin-summary'),
  getStudentSummary: () => apiClient.get('/dashboard/student-summary'),
}
