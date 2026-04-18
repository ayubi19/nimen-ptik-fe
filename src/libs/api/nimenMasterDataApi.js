import apiClient from './client'

// ─── NIMEN Tree (dropdown bertingkat kategori > variabel > indikator) ───

export const nimenTreeApi = {
  getTree: (onlyActive = true) =>
    apiClient.get('/nimen/master-data/tree', { params: { only_active: onlyActive } }),
}

// ─── NIMEN Category ─────────────────────────────────────────────────────

export const nimenCategoryApi = {
  getAll: (params) =>
    apiClient.get('/nimen/master-data/categories', { params }),

  getById: (id) =>
    apiClient.get(`/nimen/master-data/categories/${id}`),

  create: (data) =>
    apiClient.post('/nimen/master-data/categories', data),

  update: (id, data) =>
    apiClient.put(`/nimen/master-data/categories/${id}`, data),

  delete: (id) =>
    apiClient.delete(`/nimen/master-data/categories/${id}`),
}

// ─── NIMEN Variable ──────────────────────────────────────────────────────

export const nimenVariableApi = {
  getAll: (params) =>
    apiClient.get('/nimen/master-data/variables', { params }),

  getById: (id) =>
    apiClient.get(`/nimen/master-data/variables/${id}`),

  create: (data) =>
    apiClient.post('/nimen/master-data/variables', data),

  update: (id, data) =>
    apiClient.put(`/nimen/master-data/variables/${id}`, data),

  delete: (id) =>
    apiClient.delete(`/nimen/master-data/variables/${id}`),
}

// ─── NIMEN Indicator ─────────────────────────────────────────────────────

export const nimenIndicatorApi = {
  getAll: (params) =>
    apiClient.get('/nimen/master-data/indicators', { params }),

  getById: (id) =>
    apiClient.get(`/nimen/master-data/indicators/${id}`),

  create: (data) =>
    apiClient.post('/nimen/master-data/indicators', data),

  update: (id, data) =>
    apiClient.put(`/nimen/master-data/indicators/${id}`, data),

  delete: (id) =>
    apiClient.delete(`/nimen/master-data/indicators/${id}`),
}

// ─── Batch NIMEN Config ──────────────────────────────────────────────────

export const batchNimenConfigApi = {
  getConfig: (batchId) =>
    apiClient.get(`/nimen/batch-config/${batchId}`),

  updateConfig: (batchId, data) =>
    apiClient.put(`/nimen/batch-config/${batchId}`, data),
}
