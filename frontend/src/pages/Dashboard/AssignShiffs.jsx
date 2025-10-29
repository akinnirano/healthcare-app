import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { TopNav, SideNav, StatCard } from "./AdminDashboard";

export default function AssignShiffs(){
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState({ account: true, service: true, ops: false })
  const [errorLog, setErrorLog] = useState("")
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const toggle = (key) => { setOpenGroups(s => ({ account: false, service: false, ops: false, [key]: !s[key] || true })) }
  function handleLogout(){ try { localStorage.removeItem('access_token') } catch(_){} window.location.href = '/login' }

  useEffect(() => {
    let mounted = true
    async function load(){
      setLoading(true)
      setErrorLog("")
      try {
        const [asgRes, srRes, stRes, patRes, usrRes] = await Promise.all([
          api.get('/assignments', { params: { limit: 1000 } }),
          api.get('/service_requests', { params: { limit: 1000 } }),
          api.get('/staff', { params: { limit: 1000 } }),
          api.get('/patients', { params: { limit: 1000 } }),
          api.get('/users', { params: { limit: 1000 } }),
        ])
        if (!mounted) return
        const assignments = Array.isArray(asgRes.data) ? asgRes.data : []
        const serviceRequests = Array.isArray(srRes.data) ? srRes.data : []
        const staff = Array.isArray(stRes.data) ? stRes.data : []
        const patients = Array.isArray(patRes.data) ? patRes.data : []
        const users = Array.isArray(usrRes.data) ? usrRes.data : []

        const srById = Object.fromEntries(serviceRequests.map(r => [r.id, r]))
        const staffById = Object.fromEntries(staff.map(s => [s.id, s]))
        const userById = Object.fromEntries(users.map(u => [u.id, u]))
        const patientById = Object.fromEntries(patients.map(p => [p.id, p]))

        const rich = assignments.map(a => {
          const sr = srById[a.service_request_id]
          const st = staffById[a.staff_id]
          const stUser = st ? userById[st.user_id] : undefined
          const patient = sr ? patientById[sr.patient_id] : undefined
          return {
            id: a.id,
            staffId: a.staff_id,
            staffName: (stUser && (stUser.full_name || stUser.email)) ? (stUser.full_name || stUser.email) : (st ? `Staff #${st.id}` : 'Unassigned'),
            serviceRequestId: a.service_request_id,
            patientId: patient ? patient.id : (sr ? sr.patient_id : null),
            patientName: patient ? (patient.full_name || `Patient #${patient.id}`) : (sr ? `Patient #${sr.patient_id}` : 'N/A'),
            dueDate: a.due_date || null,
            confirmed: typeof a.confirmed === 'boolean' ? a.confirmed : null,
          }
        })
        setRows(rich)
      } catch (err){
        setErrorLog((err?.response?.data && JSON.stringify(err.response.data, null, 2)) || err?.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const stats = useMemo(() => {
    const total = rows.length
    const uniqStaff = new Set(rows.filter(r => r.staffId != null).map(r => r.staffId)).size
    const uniqPatients = new Set(rows.filter(r => r.patientId != null).map(r => r.patientId)).size
    return { total, uniqStaff, uniqPatients }
  }, [rows])

  async function handleDelete(id){
    try {
      await api.delete(`/assignments/${id}`)
      setRows(rs => rs.filter(r => r.id !== id))
    } catch (err){
      setErrorLog((err?.response?.data && JSON.stringify(err.response.data, null, 2)) || err?.message || 'Delete failed')
    }
  }

  return (
    <div className="relative min-h-screen bg-slate-50">
      {mobileOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-slate-900 text-slate-200 p-3 shadow-xl">
            <SideNav open={openGroups} onToggle={toggle} active={'assignshiffs'} onSelect={()=>setMobileOpen(false)} onLogout={() => { try { localStorage.removeItem('access_token') } catch(_){} window.location.href = '/login' }} />
          </div>
        </div>
      )}

      <TopNav onSelect={()=>{}} onLogout={handleLogout} onToggleSidebar={() => setMobileOpen(true)} />

      <div className="w-full px-4 sm:px-6 py-6 grid grid-cols-12 gap-6">
        <aside className="hidden md:block col-span-12 md:col-span-3 lg:col-span-2 xl:col-span-2">
          <SideNav open={openGroups} onToggle={toggle} active={'assignshiffs'} onSelect={()=>{}} onLogout={handleLogout} />
        </aside>
        <main className="col-span-12 md:col-span-9 lg:col-span-10 xl:col-span-10 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Total Assignments" value={stats.total} badge="All" />
            <StatCard title="Unique Staff" value={stats.uniqStaff} badge="People" />
            <StatCard title="Unique Patients" value={stats.uniqPatients} badge="People" />
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-slate-800">Assigned Shiffs</h2>
              {loading && <span className="text-xs text-slate-500">Loading…</span>}
            </div>
            {errorLog && <pre className="mb-3 overflow-auto rounded bg-rose-50 p-3 text-xs text-rose-700 ring-1 ring-rose-100">{errorLog}</pre>}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="py-2 pr-3">ID</th>
                    <th className="py-2 pr-3">Staff</th>
                    <th className="py-2 pr-3">Patient</th>
                    <th className="py-2 pr-3">Service Request</th>
                    <th className="py-2 pr-3">Due Date</th>
                    <th className="py-2 pr-3">Confirmed</th>
                    <th className="py-2 pr-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id} className="border-t border-slate-100">
                      <td className="py-2 pr-3 text-slate-700">{r.id}</td>
                      <td className="py-2 pr-3 text-slate-700">{r.staffName}</td>
                      <td className="py-2 pr-3 text-slate-700">{r.patientName}</td>
                      <td className="py-2 pr-3 text-slate-600">#{r.serviceRequestId}</td>
                      <td className="py-2 pr-3 text-slate-600">{r.dueDate ? new Date(r.dueDate).toLocaleString() : ''}</td>
                      <td className="py-2 pr-3">{r.confirmed == null ? '' : (r.confirmed ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">Yes</span> : <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700">No</span>)}</td>
                      <td className="py-2 pr-3">
                        <button onClick={() => handleDelete(r.id)} className="inline-flex items-center rounded-md bg-rose-600 px-3 py-1 text-xs font-medium text-white hover:bg-rose-700">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && !loading && (
                    <tr><td className="py-3 text-slate-500" colSpan={7}>No assignments found</td></tr>
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


