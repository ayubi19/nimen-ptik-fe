import apiClient from './client'

export const onboardingApi = {
  getAll: (params) =>
    apiClient.get('/onboarding/registrations', { params }),

  getById: (id) =>
    apiClient.get(`/onboarding/registrations/${id}`),

  approve: (id, data) =>
    apiClient.post(`/onboarding/registrations/${id}/approve`, data),

  reject: (id, data) =>
    apiClient.post(`/onboarding/registrations/${id}/reject`, data),
}

export const telegramAdminApi = {
  registerAdmin: (data) =>
    apiClient.post('/onboarding/register-admin-telegram', data),
}
