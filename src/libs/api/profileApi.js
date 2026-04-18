import apiClient from './client'

export const profileApi = {
  getProfile: () =>
    apiClient.get('/profile'),

  updateProfile: (data) =>
    apiClient.put('/profile', data),

  changePassword: (data) =>
    apiClient.put('/profile/change-password', data),

  updateAvatar: (formData) =>
    apiClient.post('/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
}
