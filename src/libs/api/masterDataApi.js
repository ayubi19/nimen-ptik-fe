import apiClient from './client'

// ─── Syndicate (Sindikat) ───────────────────────────────

export const syndicateApi = {
  getAll: (params) =>
    apiClient.get('/master-data/syndicates', { params }),

  getAllActive: () =>
    apiClient.get('/master-data/syndicates/active'),

  getById: (id) =>
    apiClient.get(`/master-data/syndicates/${id}`),

  create: (data) =>
    apiClient.post('/master-data/syndicates', data),

  update: (id, data) =>
    apiClient.put(`/master-data/syndicates/${id}`, data),

  delete: (id) =>
    apiClient.delete(`/master-data/syndicates/${id}`),
}

// ─── Batch (Angkatan) ───────────────────────────────────

export const batchApi = {
  getAll: (params) =>
    apiClient.get('/master-data/batches', { params }),

  getAllActive: () =>
    apiClient.get('/master-data/batches/active'),

  getById: (id) =>
    apiClient.get(`/master-data/batches/${id}`),

  create: (data) =>
    apiClient.post('/master-data/batches', data),

  update: (id, data) =>
    apiClient.put(`/master-data/batches/${id}`, data),

  delete: (id) =>
    apiClient.delete(`/master-data/batches/${id}`),
}

// ─── Academic Status (Status Akademik) ─────────────────

export const academicStatusApi = {
  getAll: (params) =>
    apiClient.get('/master-data/academic-statuses', { params }),

  getAllActive: () =>
    apiClient.get('/master-data/academic-statuses/active'),

  getById: (id) =>
    apiClient.get(`/master-data/academic-statuses/${id}`),

  create: (data) =>
    apiClient.post('/master-data/academic-statuses', data),

  update: (id, data) =>
    apiClient.put(`/master-data/academic-statuses/${id}`, data),

  delete: (id) =>
    apiClient.delete(`/master-data/academic-statuses/${id}`),
}
