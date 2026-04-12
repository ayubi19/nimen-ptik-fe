// Axios-based API client yang otomatis inject access token dari session

import axios from 'axios'
import { getSession } from 'next-auth/react'

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
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

// Handle response error global
apiClient.interceptors.response.use(
  response => response,
  error => {
    const message = error.response?.data?.message || 'Terjadi kesalahan'

    return Promise.reject(new Error(message))
  }
)

export default apiClient
