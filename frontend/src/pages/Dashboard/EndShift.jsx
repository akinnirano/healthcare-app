import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { TopNav, SideNav, StatCard } from "./AdminDashboard";

export default function EndShift(){
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState({ account: true, service: true, ops: false })
  const [errorLog, setErrorLog] = useState("")
  const [form, setForm] = useState(() => {
    try {
      const q = new URLSearchParams(window.location.search)
      return {
        shiftId: q.get('shiftId') || "",
        lat: q.get('lat') || "",
        lon: q.get('lon') || "",
      }
    } catch(_) { return { shiftId: "", lat: "", lon: "" } }
  })
  const [ended, setEnded] = useState([])

  const toggle = (key) => { setOpenGroups(s => ({ account: false, service: false, ops: false, [key]: !s[key] || true })) }
  function handleLogout(){ try { localStorage.removeItem('access_token') } catch(_){} window.location.href = '/login' }

  // Try to capture device location to prefill lat/lon
  useEffect(() => {
    if (!navigator.geolocation) return
    const id = navigator.geolocation.watchPosition(
      (pos) => { setForm(f => ({ ...f, lat: String(pos.coords.latitude.toFixed(6)), lon: String(pos.coords.longitude.toFixed(6)) })) },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    )
    return () => { try { navigator.geolocation.clearWatch(id) } catch(_){} }
  }, [])

  const stats = useMemo(() => {
    const total = ended.length
    const uniqStaff = new Set(ended.map(s => s.staff_id)).size
    return { total, uniqStaff }
  }, [ended])

  async function endShift(){
    setErrorLog("")
    const shiftId = Number(form.shiftId || 0)
    if (!shiftId) { setErrorLog('Enter a shift ID'); return }
    const end_lat = form.lat ? Number(form.lat) : undefined
    const end_lng = form.lon ? Number(form.lon) : undefined
    try {
      const res = await api.put(`/shifts/${shiftId}/end`, {}, { params: { end_lat, end_lng } })
      const payload = res.data || {}
      setEnded(s => [{ id: payload.id || shiftId, staff_id: payload.staff_id || null, status: payload.status || 'ENDED', ended_at: new Date().toISOString() }, ...s])
    } catch (err){
      setErrorLog((err?.response?.data && JSON.stringify(err.response.data, null, 2)) || err?.message || 'Failed to end shift')
    }
  }

  async function deleteRow(id){
    // No backend delete endpoint; remove locally
    setEnded(s => s.filter(x => x.id !== id))
  }

  return (
    <div className="relative min-h-screen bg-slate-50">
      {mobileOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-slate-900 text-slate-200 p-3 shadow-xl">
            <SideNav open={openGroups} onToggle={toggle} active={'endshift'} onSelect={()=>setMobileOpen(false)} onLogout={() => { try { localStorage.removeItem('access_token') } catch(_){} window.location.href = '/login' }} />
          </div>
        </div>
      )}

      <TopNav onSelect={()=>{}} onLogout={handleLogout} onToggleSidebar={() => setMobileOpen(true)} />

      <div className="w-full px-4 sm:px-6 py-6 grid grid-cols-12 gap-6">
        <aside className="hidden md:block col-span-12 md:col-span-3 lg:col-span-2 xl:col-span-2">
          <SideNav open={openGroups} onToggle={toggle} active={'endshift'} onSelect={()=>{}} onLogout={handleLogout} />
        </aside>
        <main className="col-span-12 md:col-span-9 lg:col-span-10 xl:col-span-10 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Ended Shifts (session)" value={stats.total} badge="Shifts" />
            <StatCard title="Unique Staff" value={stats.uniqStaff} badge="People" />
            <StatCard title="Ready to Close" value={stats.total} badge="Now" />
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-slate-800">End Shift</h2>
            </div>
            {errorLog && <pre className="mb-3 overflow-auto rounded bg-rose-50 p-3 text-xs text-rose-700 ring-1 ring-rose-100">{errorLog}</pre>}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              <div>
                <label className="text-xs text-slate-500">Shift ID</label>
                <input value={form.shiftId} onChange={(e) => setForm(f => ({ ...f, shiftId: e.target.value }))} placeholder="e.g. 123" className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
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
                <button onClick={endShift} className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">End</button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="py-2 pr-3">Shift ID</th>
                    <th className="py-2 pr-3">Staff</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Ended At</th>
                    <th className="py-2 pr-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {ended.map(r => (
                    <tr key={r.id} className="border-t border-slate-100">
                      <td className="py-2 pr-3 text-slate-700">{r.id}</td>
                      <td className="py-2 pr-3 text-slate-700">{r.staff_id != null ? `#${r.staff_id}` : ''}</td>
                      <td className="py-2 pr-3 text-slate-700">{r.status}</td>
                      <td className="py-2 pr-3 text-slate-600">{r.ended_at ? new Date(r.ended_at).toLocaleString() : ''}</td>
                      <td className="py-2 pr-3">
                        <button onClick={() => deleteRow(r.id)} className="inline-flex items-center rounded-md bg-rose-600 px-3 py-1 text-xs font-medium text-white hover:bg-rose-700">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {ended.length === 0 && (
                    <tr><td className="py-3 text-slate-500" colSpan={5}>No ended shifts in this session</td></tr>
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


