import apiClient from './client'

// ─── Sprint Attachments (dokumen penunjang, admin) ────────────────────────────

export const nimenAttachmentApi = {
  getAll: (sprintId) =>
    apiClient.get(`/nimen/sprints/${sprintId}/attachments`),

  upload: (sprintId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post(`/nimen/sprints/${sprintId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  delete: (sprintId, attachmentId) =>
    apiClient.delete(`/nimen/sprints/${sprintId}/attachments/${attachmentId}`),

  getPresignedURL: (sprintId, attachmentId) =>
    apiClient.get(`/nimen/sprints/${sprintId}/attachments/${attachmentId}/presign`),
}

// ─── Participant Documents (dokumen peserta, mahasiswa) ───────────────────────

export const nimenParticipantDocApi = {
  getMySprints: () =>
    apiClient.get('/nimen/sprints/my-sprints'),

  getMyDocuments: (sprintId) =>
    apiClient.get(`/nimen/sprints/${sprintId}/my-documents`),

  upload: (sprintId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post(`/nimen/sprints/${sprintId}/my-documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  delete: (sprintId, docId) =>
    apiClient.delete(`/nimen/sprints/${sprintId}/my-documents/${docId}`),

  getPresignedURL: (sprintId, docId) =>
    apiClient.get(`/nimen/sprints/${sprintId}/my-documents/${docId}/presign`),

  // Admin lihat dokumen peserta tertentu
  getParticipantDocuments: (sprintId, studentId) =>
    apiClient.get(`/nimen/sprints/${sprintId}/participants/${studentId}/documents`),

  getParticipantDocPresignedURL: (sprintId, studentId, docId) =>
    apiClient.get(`/nimen/sprints/${sprintId}/my-documents/${docId}/presign`),
}
