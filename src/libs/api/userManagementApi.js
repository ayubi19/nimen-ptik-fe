import apiClient from './client'

export const userManagementApi = {
  getAll: (params) =>
    apiClient.get('/users', { params }),

  getById: (id) =>
    apiClient.get(`/users/${id}`),

  create: (data) =>
    apiClient.post('/users', data),

  update: (id, data) =>
    apiClient.put(`/users/${id}`, data),

  toggleActive: (id) =>
    apiClient.patch(`/users/${id}/toggle-active`),

  delete: (id) =>
    apiClient.delete(`/users/${id}`),
}
