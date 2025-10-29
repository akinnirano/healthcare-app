import React, { useEffect, useState } from 'react'
import api from '../../api/axios'
import bcrypt from 'bcryptjs'

export default function ManageUsers(){
  const [tab, setTab] = useState('patient')
  const [patientForm, setPatientForm] = useState({ full_name: '', email: '', phone: '', password: '', address: '', latitude: '', longitude: '' })
  const [staffForm, setStaffForm] = useState({ full_name: '', email: '', phone: '', password: '', address: '', license_number: '', skills: '', latitude: '', longitude: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [errorLog, setErrorLog] = useState('')
  const [users, setUsers] = useState([])

  useEffect(() => { refreshUsers() }, [])
  async function refreshUsers(){
    try { const res = await api.get('/users', { params: { limit: 50 } }); setUsers(Array.isArray(res.data) ? res.data : []) } catch (_) {}
  }

  function pOnChange(e){ setPatientForm(prev => ({ ...prev, [e.target.name]: e.target.value })) }
  function sOnChange(e){ setStaffForm(prev => ({ ...prev, [e.target.name]: e.target.value })) }

  // Auto-geocode Patient address
  useEffect(() => {
    if (!patientForm.address || patientForm.address.trim().length < 5) return
    const t = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(patientForm.address)}`
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          const top = data[0]
          setPatientForm(prev => ({ ...prev, latitude: top.lat, longitude: top.lon }))
        }
      } catch (_) { /* ignore */ }
    }, 700)
    return () => clearTimeout(t)
  }, [patientForm.address])

  // Auto-geocode Staff address
  useEffect(() => {
    if (!staffForm.address || staffForm.address.trim().length < 5) return
    const t = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(staffForm.address)}`
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          const top = data[0]
          setStaffForm(prev => ({ ...prev, latitude: top.lat, longitude: top.lon }))
        }
      } catch (_) { /* ignore */ }
    }, 700)
    return () => clearTimeout(t)
  }, [staffForm.address])

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

  async function submitPatient(e){
    e.preventDefault(); setLoading(true); setMessage(''); setErrorLog('')
    try {
      const roleId = await getRoleIdByName('Patient')
      const password_hash = bcrypt.hashSync(patientForm.password, 10)
      const userPayload = { full_name: patientForm.full_name, email: patientForm.email || null, password_hash, role_id: roleId, phone: patientForm.phone || null }
      await api.post('/users', null, { params: userPayload })
      const patientPayload = { full_name: patientForm.full_name, address: patientForm.address || null, latitude: patientForm.latitude || null, longitude: patientForm.longitude || null, phone: patientForm.phone || null, email: patientForm.email || null }
      await api.post('/patients', null, { params: patientPayload })
      setMessage('Patient created.')
      setPatientForm({ full_name: '', email: '', phone: '', password: '', address: '', latitude: '', longitude: '' }); refreshUsers()
    } catch (err) {
      const detail = err?.response?.data || { message: err?.message }; setErrorLog(JSON.stringify(detail, null, 2))
    } finally { setLoading(false) }
  }

  async function submitStaff(e){
    e.preventDefault(); setLoading(true); setMessage(''); setErrorLog('')
    try {
      const roleId = await getRoleIdByName('Practitioner')
      const password_hash = bcrypt.hashSync(staffForm.password, 10)
      const userPayload = { full_name: staffForm.full_name, email: staffForm.email || null, password_hash, role_id: roleId, phone: staffForm.phone || null }
      const u = await api.post('/users', null, { params: userPayload })
      const staffPayload = { user_id: u?.data?.id, license_number: staffForm.license_number || null, skills: staffForm.skills ? staffForm.skills.split(',').map(s => s.trim()) : [], latitude: staffForm.latitude || null, longitude: staffForm.longitude || null }
      await api.post('/staff', null, { params: staffPayload })
      setMessage('Staff created.')
      setStaffForm({ full_name: '', email: '', phone: '', password: '', license_number: '', skills: '', latitude: '', longitude: '' }); refreshUsers()
    } catch (err) {
      const detail = err?.response?.data || { message: err?.message }; setErrorLog(JSON.stringify(detail, null, 2))
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-100 bg-white p-4 md:p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Manage Users</h2>
          <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
            <button className={`px-3 py-1 text-sm ${tab==='patient'?'bg-slate-100 font-medium':'hover:bg-slate-50'}`} onClick={()=>setTab('patient')}>Add Patient</button>
            <button className={`px-3 py-1 text-sm ${tab==='staff'?'bg-slate-100 font-medium':'hover:bg-slate-50'}`} onClick={()=>setTab('staff')}>Add Staff</button>
          </div>
        </div>

        {message && <div className="mt-3 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div>}
        {errorLog && <pre className="mt-3 overflow-auto rounded bg-rose-50 p-3 text-xs text-rose-700 ring-1 ring-rose-100">{errorLog}</pre>}

        {tab === 'patient' && (
          <form onSubmit={submitPatient} className="mt-4 grid gap-3 md:grid-cols-2">
            <Input label="Full name" name="full_name" value={patientForm.full_name} onChange={pOnChange} required />
            <Input label="Email" name="email" value={patientForm.email} onChange={pOnChange} type="email" />
            <Input label="Phone" name="phone" value={patientForm.phone} onChange={pOnChange} />
            <Input label="Password" name="password" value={patientForm.password} onChange={pOnChange} type="password" required />
            <Input label="Address" name="address" value={patientForm.address} onChange={pOnChange} className="md:col-span-2" />
            <Input label="Latitude" name="latitude" value={patientForm.latitude} onChange={pOnChange} />
            <Input label="Longitude" name="longitude" value={patientForm.longitude} onChange={pOnChange} />
            <div className="md:col-span-2">
              <button disabled={loading} className="mt-2 rounded-lg bg-sky-600 px-5 py-2 text-white shadow hover:bg-sky-700 disabled:opacity-60">{loading ? 'Submitting...' : 'Create Patient'}</button>
            </div>
          </form>
        )}

        {tab === 'staff' && (
          <form onSubmit={submitStaff} className="mt-4 grid gap-3 md:grid-cols-2">
            <Input label="Full name" name="full_name" value={staffForm.full_name} onChange={sOnChange} required />
            <Input label="Email" name="email" value={staffForm.email} onChange={sOnChange} type="email" />
            <Input label="Phone" name="phone" value={staffForm.phone} onChange={sOnChange} />
            <Input label="Password" name="password" value={staffForm.password} onChange={sOnChange} type="password" required />
            <Input label="Address" name="address" value={staffForm.address} onChange={sOnChange} className="md:col-span-2" />
            <Input label="License Number" name="license_number" value={staffForm.license_number} onChange={sOnChange} />
            <Input label="Skills (comma-separated)" name="skills" value={staffForm.skills} onChange={sOnChange} />
            <Input label="Latitude" name="latitude" value={staffForm.latitude} onChange={sOnChange} />
            <Input label="Longitude" name="longitude" value={staffForm.longitude} onChange={sOnChange} />
            <div className="md:col-span-2">
              <button disabled={loading} className="mt-2 rounded-lg bg-sky-600 px-5 py-2 text-white shadow hover:bg-sky-700 disabled:opacity-60">{loading ? 'Submitting...' : 'Create Staff'}</button>
            </div>
          </form>
        )}
      </div>

      {/* Simple users table */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 md:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-slate-800">Recent Users</h3>
          <button onClick={refreshUsers} className="text-xs rounded border border-slate-200 px-2 py-1 hover:bg-slate-50">Refresh</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="py-2 pr-3">{u.full_name}</td>
                  <td className="py-2 pr-3">{u.email || '-'}</td>
                  <td className="py-2 pr-3">{u.role_id ?? '-'}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td className="py-3 text-slate-500" colSpan={3}>No users</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Input({ label, className = '', ...props }){
  return (
    <label className={`block ${className}`}>
      <span className="block text-sm text-slate-600">{label}</span>
      <input {...props} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
    </label>
  )
}


