
import axios from 'axios'

// We will build request URLs in the interceptor; avoid baseURL path-join quirks
let API_BASE = import.meta.env.VITE_API_BASE || ''
if (typeof window !== 'undefined' && window.location && window.location.protocol === 'https:' && typeof API_BASE === 'string' && API_BASE.startsWith('http://')) {
  API_BASE = API_BASE.replace('http://', 'https://')
}

const api = axios.create({ baseURL: API_BASE || '', headers: { 'Content-Type': 'application/json' } })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  // Force same-origin /api prefix for relative URLs
  try {
    if (typeof config.url === 'string') {
      let url = config.url
      const isAbsolute = /^https?:\/\//i.test(url)
      if (!isAbsolute) {
        if (!url.startsWith('/')) url = `/${url}`
        if (!url.startsWith('/api/')) url = `/api${url}`
      } else if (window?.location?.protocol === 'https:' && url.startsWith('http://')) {
        url = url.replace('http://', 'https://')
      }
      config.url = url
    }
  } catch (_) { /* no-op */ }
  // Normalize URLs for collection endpoints to include trailing slash to avoid 308 redirects
  try {
    const collections = new Set([
      'users','roles','staff','patients','service_requests','assignments','shifts','timesheets','payroll','invoices','compliance','visits','feedback','priviledges','operations','map'
    ])
    if (typeof config.url === 'string') {
      const [path, query] = config.url.split('?')
      const parts = path.split('/').filter(Boolean)
      // Support both "/roles" and "/api/roles" styles
      const isApiPrefixed = parts.length === 2 && parts[0] === 'api' && collections.has(parts[1])
      const isRootCollection = parts.length === 1 && collections.has(parts[0])
      if ((isApiPrefixed || isRootCollection) && !path.endsWith('/')) {
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
