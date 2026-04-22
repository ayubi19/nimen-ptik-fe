import apiClient from './client'

export const nimenSelfSubmissionApi = {
  // Mahasiswa
  getAvailableIndicators: () =>
    apiClient.get('/nimen/self-submissions/available-indicators'),

  getMy: (params) =>
    apiClient.get('/nimen/self-submissions/my', { params }),

  create: (data) =>
    apiClient.post('/nimen/self-submissions', data),

  cancel: (id) =>
    apiClient.delete(`/nimen/self-submissions/${id}`),

  uploadDocument: (id, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post(`/nimen/self-submissions/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  deleteDocument: (id, docId) =>
    apiClient.delete(`/nimen/self-submissions/${id}/documents/${docId}`),

  getDocPresignedURL: (id, docId) =>
    apiClient.get(`/nimen/self-submissions/${id}/documents/${docId}/presign`),

  // Admin
  getAll: (params) =>
    apiClient.get('/nimen/self-submissions', { params }),

  getById: (id) =>
    apiClient.get(`/nimen/self-submissions/${id}`),

  review: (id, data) =>
    apiClient.post(`/nimen/self-submissions/${id}/review`, data),
}
