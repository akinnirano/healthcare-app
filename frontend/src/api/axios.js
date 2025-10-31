
import axios from 'axios'

// Point to same-origin /api by default; override with VITE_API_BASE if provided
let API_BASE = import.meta.env.VITE_API_BASE || '/api'
// Prevent mixed content if someone misconfigures VITE_API_BASE with http on an https page
if (typeof window !== 'undefined' && window.location && window.location.protocol === 'https:' && typeof API_BASE === 'string' && API_BASE.startsWith('http://')) {
  API_BASE = API_BASE.replace('http://', 'https://')
}

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export async function login(email, password){
  const resp = await api.post('/auth/login', { email, password })
  return resp.data
}

export default api
