import apiClient from './client'

export const notificationApi = {
  // Ambil semua notifikasi + unread_count
  getAll: () => apiClient.get('/notifications'),

  // Hanya unread count
  getUnreadCount: () => apiClient.get('/notifications/unread-count'),

  // Tandai 1 notifikasi sebagai dibaca
  markRead: (id) => apiClient.patch(`/notifications/${id}/read`),

  // Tandai semua sebagai dibaca
  markAllRead: () => apiClient.patch('/notifications/read-all'),

  // Web Push subscription
  subscribe:   (data) => apiClient.post('/push-subscriptions', data),
  unsubscribe: (endpoint) => apiClient.delete('/push-subscriptions', { data: { endpoint } }),
}
