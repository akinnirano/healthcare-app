import React, { useEffect, useState, useContext } from 'react'
import api from '../../api/axios'
import { AuthContext } from '../../context/AuthProvider'

export default function AssignmentsPage(){
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState({ account: true, service: true, ops: false })
  const toggle = (key) => { setOpenGroups(s => ({ account: false, service: false, ops: false, [key]: !s[key] || true })) }
  const [stats, setStats] = useState({ assignments: 0, requests: 0, staff: 0, patients: 0 })

  function handleLogout(){ try { localStorage.removeItem('access_token') } catch(_){} window.location.href = '/login' }

  useEffect(() => {
    async function loadCounts(){
      try {
        const [a, r, s, p] = await Promise.all([
          api.get('/assignments', { params: { limit: 1000 } }),
          api.get('/service_requests', { params: { limit: 1000 } }),
          api.get('/staff', { params: { limit: 1000 } }),
          api.get('/patients', { params: { limit: 1000 } }),
        ])
        setStats({
          assignments: Array.isArray(a.data) ? a.data.length : 0,
          requests: Array.isArray(r.data) ? r.data.length : 0,
          staff: Array.isArray(s.data) ? s.data.length : 0,
          patients: Array.isArray(p.data) ? p.data.length : 0,
        })
      } catch (_) { /* ignore */ }
    }
    loadCounts()
  }, [])

  return (
    <div className="relative min-h-screen bg-slate-50">
      {mobileOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-slate-900 text-slate-200 p-3 shadow-xl">
            <SideNav open={openGroups} onToggle={toggle} active={'assignments'} onSelect={()=>{}} onLogout={handleLogout} />
          </div>
        </div>
      )}

      <TopNav onSelect={()=>{}} onLogout={handleLogout} onToggleSidebar={()=>setMobileOpen(true)} />

      <div className="w-full px-4 sm:px-6 py-6 grid grid-cols-12 gap-6">
        <aside className="hidden md:block col-span-12 md:col-span-3 lg:col-span-2 xl:col-span-2">
          <SideNav open={openGroups} onToggle={toggle} active={'assignments'} onSelect={()=>{}} onLogout={handleLogout} />
        </aside>
        <main className="col-span-12 md:col-span-9 lg:col-span-10 xl:col-span-10 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <StatCard title="Assignments" value={String(stats.assignments)} badge="All" />
            <StatCard title="Service Requests" value={String(stats.requests)} badge="All" />
            <StatCard title="Staff" value={String(stats.staff)} badge="Active" />
            <StatCard title="Patients" value={String(stats.patients)} badge="Registered" />
          </div>
          <AssignmentBuilder />
          <AssignmentsReport />
        </main>
      </div>
    </div>
  )
}

function TopNav({ onSelect, onLogout, onToggleSidebar }){
  const { user } = useContext(AuthContext)
  const displayName = (user?.full_name || user?.email || 'User')
  return (
    <header className="w-full bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm border-b border-slate-100">
      <div className="w-full px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100" aria-label="Open menu" onClick={onToggleSidebar}>
            <MenuIcon />
          </button>
          <a href="/dashboard/admin" className="pl-1 md:pl-5 text-slate-800 font-extrabold tracking-tight">Healthcare Dashboard</a>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative rounded-full p-2 hover:bg-slate-100" aria-label="Notifications">
            <BellIcon />
            <span className="absolute -top-0.5 -right-0.5 inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
          </button>
          <div className="relative group">
            <button className="flex items-center gap-2 rounded-full bg-slate-100 px-2 py-1 hover:bg-slate-200">
              <span className="text-sm text-slate-700">{displayName}</span>
              <AvatarIcon />
            </button>
            <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition absolute right-0 mt-2 w-56 rounded-xl border border-slate-100 bg-white p-2 shadow-lg">
              <button onClick={() => onSelect('profile')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50">
                <UserIcon className="h-4 w-4" /> Profile update
              </button>
              <button onClick={() => onSelect('track')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50">
                <MapPinIcon className="h-4 w-4" /> Track health practitioner
              </button>
              <button onClick={onLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50">
                <LogoutIcon className="h-4 w-4" /> Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function SideNav({ open, onToggle, active, onSelect, onLogout }) {
  return (
    <nav className="rounded-2xl bg-slate-900 text-slate-200 p-3 shadow-sm h-[calc(100vh-5.5rem)] overflow-y-auto">
      <a href="/dashboard/admin" className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-slate-800`}>
        <HomeIcon /> Dashboard
      </a>


      {/* Account Management */}
      <SectionHeader title="Account Management" open={open.account} onToggle={() => onToggle("account")} />
      {open.account && (
        <div className="ml-3 grid gap-1">
          <a href="/dashboard/users" className={navSubItemCls(active === "staff") + " flex items-center"}><UsersIcon /> Manage Users</a>

          <a href="/dashboard/roles" className={navSubItemCls(active === "admin") + " flex items-center"}><BadgeIcon /> Manage Role</a>
          <a href="/dashboard/staff" className={navSubItemCls(active === "staff") + " flex items-center"}><UsersIcon /> Manage Staff</a>
          <a href="/dashboard/patient" className={navSubItemCls(active === "staff") + " flex items-center"}><UserHeartIcon /> Manage Patient</a>
          <button onClick={() => onSelect("map")} className={navSubItemCls(active === "map")}>View Map Locations<MapIcon /> </button>
        </div>
      )}

      {/* Service Request */}
      <SectionHeader title="Service Request" open={open.service} onToggle={() => onToggle("service")} />
      {open.service && (
        <div className="ml-3 grid gap-1">
          <a href="/dashboard/assignments" className={navSubItemCls(active === "admin") + " flex items-center"}><SwapIcon /> Manage Staff Assignments</a>
          <button onClick={() => onSelect("shift_reports")} className={navSubItemCls(active === "shift_reports")}><ClockIcon /> Manage Shift Reports</button>
          <a href="/dashboard/timesheets" className={navSubItemCls(active === "timesheets") + " flex items-center"}><DocumentIcon /> Manage Timesheet Report</a>
          <button onClick={() => onSelect("payroll")} className={navSubItemCls(active === "payroll")}><CashIcon /> Manage Payroll</button>
          <button onClick={() => onSelect("invoices")} className={navSubItemCls(active === "invoices")}><ReceiptIcon /> Manage Invoice</button>
          <a href="/dashboard/compliance" className={navSubItemCls(active === "compliance") + " flex items-center"}><CheckIcon /> Manage Compliance</a>
          <a href="/dashboard/feedback" className={navSubItemCls(active === "feedback") + " flex items-center"}><ChatIcon /> Management Feedback</a>
          <a href="/dashboard/visits" className={navSubItemCls(active === "visits") + " flex items-center"}><StethoscopeIcon /> Manage Visits Report</a>
        </div>
      )}

      {/* Operation */}
      <SectionHeader title="Operation" open={open.ops} onToggle={() => onToggle("ops")} />
      {open.ops && (
        <div className="ml-3 grid gap-1">
          <button onClick={() => onSelect("op_assign_staff")} className={navSubItemCls(active === "op_assign_staff")}><UserPlusIcon /> Assign Staff</button>
          <button onClick={() => onSelect("op_start_shift")} className={navSubItemCls(active === "op_start_shift")}><PlayIcon /> Start Shift</button>
          <button onClick={() => onSelect("op_end_shift")} className={navSubItemCls(active === "op_end_shift")}><StopIcon /> End Shift</button>
          <button onClick={() => onSelect("op_submit_timesheet")} className={navSubItemCls(active === "op_submit_timesheet")}><UploadIcon /> Submit Timesheet</button>
          <button onClick={() => onSelect("op_process_payroll")} className={navSubItemCls(active === "op_process_payroll")}><CashIcon /> Process Payroll</button>
          <button onClick={() => onSelect("op_verify_compliance")} className={navSubItemCls(active === "op_verify_compliance")}><CheckIcon /> Verify Compliance</button>
          <button onClick={() => onSelect("op_today_visits")} className={navSubItemCls(active === "op_today_visits")}><CalendarIcon /> Today Visits</button>
          <button onClick={() => onSelect("op_complete_visit")} className={navSubItemCls(active === "op_complete_visit")}><CheckIcon /> Complete Visit</button>
        </div>
      )}

      <div className="mt-4 border-top border-slate-700/40 pt-3">
        <button onClick={onLogout} className={navItemCls(false)}>
          <LogoutIcon /> Logout
        </button>
      </div>

    </nav>
  );
}

function AssignmentBuilder(){
  const [patients, setPatients] = useState([])
  const [staff, setStaff] = useState([])
  const [selectedPatientIds, setSelectedPatientIds] = useState([])
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [description, setDescription] = useState('Care visit')
  const [requiredSkill, setRequiredSkill] = useState('general')
  const [priority, setPriority] = useState('normal')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [errorLog, setErrorLog] = useState('')

  useEffect(() => {
    async function load(){
      try {
        const [pr, st] = await Promise.all([
          api.get('/patients', { params: { limit: 500 } }),
          api.get('/staff', { params: { limit: 500 } }),
        ])
        setPatients(Array.isArray(pr.data) ? pr.data : [])
        setStaff(Array.isArray(st.data) ? st.data : [])
      } catch (e){ /* ignore */ }
    }
    load()
  }, [])

  async function submit(e){
    e.preventDefault()
    setLoading(true); setMessage(''); setErrorLog('')
    try {
      if (!selectedPatientIds.length) throw new Error('Select at least one patient')
      const results = []
      for (const pid of selectedPatientIds){
        // 1) Create a minimal service request per patient
        const sr = await api.post('/service_requests', null, { params: { patient_id: pid, description, required_skill: requiredSkill } })
        const request_id = sr?.data?.id
        // 2) Assign staff to that request with optional priority/due_date
        const body = { request_id, staff_id: selectedStaffId ? parseInt(selectedStaffId, 10) : null, priority, due_date: dueDate || null }
        const asg = await api.post('/assignments', body)
        results.push({ request_id, assignment_id: asg?.data?.id })
      }
      setMessage(`Assigned for ${results.length} patient(s) successfully.`)
      setSelectedPatientIds([])
    } catch (err){
      const detail = err?.response?.data || { message: err?.message }
      setErrorLog(JSON.stringify(detail, null, 2))
    } finally { setLoading(false) }
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 md:p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Generate Staff Assignments</h2>
        <div className="text-xs text-slate-500">Use the form to assign one staff to multiple patients.</div>
      </div>
      {message && <div className="mt-3 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div>}
      {errorLog && <pre className="mt-3 overflow-auto rounded bg-rose-50 p-3 text-xs text-rose-700 ring-1 ring-rose-100">{errorLog}</pre>}

      <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="block text-sm text-slate-600">Select Patients (multi)</span>
          <select multiple value={selectedPatientIds.map(String)} onChange={(e)=>{
            const ids = Array.from(e.target.selectedOptions).map(o=>parseInt(o.value,10));
            setSelectedPatientIds(ids);
          }} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 h-48 focus:outline-none focus:ring-2 focus:ring-sky-500">
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.full_name || `Patient #${p.id}`}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-sm text-slate-600">Assign Staff</span>
          <select value={selectedStaffId} onChange={(e)=>setSelectedStaffId(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500">
            <option value="">Unassigned (create request only)</option>
            {staff.map(s => (
              <option key={s.id} value={s.id}>{s.full_name || s.name || `Staff #${s.id}`}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-sm text-slate-600">Priority</span>
          <select value={priority} onChange={(e)=>setPriority(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500">
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
        </label>
        <label className="block">
          <span className="block text-sm text-slate-600">Due date & time</span>
          <input type="datetime-local" value={dueDate} onChange={(e)=>setDueDate(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
        </label>
        <label className="block">
          <span className="block text-sm text-slate-600">Required skill</span>
          <input value={requiredSkill} onChange={(e)=>setRequiredSkill(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
        </label>
        <label className="block md:col-span-2">
          <span className="block text-sm text-slate-600">Description</span>
          <input value={description} onChange={(e)=>setDescription(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
        </label>
        <div className="md:col-span-2">
          <button disabled={loading} className="mt-2 rounded-lg bg-sky-600 px-5 py-2 text-white shadow hover:bg-sky-700 disabled:opacity-60">{loading? 'Assigning...' : 'Create Assignments'}</button>
        </div>
      </form>
    </div>
  )
}

function AssignmentsReport(){
  const [rows, setRows] = useState([])
  useEffect(() => {
    async function load(){
      try {
        const [reqRes, asgRes, stRes, ptRes] = await Promise.all([
          api.get('/service_requests', { params: { limit: 500 } }),
          api.get('/assignments', { params: { limit: 500 } }),
          api.get('/staff', { params: { limit: 500 } }),
          api.get('/patients', { params: { limit: 500 } }),
        ])
        const requests = Array.isArray(reqRes.data) ? reqRes.data : []
        const assignments = Array.isArray(asgRes.data) ? asgRes.data : []
        const staff = Array.isArray(stRes.data) ? stRes.data : []
        const patients = Array.isArray(ptRes.data) ? ptRes.data : []
        const staffById = Object.fromEntries(staff.map(s => [s.id, s]))
        const patientById = Object.fromEntries(patients.map(p => [p.id, p]))
        const requestById = Object.fromEntries(requests.map(r => [r.id, r]))
        const joined = assignments.map(a => {
          const req = requestById[a.service_request_id]
          const p = req ? patientById[req.patient_id] : null
          const s = staffById[a.staff_id]
          return {
            id: a.id,
            patient: p?.full_name || `Patient #${req?.patient_id || '-'}`,
            staff: s?.full_name || s?.name || (a.staff_id ? `Staff #${a.staff_id}` : 'Unassigned'),
            status: req?.status || 'assigned'
          }
        })
        setRows(joined.slice(0, 20))
      } catch (e){ setRows([]) }
    }
    load()
  }, [])

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Recent Assignments</h3>
        <button className="text-xs rounded border border-slate-200 px-3 py-1 hover:bg-slate-50" onClick={()=>window.location.reload()}>Refresh</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2 pr-3">ID</th>
              <th className="py-2 pr-3">Patient</th>
              <th className="py-2 pr-3">Staff</th>
              <th className="py-2 pr-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="py-2 pr-3">{r.id}</td>
                <td className="py-2 pr-3">{r.patient}</td>
                <td className="py-2 pr-3">{r.staff}</td>
                <td className="py-2 pr-3">{r.status}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className="py-3 text-slate-500" colSpan={4}>No assignments</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SectionHeader({ title, open, onToggle }){
  return (
    <button onClick={onToggle} className="mt-3 mb-1 flex w-full items-center justify-between rounded-lg bg-slate-800 px-3 py-2 text-left text-sm font-medium text-slate-200 hover:bg-slate-700">
      <span className="flex items-center gap-2"><FolderIcon /> {title}</span>
      <span className={`transition ${open ? 'rotate-180' : ''}`}><ChevronIcon /></span>
    </button>
  )
}
function navSubItemCls(active){
  return `flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm ${active ? 'bg-slate-800 text-white' : 'text-slate-200 hover:bg-slate-800'}`
}
function navItemCls(active){
  return `flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${active ? 'bg-slate-800 text-white' : 'text-slate-200 hover:bg-slate-800'}`
}

function MenuIcon(){ return (<svg className="h-5 w-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>) }
function BellIcon(){ return (<svg className="h-5 w-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>) }
function AvatarIcon(){ return (<svg className="h-6 w-6 text-slate-700" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z"/></svg>) }
function UserIcon({className="h-5 w-5"}){ return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-3-3.87M4 21v-2a4 4 0 013-3.87"/><path d="M12 12a4 4 0 100-8 4 4 0 000 8z"/></svg>) }
function MapPinIcon({className="h-5 w-5"}){ return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-6-4.35-6-10a6 6 0 1112 0c0 5.65-6 10-6 10z"/><circle cx="12" cy="11" r="2"/></svg>) }
function LogoutIcon({className="h-5 w-5"}){ return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 19V5a2 2 0 00-2-2h-7"/></svg>) }
function HomeIcon(){ return (<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9.5L12 3l9 6.5V21a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1V9.5z"/></svg>) }
function SwapIcon(){ return (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 7h14M10 4l-3 3 3 3"/><path d="M17 17H3M14 14l3 3-3 3"/></svg>) }
function UsersIcon(){ return (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>) }
function BadgeIcon(){ return (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M7 20h10l-5-5-5 5z"/></svg>) }
function UserHeartIcon(){ return (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 21v-2a4 4 0 014-4h4"/><path d="M12 11a4 4 0 100-8 4 4 0 000 8z"/><path d="M21.8 13.6a2.6 2.6 0 00-3.7 0l-.1.1-.1-.1a2.6 2.6 0 00-3.7 3.7l3.8 3.8 3.8-3.8a2.6 2.6 0 000-3.7z"/></svg>) }
function MapIcon(){ return (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3z"/><path d="M9 5v13M15 8v13"/></svg>) }
function ClockIcon(){ return (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>) }
function DocumentIcon(){ return (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>) }
function CashIcon(){ return (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg>) }
function ReceiptIcon(){ return (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 8V21l-3-2-3 2-3-2-3 2-3-2V3h12"/><path d="M16 3v5h5"/></svg>) }
function CheckIcon(){ return (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>) }
function ChatIcon(){ return (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a4 4 0 01-4 4H7l-4 4V7a4 4 0 014-4h10a4 4 0 014 4z"/></svg>) }
function StethoscopeIcon(){ return (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 3v6a6 6 0 0012 0V3"/><path d="M9 18a3 3 0 006 0v-3"/><circle cx="20" cy="10" r="2"/></svg>) }
function UserPlusIcon(){ return (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M23 11h-6"/></svg>) }
function PlayIcon(){ return (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3l14 9-14 9V3z"/></svg>) }
function StopIcon(){ return (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>) }
function UploadIcon(){ return (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V6"/><path d="M5 12l7-7 7 7"/><path d="M5 19h14"/></svg>) }
function CalendarIcon(){ return (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>) }
function FolderIcon(){ return (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>) }
function ChevronIcon(){ return (<svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>) }

/* Simple Stat Card */
function StatCard({ title, value, badge }){
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-500">{title}</div>
          <div className="mt-1 text-2xl font-semibold text-slate-800">{value}</div>
        </div>
        <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-1 rounded">{badge}</span>
      </div>
      <div className="mt-3 h-2 w-full rounded bg-slate-100">
        <div className="h-2 rounded bg-indigo-400" style={{ width: '45%' }} />
      </div>
    </div>
  )
}


