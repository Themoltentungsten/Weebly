import axios from 'axios'

const rawBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

const api = axios.create({
  baseURL: rawBase,
  headers: { 'Content-Type': 'application/json' },
})

/** If VITE_API_URL is http://host:5000/api but paths are /api/..., avoid /api/api/... */
api.interceptors.request.use((config) => {
  const b = (config.baseURL || '').replace(/\/$/, '')
  if (b.endsWith('/api') && typeof config.url === 'string' && config.url.startsWith('/api/')) {
    config.url = config.url.slice(4)
  }
  return config
})

const token = localStorage.getItem('token')
if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`

export function setAuthToken(t) {
  if (t) {
    localStorage.setItem('token', t)
    api.defaults.headers.common.Authorization = `Bearer ${t}`
  } else {
    localStorage.removeItem('token')
    delete api.defaults.headers.common.Authorization
  }
}

export default api
