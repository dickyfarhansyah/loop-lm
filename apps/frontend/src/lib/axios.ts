import axios from "axios"

const API_URL = import.meta.env.VITE_API_URL ?? ""

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

// Idempotency Logic
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: any) => void
}> = []

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve()
    }
  })
  failedQueue = []
}


api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      
      if (originalRequest.url === "/api/v1/auths/refresh") {
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => {
            return api(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        await api.post("/api/v1/auths/refresh")
        
        processQueue(null)
        
        return api(originalRequest)
        
      } catch (refreshError) {
        processQueue(refreshError)
        return Promise.reject(refreshError)
        
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)
