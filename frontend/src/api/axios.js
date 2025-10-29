
import axios from 'axios'

// Point to FastAPI by default; override with VITE_API_BASE if provided
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

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
