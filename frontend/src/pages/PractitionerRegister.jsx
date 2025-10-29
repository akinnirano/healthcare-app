import React, { useEffect, useMemo, useState } from 'react'
import api from '../api/axios'
import bcrypt from 'bcryptjs'
import FooterBlue from '../components/FooterBlue'

export default function PractitionerRegister(){
  const [form, setForm] = useState({ full_name: '', username: '', email: '', password: '', phone: '', address: '', latitude: '', longitude: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [errorLog, setErrorLog] = useState('')

  const latNum = useMemo(() => form.latitude ? parseFloat(form.latitude) : null, [form.latitude])
  const lngNum = useMemo(() => form.longitude ? parseFloat(form.longitude) : null, [form.longitude])

  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  // Auto-geocode when address changes (debounced)
  useEffect(() => {
    if (!form.address || form.address.trim().length < 5) return
    const t = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(form.address)}`
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          const top = data[0]
          setForm(prev => ({ ...prev, latitude: top.lat, longitude: top.lon }))
        }
      } catch (_) { /* ignore */ }
    }, 700)
    return () => clearTimeout(t)
  }, [form.address])

  async function ensureAdminRole(){
    // Build full CRUD privilege codes for each module
    const modules = [
      'USERS','ROLES','STAFF','PATIENTS','SERVICE_REQUESTS','ASSIGNMENTS','SHIFTS','TIMESHEETS','PAYROLL','INVOICES','COMPLIANCE','OPERATIONS','VISITS','FEEDBACK','PRIVILEGES'
    ]
    const actions = ['CREATE','READ','UPDATE','DELETE']
    const needed = new Set()
    modules.forEach(m => actions.forEach(a => needed.add(`${m}_${a}`)))

    // Fetch existing privileges and create missing
    const list = await api.get('/priviledges', { params: { limit: 1000 } }).then(r => Array.isArray(r.data)? r.data: []).catch(()=>[])
    const codeToId = new Map(list.map(p => [String(p.code).toUpperCase(), p.id]))
    for (const code of needed){
      if (!codeToId.has(code)){
        try {
          const res = await api.post('/priviledges', null, { params: { code, description: `${code.replace('_',' ')} permission` } })
          if (res?.data?.id) codeToId.set(code, res.data.id)
        } catch (_) { /* continue */ }
      }
    }

    // Ensure Admin role exists with all privilege ids
    const roles = await api.get('/roles', { params: { limit: 1000 } }).then(r => Array.isArray(r.data)? r.data: []).catch(()=>[])
    const admin = roles.find(r => String(r.name||'').toLowerCase() === 'admin')
    const allIds = Array.from(codeToId.values())
    if (!admin){
      const res = await api.post('/roles', null, { params: { name: 'Admin', description: 'Administrator', privilege_ids: allIds } })
      return res?.data?.id
    } else {
      try { await api.put(`/roles/${admin.id}`, null, { params: { privilege_ids: allIds } }) } catch(_){/* ignore */}
      return admin.id
    }
  }

  async function onSubmit(e){
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setErrorLog('')
    try {
      // Ensure Admin role & privileges
      const adminRoleId = await ensureAdminRole()
      const password_hash = bcrypt.hashSync(form.password || 'changeme', 10)
      const resolvedEmail = form.email || form.username || null
      const userPayload = {
        full_name: form.full_name,
        email: resolvedEmail,
        password_hash,
        role_id: adminRoleId,
        phone: form.phone || null,
      }
      const userResp = await api.post('/users', null, { params: userPayload })
      const userId = userResp?.data?.id
      // If coordinates provided, persist as a staff profile shell for location
      const lat = form.latitude ? parseFloat(form.latitude) : null
      const lon = form.longitude ? parseFloat(form.longitude) : null
      if (userId && (lat || lon)){
        try {
          const staffPayload = { user_id: userId, license_number: null, skills: [], latitude: lat, longitude: lon }
          await api.post('/staff', null, { params: staffPayload })
        } catch (_) { /* ignore */ }
      }
      setMessage('Admin user has been registered. They have full privileges.')
      setForm({ full_name: '', username: '', email: '', password: '', phone: '', address: '', latitude: '', longitude: '' })
    } catch (err) {
      console.error(err)
      const detail = err?.response?.data || { message: err?.message }
      setErrorLog(JSON.stringify(detail, null, 2))
      setMessage(err?.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Banner with watermark and vector illustration */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-50 to-cyan-50 ring-1 ring-sky-100 p-6">
        <div className="relative z-10 grid items-center gap-6 sm:grid-cols-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Register Admin</h1>
            <p className="mt-1 text-sm text-gray-600">Create an administrator account with full system privileges.</p>
            <div className="mt-4">
              <a href="/login" className="inline-flex items-center justify-center rounded-lg border border-sky-200 bg-white px-4 py-2 text-sm font-medium text-sky-700 shadow-sm transition hover:border-sky-300">Have an account? Log in</a>
            </div>
          </div>
          <div className="hidden sm:block justify-self-end">
            <HeroVector />
          </div>
        </div>
        <div className="pointer-events-none absolute -right-10 -bottom-10 w-72 opacity-10">
          <WatermarkPractitioner />
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-6 grid gap-4 bg-white/80 rounded-2xl p-6 ring-1 ring-gray-100">
        {message && (
          <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
            {message}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full name</label>
            <input name="full_name" value={form.full_name} onChange={onChange} required className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input name="username" value={form.username} onChange={onChange} placeholder="username or email" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Address</label>
          <input name="address" value={form.address} onChange={onChange} placeholder="123 Main St, City, Country" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
          {!latNum && !lngNum && form.address && <div className="mt-1 text-xs text-gray-500">Detecting location…</div>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input name="email" type="email" value={form.email} onChange={onChange} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input name="password" type="password" value={form.password} onChange={onChange} required className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input name="phone" value={form.phone} onChange={onChange} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Latitude</label>
            <input name="latitude" type="number" step="any" value={form.latitude} onChange={onChange} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Longitude</label>
            <input name="longitude" type="number" step="any" value={form.longitude} onChange={onChange} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
        </div>
        <button disabled={loading} className="mt-2 rounded-lg bg-sky-600 px-5 py-2 text-white shadow hover:bg-sky-700 disabled:opacity-60">
          {loading ? 'Submitting...' : 'Create Admin'}
        </button>
        {message && (
          <div role="status" className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
            {message}
          </div>
        )}
        {errorLog && (
          <pre className="mt-2 overflow-auto rounded bg-rose-50 p-3 text-xs text-rose-700 ring-1 ring-rose-100">{errorLog}</pre>
        )}
      </form>

      <FooterBlue />

      {/* Map */}
      {latNum && lngNum && (
        <div className="mt-6 rounded-2xl ring-1 ring-gray-100 overflow-hidden shadow-sm">
          <iframe
            title="admin-map"
            width="100%"
            height="360"
            frameBorder="0"
            scrolling="no"
            src={`https://www.openstreetmap.org/export/embed.html?layer=mapnik&marker=${latNum}%2C${lngNum}`}
          />
          <div className="p-2 text-xs text-gray-500">
            <a className="underline" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${latNum}&mlon=${lngNum}#map=15/${latNum}/${lngNum}`}>View larger map</a>
          </div>
        </div>
      )}
    </div>
  )
}

function HeroVector(){
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="h-32 w-32">
      <defs>
        <linearGradient id="hero-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e0f2fe"/>
          <stop offset="100%" stopColor="#bae6fd"/>
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="90" fill="url(#hero-grad)" />
      <rect x="70" y="70" width="60" height="60" rx="10" fill="#0ea5e9" opacity="0.2" />
      <path d="M100 60 L100 140 M60 100 L140 100" stroke="#0284c7" strokeWidth="8" strokeLinecap="round"/>
    </svg>
  )
}

function WatermarkPractitioner(){
  return (
    <svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
      <defs>
        <linearGradient id="wm-sky-prac" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0ea5e9"/>
          <stop offset="100%" stopColor="#06b6d4"/>
        </linearGradient>
      </defs>
      <circle cx="200" cy="90" r="50" fill="url(#wm-sky-prac)" opacity="0.25"/>
      <rect x="140" y="150" width="120" height="160" rx="24" fill="url(#wm-sky-prac)" opacity="0.2"/>
      <rect x="95" y="190" width="210" height="60" rx="30" fill="url(#wm-sky-prac)" opacity="0.15"/>
      <path d="M165 190 C165 210, 185 215, 200 215 C215 215, 235 210, 235 190" stroke="#0ea5e9" strokeWidth="6" fill="none" opacity="0.3"/>
      <circle cx="160" cy="185" r="10" fill="#0ea5e9" opacity="0.25"/>
      <circle cx="240" cy="185" r="10" fill="#0ea5e9" opacity="0.25"/>
      <rect x="175" y="330" width="50" height="80" rx="6" fill="#06b6d4" opacity="0.15"/>
      <rect x="188" y="338" width="24" height="8" rx="2" fill="#0ea5e9" opacity="0.25"/>
      <ellipse cx="200" cy="470" rx="160" ry="18" fill="#0ea5e9" opacity="0.08"/>
    </svg>
  )
}
