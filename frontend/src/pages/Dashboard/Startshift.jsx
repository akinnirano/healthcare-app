import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { TopNav, SideNav, StatCard } from "./AdminDashboard";

export default function Startshift(){
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState({ account: true, service: true, ops: false })
  const [errorLog, setErrorLog] = useState("")
  const [staff, setStaff] = useState([])
  const [shifts, setShifts] = useState([])
  const [form, setForm] = useState(() => {
    try {
      const q = new URLSearchParams(window.location.search)
      return {
        staffId: q.get('staffId') || "",
        purpose: q.get('purpose') ? decodeURIComponent(q.get('purpose')) : "",
        lat: q.get('lat') || "",
        lon: q.get('lon') || "",
      }
    } catch(_) {
      return { staffId: "", purpose: "", lat: "", lon: "" }
    }
  })
  const [loading, setLoading] = useState(true)

  const toggle = (key) => { setOpenGroups(s => ({ account: false, service: false, ops: false, [key]: !s[key] || true })) }
  function handleLogout(){ try { localStorage.removeItem('access_token') } catch(_){} window.location.href = '/login' }

  useEffect(() => {
    let mounted = true
    async function load(){
      setLoading(true)
      setErrorLog("")
      try {
        const stRes = await api.get('/staff', { params: { limit: 1000 } })
        if (!mounted) return
        setStaff(Array.isArray(stRes.data) ? stRes.data : [])
      } catch (err){
        setErrorLog((err?.response?.data && JSON.stringify(err.response.data, null, 2)) || err?.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  // Try to capture device location to prefill lat/lon
  useEffect(() => {
    if (!navigator.geolocation) return
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setForm(f => ({ ...f, lat: String(pos.coords.latitude.toFixed(6)), lon: String(pos.coords.longitude.toFixed(6)) }))
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    )
    return () => { try { navigator.geolocation.clearWatch(id) } catch(_){} }
  }, [])

  const stats = useMemo(() => {
    const total = shifts.length
    const active = shifts.filter(s => s.status === 'active' || s.status === 'STARTED').length
    const uniqStaff = new Set(shifts.map(s => s.staff_id)).size
    return { total, active, uniqStaff }
  }, [shifts])

  async function startShift(){
    setErrorLog("")
    const staffId = Number(form.staffId || 0)
    if (!staffId) { setErrorLog('Select a staff to start shift'); return }
    const start_lat = form.lat ? Number(form.lat) : undefined
    const start_lng = form.lon ? Number(form.lon) : undefined
    try {
      const res = await api.post('/shifts/', undefined, { params: { staff_id: staffId, start_lat, start_lng, purpose: form.purpose || undefined } })
      const payload = res.data || {}
      setShifts(s => [{ id: payload.id || Date.now(), staff_id: staffId, status: payload.status || 'STARTED', purpose: payload.purpose || form.purpose || '', started_at: new Date().toISOString() }, ...s])
    } catch (err){
      // Richer diagnostics
      const detail = (err?.response?.data && JSON.stringify(err.response.data)) || err?.message || String(err)
      setErrorLog(`Start failed: ${detail}`)
    }
  }

  async function deleteShift(id){
    setErrorLog("")
    try {
      await api.delete(`/shifts/${id}`)
      setShifts(s => s.filter(x => x.id !== id))
    } catch (err){
      // Fallback: remove locally if backend doesn't support deletion
      setShifts(s => s.filter(x => x.id !== id))
      setErrorLog((err?.response?.data && JSON.stringify(err.response.data, null, 2)) || 'Deleted locally (no backend endpoint)')
    }
  }

  return (
    <div className="relative min-h-screen bg-slate-50">
      {mobileOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-slate-900 text-slate-200 p-3 shadow-xl">
            <SideNav open={openGroups} onToggle={toggle} active={'startshift'} onSelect={()=>setMobileOpen(false)} onLogout={() => { try { localStorage.removeItem('access_token') } catch(_){} window.location.href = '/login' }} />
          </div>
        </div>
      )}

      <TopNav onSelect={()=>{}} onLogout={handleLogout} onToggleSidebar={() => setMobileOpen(true)} />

      <div className="w-full px-4 sm:px-6 py-6 grid grid-cols-12 gap-6">
        <aside className="hidden md:block col-span-12 md:col-span-3 lg:col-span-2 xl:col-span-2">
          <SideNav open={openGroups} onToggle={toggle} active={'startshift'} onSelect={()=>{}} onLogout={handleLogout} />
        </aside>
        <main className="col-span-12 md:col-span-9 lg:col-span-10 xl:col-span-10 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Total Shifts (session)" value={stats.total} badge="Shifts" />
            <StatCard title="Active" value={stats.active} badge="Live" />
            <StatCard title="Unique Staff" value={stats.uniqStaff} badge="People" />
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-slate-800">Start Shift</h2>
              {loading && <span className="text-xs text-slate-500">Loading…</span>}
            </div>
            {errorLog && <pre className="mb-3 overflow-auto rounded bg-rose-50 p-3 text-xs text-rose-700 ring-1 ring-rose-100">{errorLog}</pre>}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
              <div>
                <label className="text-xs text-slate-500">Staff</label>
                <select value={form.staffId} onChange={(e) => setForm(f => ({ ...f, staffId: e.target.value }))} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm">
                  <option value="">Select staff…</option>
                  {(staff || []).map(s => (
                    <option key={s.id} value={s.id}>{`#${s.id} ${s.full_name || s.name || ''}`.trim()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500">Purpose</label>
                <input value={form.purpose} onChange={(e) => setForm(f => ({ ...f, purpose: e.target.value }))} placeholder="e.g. Night shift" className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500">Latitude</label>
                <input value={form.lat} onChange={(e) => setForm(f => ({ ...f, lat: e.target.value }))} placeholder="e.g. 43.6532" className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500">Longitude</label>
                <input value={form.lon} onChange={(e) => setForm(f => ({ ...f, lon: e.target.value }))} placeholder="e.g. -79.3832" className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div className="flex items-end">
                <button onClick={startShift} className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">Start</button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="py-2 pr-3">ID</th>
                    <th className="py-2 pr-3">Staff</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Purpose</th>
                    <th className="py-2 pr-3">Started At</th>
                    <th className="py-2 pr-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {shifts.map(r => (
                    <tr key={r.id} className="border-t border-slate-100">
                      <td className="py-2 pr-3 text-slate-700">{r.id}</td>
                      <td className="py-2 pr-3 text-slate-700">#{r.staff_id}</td>
                      <td className="py-2 pr-3 text-slate-700">{r.status}</td>
                      <td className="py-2 pr-3 text-slate-600">{r.purpose || ''}</td>
                      <td className="py-2 pr-3 text-slate-600">{r.started_at ? new Date(r.started_at).toLocaleString() : ''}</td>
                      <td className="py-2 pr-3">
                        <button onClick={() => deleteShift(r.id)} className="inline-flex items-center rounded-md bg-rose-600 px-3 py-1 text-xs font-medium text-white hover:bg-rose-700">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {shifts.length === 0 && (
                    <tr><td className="py-3 text-slate-500" colSpan={5}>No shifts started in this session</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}


