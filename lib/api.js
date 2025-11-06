// lib/api.js
import axios from 'axios'

// ✅ Create Axios instance
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  withCredentials: true, // Keeps cookies if backend uses them
  timeout: 15000, // 15s timeout for slow networks
})

// ✅ Attach JWT token automatically
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    // Request configuration error
    return Promise.reject(error)
  }
)

// ✅ Handle API errors globally (optional but useful)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Automatically handle unauthorized errors
    if (error.response?.status === 401) {
      console.warn('Session expired or unauthorized. Logging out...')
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        // Optional redirect to login
        // window.location.href = '/login'
      }
    }

    // Optional logging for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', error.response || error.message)
    }

    return Promise.reject(error)
  }
)
