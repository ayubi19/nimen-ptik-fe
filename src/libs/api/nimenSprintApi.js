import apiClient from './client'

export const nimenSprintApi = {
  getAll: (params) =>
    apiClient.get('/nimen/sprints', { params }),

  getById: (id) =>
    apiClient.get(`/nimen/sprints/${id}`),

  create: (data) =>
    apiClient.post('/nimen/sprints', data),

  update: (id, data) =>
    apiClient.put(`/nimen/sprints/${id}`, data),

  delete: (id) =>
    apiClient.delete(`/nimen/sprints/${id}`),

  // Peserta
  getParticipants: (id) =>
    apiClient.get(`/nimen/sprints/${id}/participants`),

  addParticipants: (id, data) =>
    apiClient.post(`/nimen/sprints/${id}/participants`, data),

  removeParticipant: (id, data) =>
    apiClient.delete(`/nimen/sprints/${id}/participants`, { data }),

  // Generator
  generateParticipants: (id, data) =>
    apiClient.post(`/nimen/sprints/${id}/generate-participants`, data),

  // P3b — Koordinator flow
  getCoordinators: (id) =>
    apiClient.get(`/nimen/sprints/${id}/coordinators`),

  sendToCoordinator: (id, data) =>
    apiClient.post(`/nimen/sprints/${id}/send-to-coordinator`, data),

  getAvailableStudents: (id) =>
    apiClient.get(`/nimen/sprints/${id}/available-students`),

  coordinatorSubmit: (id, data) =>
    apiClient.post(`/nimen/sprints/${id}/coordinator-submit`, data),

  finalize: (id, data) =>
    apiClient.post(`/nimen/sprints/${id}/finalize`, data),
}
