import axios from 'axios'
import { getSession, signOut } from 'next-auth/react'

const apiClient = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' }
})

// Inject token di setiap request
apiClient.interceptors.request.use(async config => {
  const session = await getSession()

  if (session?.user?.accessToken) {
    config.headers.Authorization = `Bearer ${session.user.accessToken}`
  }

  return config
})

// Handle response — auto logout jika session error (refresh token expired)
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const session = await getSession()

    // Jika session punya error RefreshTokenExpired — paksa logout
    if (session?.error === 'RefreshTokenExpired') {
      await signOut({ callbackUrl: '/login' })
      return Promise.reject(new Error('Sesi berakhir, silakan login kembali'))
    }

    // 401 tapi session masih ada — token mungkin baru direfresh, retry sekali
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true

      const newSession = await getSession()
      if (newSession?.user?.accessToken) {
        error.config.headers.Authorization = `Bearer ${newSession.user.accessToken}`
        return apiClient(error.config)
      }

      // Tidak ada token baru — logout
      await signOut({ callbackUrl: '/login' })
      return Promise.reject(new Error('Sesi berakhir, silakan login kembali'))
    }

    const message = error.response?.data?.message || 'Terjadi kesalahan'
    return Promise.reject(new Error(message))
  }
)

export default apiClient
