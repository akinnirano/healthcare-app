
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
  // Normalize URLs for collection endpoints to include trailing slash to avoid 308 redirects
  try {
    const collections = new Set([
      'users','roles','staff','patients','service_requests','assignments','shifts','timesheets','payroll','invoices','compliance','visits','feedback','priviledges','operations','map'
    ])
    if (typeof config.url === 'string') {
      const [path, query] = config.url.split('?')
      const parts = path.split('/').filter(Boolean)
      if (parts.length === 1 && collections.has(parts[0]) && !path.endsWith('/')) {
        config.url = `${path}/${query ? `?${query}` : ''}`
      }
    }
  } catch (_) { /* no-op */ }
  return config
})

export async function login(email, password){
  const resp = await api.post('/auth/login', { email, password })
  return resp.data
}

export default api
