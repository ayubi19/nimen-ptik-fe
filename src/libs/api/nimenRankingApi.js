import apiClient from './client'

export const nimenRankingApi = {
  getRankings: (params) =>
    apiClient.get('/nimen/rankings', { params }),

  getValueHistory: (studentId) =>
    apiClient.get(`/nimen/rankings/student/${studentId}`),

  getBatchEntries: (batchId, params) =>
    apiClient.get(`/nimen/rankings/batch/${batchId}/entries`, { params }),
}
