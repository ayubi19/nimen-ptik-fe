import apiClient from './client'

export const studentsApi = {
  getAll: (params) =>
    apiClient.get('/students', { params }),

  getById: (id) =>
    apiClient.get(`/students/${id}`),

  update: (id, data) =>
    apiClient.put(`/students/${id}`, data),

  toggleActive: (id) =>
    apiClient.patch(`/students/${id}/toggle-active`),
}
