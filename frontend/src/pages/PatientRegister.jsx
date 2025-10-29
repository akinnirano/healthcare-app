import React, { useEffect, useMemo, useState } from 'react'
import api from '../api/axios'
import FooterBlue from '../components/FooterBlue'
import bcrypt from 'bcryptjs'

export default function PatientRegister(){
  const [form, setForm] = useState({ full_name: '', username: '', password: '', address: '', latitude: '', longitude: '', phone: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [errorLog, setErrorLog] = useState('')
  const [geocodeLoading, setGeocodeLoading] = useState(false)

  const latNum = useMemo(() => form.latitude ? parseFloat(form.latitude) : null, [form.latitude])
  const lngNum = useMemo(() => form.longitude ? parseFloat(form.longitude) : null, [form.longitude])

  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  async function getRoleIdByName(name){
    try {
      const res = await api.get('/roles', { params: { limit: 1000 } })
      const roles = Array.isArray(res.data) ? res.data : []
      const match = roles.find(r => (r.name || '').toLowerCase() === String(name).toLowerCase())
      return match?.id || null
    } catch (_) {
      return null
    }
  }

  // Auto-geocode when address changes with debounce
  useEffect(() => {
    if (!form.address || form.address.trim().length < 5) return
    const t = setTimeout(async () => {
      try {
        setGeocodeLoading(true)
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(form.address)}`
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          const top = data[0]
          setForm(prev => ({ ...prev, latitude: top.lat, longitude: top.lon }))
        }
      } catch (e) {
        // ignore
      } finally {
        setGeocodeLoading(false)
      }
    }, 700)
    return () => clearTimeout(t)
  }, [form.address])

  const onSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setErrorLog('')
    let createdUserId = null
    try {
      // Look up role id for 'Patient'
      const patientRoleId = await getRoleIdByName('Patient')

      // Step 1: create user (patient account)
      const password_hash = bcrypt.hashSync(form.password || 'patient123', 10)
      const resolvedEmail = form.email || form.username || null
      const userPayload = {
        full_name: form.full_name,
        email: resolvedEmail,
        password_hash,
        role_id: patientRoleId,
        phone: form.phone || null,
      }
      const userResp = await api.post('/users', null, { params: userPayload })
      createdUserId = userResp?.data?.id

      // Step 2: create patient profile (address/coords)
      const patientPayload = {
        full_name: form.full_name,
        address: form.address || null,
        latitude: latNum,
        longitude: lngNum,
        phone: form.phone || null,
        email: resolvedEmail,
      }
      await api.post('/patients', null, { params: patientPayload })

      setMessage('Information has been registered.')
      setForm({ full_name: '', username: '', password: '', address: '', latitude: '', longitude: '', phone: '', email: '' })
    } catch (err) {
      console.error(err)
      // If user was created but patient failed, surface clear context
      if (createdUserId) {
        const detail = err?.response?.data || { message: err?.message }
        setErrorLog(JSON.stringify(detail, null, 2))
        setMessage(`User ${createdUserId} created, but patient creation failed`)
      } else {
        const detail = err?.response?.data || { message: err?.message }
        setErrorLog(JSON.stringify(detail, null, 2))
        setMessage(err?.response?.data?.detail || 'Registration failed')
      }
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
            <h1 className="text-2xl font-bold text-gray-900">Register Patient</h1>
            <p className="mt-1 text-sm text-gray-600">Create a patient profile with location for optimized care and routing.</p>
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
        <div>
          <label className="block text-sm font-medium text-gray-700">Full name</label>
          <input name="full_name" value={form.full_name} onChange={onChange} required className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input name="username" value={form.username} onChange={onChange} placeholder="username or email" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input name="password" type="password" value={form.password} onChange={onChange} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Address</label>
          <input name="address" value={form.address} onChange={onChange} placeholder="123 Main St, City, Country" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
          {geocodeLoading && <div className="mt-1 text-xs text-gray-500">Geocoding address…</div>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Latitude</label>
            <input name="latitude" value={form.latitude} onChange={onChange} type="number" step="any" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Longitude</label>
            <input name="longitude" value={form.longitude} onChange={onChange} type="number" step="any" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input name="phone" value={form.phone} onChange={onChange} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input name="email" value={form.email} onChange={onChange} type="email" placeholder="optional if username used" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
        </div>
        <button disabled={loading} className="mt-2 rounded-lg bg-sky-600 px-5 py-2 text-white shadow hover:bg-sky-700 disabled:opacity-60">
          {loading ? 'Submitting...' : 'Create Patient (User + Profile)'}
        </button>
        {errorLog && (
          <pre className="mt-2 overflow-auto rounded bg-rose-50 p-3 text-xs text-rose-700 ring-1 ring-rose-100">{errorLog}</pre>
        )}
      </form>

      {/* Map */}
      {latNum && lngNum && (
        <div className="mt-6 rounded-2xl ring-1 ring-gray-100 overflow-hidden shadow-sm">
          <iframe
            title="patient-map"
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

      <FooterBlue />
    </div>
  )
}

function WatermarkPractitioner(){
  return (
    <svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
      <defs>
        <linearGradient id="wm-sky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0ea5e9"/>
          <stop offset="100%" stopColor="#06b6d4"/>
        </linearGradient>
      </defs>
      <circle cx="200" cy="90" r="50" fill="url(#wm-sky)" opacity="0.25"/>
      <rect x="140" y="150" width="120" height="160" rx="24" fill="url(#wm-sky)" opacity="0.2"/>
      <rect x="95" y="190" width="210" height="60" rx="30" fill="url(#wm-sky)" opacity="0.15"/>
      <path d="M165 190 C165 210, 185 215, 200 215 C215 215, 235 210, 235 190" stroke="#0ea5e9" strokeWidth="6" fill="none" opacity="0.3"/>
      <circle cx="160" cy="185" r="10" fill="#0ea5e9" opacity="0.25"/>
      <circle cx="240" cy="185" r="10" fill="#0ea5e9" opacity="0.25"/>
      <rect x="175" y="330" width="50" height="80" rx="6" fill="#06b6d4" opacity="0.15"/>
      <rect x="188" y="338" width="24" height="8" rx="2" fill="#0ea5e9" opacity="0.25"/>
      <ellipse cx="200" cy="470" rx="160" ry="18" fill="#0ea5e9" opacity="0.08"/>
    </svg>
  )
}

function HeroVector(){
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="h-32 w-32">
      <defs>
        <linearGradient id="hero-grad-patient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e0f2fe"/>
          <stop offset="100%" stopColor="#bae6fd"/>
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="90" fill="url(#hero-grad-patient)" />
      <rect x="70" y="70" width="60" height="60" rx="10" fill="#0ea5e9" opacity="0.2" />
      <path d="M100 60 L100 140 M60 100 L140 100" stroke="#0284c7" strokeWidth="8" strokeLinecap="round"/>
    </svg>
  )
}
