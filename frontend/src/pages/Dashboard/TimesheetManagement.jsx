import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { TopNav, SideNav } from "./AdminDashboard";

export default function TimesheetManagement(){
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState({ account: true, service: true, ops: false })
  const [monthDate, setMonthDate] = useState(() => { const d = new Date(); d.setDate(1); return d })
  const [assignmentsByDay, setAssignmentsByDay] = useState({})
  const [staffById, setStaffById] = useState({})
  const [errorLog, setErrorLog] = useState("")

  const toggle = (key) => { setOpenGroups(s => ({ account: false, service: false, ops: false, [key]: !s[key] || true })) }
  function handleLogout(){ try { localStorage.removeItem('access_token') } catch(_){} window.location.href = '/login' }

  const monthMeta = useMemo(() => {
    const y = monthDate.getFullYear();
    const m = monthDate.getMonth();
    const start = new Date(y, m, 1)
    const end = new Date(y, m + 1, 0)
    const daysInMonth = end.getDate()
    const startWeekday = start.getDay() // 0=Sun
    const title = start.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    return { y, m, start, end, daysInMonth, startWeekday, title }
  }, [monthDate])

  useEffect(() => {
    async function load(){
      setErrorLog("")
      try {
        const [stRes, monthRes] = await Promise.all([
          api.get('/staff', { params: { limit: 1000 } }),
          api.get('/timesheets/monthly', { params: { year: monthMeta.y, month: monthMeta.m + 1 } }),
        ])
        const staffArr = Array.isArray(stRes.data) ? stRes.data : []
        const staffMap = Object.fromEntries(staffArr.map(s => [s.id, s]))
        setStaffById(staffMap)

        const resp = monthRes?.data || {}
        const staffBlocks = Array.isArray(resp.staff) ? resp.staff : []
        const byDay = {}
        for (const block of staffBlocks){
          const days = Array.isArray(block.days) ? block.days : []
          for (const day of days){
            const key = day.date
            if (!byDay[key]) byDay[key] = []
            for (const a of (day.assignments || [])){
              byDay[key].push({
                id: a.id,
                staff_id: a.staff_id,
                staff_name: a.staff_name,
                assigned_at: a.assigned_at,
                due_date: a.due_date || a.assigned_at,
                confirmed: a.confirmed,
                patient: a.patient,
              })
            }
          }
        }
        setAssignmentsByDay(byDay)
      } catch (err){
        // Fallback for older backend routing or when /monthly is unavailable
        try {
          const [stRes, byDayRes, reqRes, ptRes] = await Promise.all([
            api.get('/staff', { params: { limit: 1000 } }),
            api.get('/timesheets/assignments_by_day', { params: { year: monthMeta.y, month: monthMeta.m + 1 } }),
            api.get('/service_requests', { params: { limit: 1000 } }),
            api.get('/patients', { params: { limit: 1000 } }),
          ])
          const staffArr = Array.isArray(stRes.data) ? stRes.data : []
          setStaffById(Object.fromEntries(staffArr.map(s => [s.id, s])))
          const requests = Array.isArray(reqRes.data) ? reqRes.data : []
          const patients = Array.isArray(ptRes.data) ? ptRes.data : []
          const requestById = Object.fromEntries(requests.map(r => [r.id, r]))
          const patientById = Object.fromEntries(patients.map(p => [p.id, p]))

          const resp = byDayRes?.data || { days: [] }
          const byDay = {}
          for (const d of (resp.days || [])){
            const key = d.date
            if (!byDay[key]) byDay[key] = []
            for (const a of (d.assignments || [])){
              const req = requestById[a.service_request_id]
              const pat = req ? patientById[req.patient_id] : undefined
              byDay[key].push({
                id: a.id,
                staff_id: a.staff_id,
                staff_name: undefined,
                assigned_at: a.assigned_at,
                due_date: a.assigned_at,
                confirmed: a.confirmed,
                patient: pat ? { id: pat.id, name: pat.full_name, address: pat.address, latitude: pat.latitude, longitude: pat.longitude } : undefined,
              })
            }
          }
          setAssignmentsByDay(byDay)
        } catch (fallbackErr){
          setErrorLog((fallbackErr?.response?.data && JSON.stringify(fallbackErr.response.data, null, 2)) || fallbackErr?.message || 'Failed to load')
        }
      }
    }
    load()
  }, [monthMeta.y, monthMeta.m])

  function prevMonth(){ const d = new Date(monthDate); d.setMonth(d.getMonth() - 1); setMonthDate(d) }
  function nextMonth(){ const d = new Date(monthDate); d.setMonth(d.getMonth() + 1); setMonthDate(d) }

  return (
    <div className="relative min-h-screen bg-slate-50">
      {mobileOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-slate-900 text-slate-200 p-3 shadow-xl">
            <SideNav open={openGroups} onToggle={toggle} active={'timesheets'} onSelect={()=>setMobileOpen(false)} onLogout={handleLogout} />
          </div>
        </div>
      )}

      <TopNav onSelect={()=>{}} onLogout={handleLogout} onToggleSidebar={() => setMobileOpen(true)} />

      <div className="w-full px-4 sm:px-6 py-6 grid grid-cols-12 gap-6">
        <aside className="hidden md:block col-span-12 md:col-span-3 lg:col-span-2 xl:col-span-2">
          <SideNav open={openGroups} onToggle={toggle} active={'timesheets'} onSelect={()=>{}} onLogout={handleLogout} />
        </aside>
        <main className="col-span-12 md:col-span-9 lg:col-span-10 xl:col-span-10 space-y-6">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <button onClick={prevMonth} className="rounded-lg border border-slate-200 px-3 py-1 text-sm hover:bg-slate-50">Prev</button>
              <h2 className="text-lg font-semibold text-slate-800">{monthMeta.title}</h2>
              <button onClick={nextMonth} className="rounded-lg border border-slate-200 px-3 py-1 text-sm hover:bg-slate-50">Next</button>
            </div>
            {errorLog && <pre className="mt-3 overflow-auto rounded bg-rose-50 p-3 text-xs text-rose-700 ring-1 ring-rose-100">{errorLog}</pre>}

            <Calendar monthMeta={monthMeta} assignmentsByDay={assignmentsByDay} staffById={staffById} />
          </div>
        </main>
      </div>
    </div>
  )
}

function Calendar({ monthMeta, assignmentsByDay, staffById }){
  const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const cells = []
  for (let i=0;i<monthMeta.startWeekday;i++) cells.push({ type: 'pad' })
  for (let d=1; d<=monthMeta.daysInMonth; d++){
    const date = new Date(monthMeta.y, monthMeta.m, d)
    const key = date.toISOString().slice(0,10)
    const items = assignmentsByDay[key] || []
    cells.push({ type: 'day', d, key, items })
  }
  const rows = []
  for (let i=0;i<cells.length;i+=7) rows.push(cells.slice(i,i+7))

  return (
    <div className="mt-4">
      <div className="grid grid-cols-7 text-xs font-medium text-slate-500">
        {weekdays.map(w => <div key={w} className="px-2 py-1">{w}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-px rounded-lg bg-slate-200">
        {rows.flat().map((c, idx) => (
          <div key={idx} className="min-h-[110px] bg-white p-2">
            {c.type === 'day' ? (
              <>
                <div className="mb-1 text-xs font-semibold text-slate-700">{c.d}</div>
                <div className="space-y-1">
                  {c.items.slice(0,4).map(it => {
                    const cls = statusCls(it?.due_date || it?.assigned_at)
                    return (
                      <div key={it.id} className={`rounded px-2 py-1 text-[11px] ${cls}`}>
                        Assigned Shift · <a className="underline" href={`/dashboard/track?map=1&staffId=${encodeURIComponent(it.staff_id || '')}`}>{it.staff_name || labelForStaff(staffById[it.staff_id])}</a>
                        <span className="ml-1 text-[10px] text-white/90">{patientLabel(it.patient)}</span>
                        <span className="ml-1 text-[10px] text-white/90">{it?.due_date ? `(${formatShort(it.due_date)})` : ''}</span>
                      </div>
                    )
                  })}
                  {c.items.length > 4 && (
                    <div className="text-[10px] text-slate-500">+{c.items.length - 4} more</div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-300">&nbsp;</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function labelForStaff(st){
  if (!st) return 'Unassigned'
  return st.full_name || st.name || `Staff #${st.id}`
}

function isDueSoon(due){
  if (!due) return false
  try {
    const now = new Date()
    const dd = new Date(due)
    if (isNaN(dd.getTime())) return false
    const ms = dd.getTime() - now.getTime()
    return ms > 0 && ms <= 48 * 60 * 60 * 1000 // within next 48 hours
  } catch (_) { return false }
}

function formatShort(dt){
  try {
    const d = new Date(dt)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch(_) { return '' }
}

function statusCls(dt){
  // Return bg/text classes based on date relative to today
  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const d = new Date(dt)
    if (isNaN(d.getTime())) return "bg-blue-600 text-white"
    if (d >= todayStart && d < todayEnd) return "bg-emerald-600 text-white" // due today
    if (d < todayStart) return "bg-black text-white" // past
    return "bg-blue-600 text-white" // future
  } catch(_) {
    return "bg-blue-600 text-white"
  }
}

function locationLabel(patient){
  if (!patient) return ''
  if (patient.address) return `@ ${patient.address}`
  if (patient.latitude != null && patient.longitude != null) return `@ (${Number(patient.latitude).toFixed(4)}, ${Number(patient.longitude).toFixed(4)})`
  if (patient.name) return `@ ${patient.name}`
  return ''
}

function patientLabel(patient){
  if (!patient) return ''
  const name = patient.name || `Patient${patient.id ? ` #${patient.id}` : ''}`
  const addr = patient.address ? ` - ${patient.address}` : ''
  return `${name}${addr}`
}


