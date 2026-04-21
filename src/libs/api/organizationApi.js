import apiClient from './client'

// ─── Master Jabatan ───────────────────────────────────────────────────────────

export const studentPositionApi = {
  getAll: (params) =>
    apiClient.get('/student-positions', { params }),

  create: (data) =>
    apiClient.post('/student-positions', data),

  update: (id, data) =>
    apiClient.put(`/student-positions/${id}`, data),
}

// ─── Assignment Struktur Organisasi ──────────────────────────────────────────

export const positionAssignmentApi = {
  getByBatch: (batchId, params) =>
    apiClient.get('/student-position-assignments', { params: { batch_id: batchId, ...params } }),

  assign: (data) =>
    apiClient.post('/student-position-assignments', data),

  update: (id, data) =>
    apiClient.put(`/student-position-assignments/${id}`, data),

  remove: (id) =>
    apiClient.delete(`/student-position-assignments/${id}`),
}
