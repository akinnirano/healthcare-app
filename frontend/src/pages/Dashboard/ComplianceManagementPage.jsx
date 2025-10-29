import React, { useEffect, useState, useContext } from "react";
import api from "../../api/axios";
import { AuthContext } from "../../context/AuthProvider";

export default function ComplianceManagementPage() {
  const [openGroups, setOpenGroups] = useState({ account: false, service: true, ops: false });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [staff, setStaff] = useState([])
  const [message, setMessage] = useState("")
  const [errorLog, setErrorLog] = useState("")
  const [form, setForm] = useState({ staff_id: "", document_type: "", document_number: "", expiry_date: "" })

  const toggle = (key) => {
    // open only the selected group, collapse the others
    setOpenGroups((s) => ({ account: false, service: false, ops: false, [key]: !s[key] || true }));
  };

  const handleLogout = () => {
    try { localStorage.removeItem('access_token'); } catch (_) {}
    window.location.href = '/login';
  };

  useEffect(() => {
    async function load(){
      try {
        const s = await api.get('/staff', { params: { limit: 1000 } })
        setStaff(Array.isArray(s.data) ? s.data : [])
      } catch (_) { setStaff([]) }
    }
    load()
  }, [])

  return (
    <div className="relative min-h-screen bg-slate-50">
      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-slate-900 text-slate-200 p-3 shadow-xl">
            <SideNav
              open={openGroups}
              onToggle={toggle}
              active={'visits'}
              onSelect={() => { setMobileOpen(false); }}
              onLogout={handleLogout}
            />
          </div>
        </div>
      )}

      <div className="relative z-10 min-h-screen">
        <TopNav onLogout={handleLogout} onToggleSidebar={() => setMobileOpen(true)} />
        <div className="w-full px-4 sm:px-6 py-6 grid grid-cols-12 gap-6">
          <aside className="hidden md:block col-span-12 md:col-span-3 lg:col-span-2 xl:col-span-2">
            <SideNav open={openGroups} onToggle={toggle} active={'visits'} onSelect={()=>{}} onLogout={handleLogout} />
          </aside>
          <main className="col-span-12 md:col-span-9 lg:col-span-10 xl:col-span-10 space-y-6">
            {/* Create Compliance */}
            <div className="rounded-2xl border border-slate-100 bg-white p-4 md:p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800 mb-2">Create Compliance</h2>
              {message && <div className="mt-2 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div>}
              {errorLog && <pre className="mt-2 overflow-auto rounded bg-rose-50 p-3 text-xs text-rose-700 ring-1 ring-rose-100">{errorLog}</pre>}
              <form onSubmit={async (e)=>{
                e.preventDefault(); setMessage(''); setErrorLog('')
                try {
                  const payload = {
                    staff_id: form.staff_id ? parseInt(form.staff_id, 10) : null,
                    document_type: form.document_type || null,
                    document_number: form.document_number || null,
                    expiry_date: form.expiry_date || null,
                  }
                  await api.post('/compliance', {}, { params: payload })
                  setMessage('Compliance record created successfully');
                  setForm({ staff_id: '', document_type: '', document_number: '', expiry_date: '' })
                } catch (err){
                  const detail = err?.response?.data || { message: err?.message }
                  setErrorLog(JSON.stringify(detail, null, 2))
                }
              }} className="grid gap-3 md:grid-cols-2">
                <label className="block">
                  <span className="block text-sm text-slate-600">Staff</span>
                  <select value={form.staff_id} onChange={(e)=>setForm(f=>({...f, staff_id: e.target.value}))} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2">
                    <option value="">Select staff</option>
                    {staff.map(s => (<option key={s.id} value={s.id}>{s.full_name || s.name || `Staff #${s.id}`}</option>))}
                  </select>
                </label>
                <label className="block">
                  <span className="block text-sm text-slate-600">Document Type</span>
                  <input value={form.document_type} onChange={(e)=>setForm(f=>({...f, document_type: e.target.value}))} placeholder="License, Certification..." required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
                </label>
                <label className="block">
                  <span className="block text-sm text-slate-600">Document Number</span>
                  <input value={form.document_number} onChange={(e)=>setForm(f=>({...f, document_number: e.target.value}))} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
                </label>
                <label className="block">
                  <span className="block text-sm text-slate-600">Expiry Date</span>
                  <input type="date" value={form.expiry_date} onChange={(e)=>setForm(f=>({...f, expiry_date: e.target.value}))} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
                </label>
                <div className="md:col-span-2">
                  <button className="mt-2 rounded-lg bg-sky-600 px-5 py-2 text-white shadow hover:bg-sky-700">Create Compliance</button>
                </div>
              </form>
            </div>

            {/* Report Table (below form) */}
            <ReportTable />

            {/* Removed duplicate conditional ManageUsers section */}
          </main>
        </div>
      </div>
    </div>
  );
}

function TopNav({ onLogout, onToggleSidebar }) {
  const { user } = useContext(AuthContext)
  const displayName = (user?.full_name || user?.email || 'User')
  return (
    <header className="w-full bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm border-b border-slate-100">
      <div className="w-full px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100" aria-label="Open menu" onClick={onToggleSidebar}>
            <MenuIcon />
          </button>
          <div className="pl-1 md:pl-5 text-slate-800 font-extrabold tracking-tight">Healthcare Dashboard</div>
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
              <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50">
                <UserIcon className="h-4 w-4" /> Profile update
              </button>
              <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50">
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
      <button onClick={() => onSelect("home")} className={navItemCls(active === "home")}> 
        <HomeIcon /> Home
      </button>

  
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
          <button onClick={() => onSelect("feedback")} className={navSubItemCls(active === "feedback")}><ChatIcon /> Management Feedback</button>
          <button onClick={() => onSelect("visits")} className={navSubItemCls(active === "visits")}><StethoscopeIcon /> Manage Visits Report</button>
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

function SectionHeader({ title, open, onToggle }){
  return (
    <button onClick={onToggle} className="mt-3 mb-1 flex w-full items-center justify-between rounded-lg bg-slate-800 px-3 py-2 text-left text-sm font-medium text-slate-200 hover:bg-slate-700">
      <span className="flex items-center gap-2"><FolderIcon /> {title}</span>
      <span className={`transition ${open ? 'rotate-180' : ''}`}><ChevronIcon /></span>
    </button>
  )
}

function navItemCls(active){
  return `flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${active ? 'bg-slate-800 text-white' : 'text-slate-200 hover:bg-slate-800'}`
}
function navSubItemCls(active){
  return `flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm ${active ? 'bg-slate-800 text-white' : 'text-slate-200 hover:bg-slate-800'}`
}

function titleFor(key){
  const map = {
    home: 'Home',
    privileges: 'Manage Privilege', roles: 'Manage Role', staff: 'Manage Staff', patients: 'Manage Patient', map: 'Map Locations',
    assignments: 'Manage Staff Assignments', shift_reports: 'Manage Shift Reports', timesheets: 'Manage Timesheet Report', payroll: 'Manage Payroll', invoices: 'Manage Invoice', compliance: 'Manage Compliance', feedback: 'Management Feedback', visits: 'Manage Visits Report',
    op_assign_staff: 'Operation: Assign Staff', op_start_shift: 'Operation: Start Shift', op_end_shift: 'Operation: End Shift', op_submit_timesheet: 'Operation: Submit Timesheet', op_process_payroll: 'Operation: Process Payroll', op_verify_compliance: 'Operation: Verify Compliance', op_today_visits: 'Operation: Today Visits', op_complete_visit: 'Operation: Complete Visit',
    profile: 'Profile Update', track: 'Track Health Practitioner'
  }
  return map[key] || 'Dashboard';
}

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

/* Pie Chart Card (Donut) */
function PieChartCard({ staff = 40, patients = 60 }){
  const total = Math.max(1, staff + patients);
  const staffPct = (staff / total) * 100;
  const patientPct = 100 - staffPct;
  const r = 48; // radius
  const c = 2 * Math.PI * r; // circumference
  const staffLen = (staffPct / 100) * c;
  const patientLen = (patientPct / 100) * c;
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Staff to Patient Ratio</h3>
        <span className="text-xs text-slate-500">Donut Chart</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        <div className="relative mx-auto">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r={r} stroke="#e2e8f0" strokeWidth="16" fill="none" />
            <circle
              cx="70" cy="70" r={r}
              stroke="#22c55e" strokeWidth="16" fill="none"
              strokeDasharray={`${staffLen} ${c}`}
              strokeDashoffset={c * 0.25}
              strokeLinecap="round"
            />
            <circle
              cx="70" cy="70" r={r}
              stroke="#3b82f6" strokeWidth="16" fill="none"
              strokeDasharray={`${patientLen} ${c}`}
              strokeDashoffset={c * 0.25 + staffLen}
              strokeLinecap="round"
            />
            <text x="70" y="75" textAnchor="middle" className="fill-slate-700" fontSize="16" fontWeight="600">{Math.round(staffPct)}%</text>
          </svg>
        </div>
        <div className="space-y-3">
          <LegendItem color="bg-emerald-500" label="Staff" value={`${staff} (${Math.round(staffPct)}%)`} />
          <LegendItem color="bg-blue-500" label="Patients" value={`${patients} (${Math.round(patientPct)}%)`} />
          <div className="text-xs text-slate-500">Total: {total}</div>
        </div>
      </div>
    </div>
  )
}

function LegendItem({ color, label, value }){
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`inline-block h-3 w-3 rounded ${color}`}></span>
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <span className="text-sm font-medium text-slate-800">{value}</span>
    </div>
  )
}

/* Bar Chart Card */
function BarChartCard({ data = [] }){
  const max = Math.max(1, ...data.map(d => Math.max(d.staff, d.patients)));
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Weekly Staff vs Patients</h3>
        <span className="text-xs text-slate-500">Bar Chart</span>
      </div>
      <div className="grid grid-cols-7 gap-3 items-end h-48">
        {data.map((d, i) => {
          const staffH = (d.staff / max) * 100;
          const patientH = (d.patients / max) * 100;
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-8 flex items-end gap-1">
                <div className="w-3 rounded bg-emerald-500" style={{ height: `${staffH}%` }} />
                <div className="w-3 rounded bg-blue-500" style={{ height: `${patientH}%` }} />
              </div>
              <div className="text-[10px] text-slate-500">{d.label}</div>
            </div>
          )
        })}
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded bg-emerald-500"></span> Staff</div>
        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded bg-blue-500"></span> Patients</div>
      </div>
    </div>
  )
}

/* Report Table */
function ReportTable(){
  const rows = [
    { id: 1, name: 'Alice Rex', role: 'Tester', status: 'Present', checkin: '09:30 AM', checkout: '06:30 PM' },
    { id: 2, name: 'Rehna Eni', role: 'UI/UX Designer', status: 'Present', checkin: '09:45 AM', checkout: '06:50 PM' },
    { id: 3, name: 'Bob Upt', role: 'Backend', status: 'Absent', checkin: '00:00 AM', checkout: '00:00 PM' },
    { id: 4, name: 'Charlie Davieson', role: 'Team Lead', status: 'Present', checkin: '10:00 AM', checkout: '07:00 PM' },
    { id: 5, name: 'Suzika Stallone', role: 'UI Designer', status: 'Present', checkin: '09:30 AM', checkout: '05:15 PM' },
    { id: 6, name: 'Mc Greggor', role: 'Java Developer', status: 'Absent', checkin: '00:00 AM', checkout: '00:00 PM' },
  ];
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Attendance</h3>
        <button className="text-xs rounded border border-slate-200 px-3 py-1 hover:bg-slate-50">View All</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2 pr-3">S.NO</th>
              <th className="py-2 pr-3">EMPLOYEE</th>
              <th className="py-2 pr-3">STATUS</th>
              <th className="py-2 pr-3">CHECKIN</th>
              <th className="py-2 pr-3">CHECKOUT</th>
              <th className="py-2 pr-3">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="py-3 pr-3 text-slate-600">{idx + 1}</td>
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-3">
                    <img className="h-9 w-9 rounded-full object-cover" src={`https://ui-avatars.com/api/?name=${encodeURIComponent(r.name)}&background=0ea5e9&color=fff`} alt={r.name} />
                    <div>
                      <div className="font-medium text-slate-800">{r.name}</div>
                      <div className="text-xs text-slate-500">{r.role}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-3">
                  {r.status === 'Present' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700"><Dot color="bg-emerald-500" /> Present</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700"><Dot color="bg-rose-500" /> Absent</span>
                  )}
                </td>
                <td className="py-3 pr-3 text-slate-700">{r.checkin}</td>
                <td className="py-3 pr-3 text-slate-700">{r.checkout}</td>
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-2">
                    <IconButton color="bg-indigo-100" icon={<EyeIcon className="h-4 w-4 text-indigo-600" />} />
                    <IconButton color="bg-amber-100" icon={<EditIcon className="h-4 w-4 text-amber-600" />} />
                    <IconButton color="bg-rose-100" icon={<TrashIcon className="h-4 w-4 text-rose-600" />} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Dot({ color = 'bg-slate-400' }){ return <span className={`inline-block h-2 w-2 rounded-full ${color}`}></span> }
function IconButton({ color, icon }){
  return (
    <button className={`inline-flex items-center justify-center h-8 w-8 rounded-full ${color} hover:opacity-90 transition`}>{icon}</button>
  )
}

/* Icons (inline SVG) */
function BellIcon(){ return (<svg className="h-5 w-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>) }
function AvatarIcon(){ return (<svg className="h-6 w-6 text-slate-700" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z"/></svg>) }
function UserIcon({className="h-5 w-5"}){ return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-3-3.87M4 21v-2a4 4 0 013-3.87"/><path d="M12 12a4 4 0 100-8 4 4 0 000 8z"/></svg>) }
function MapPinIcon({className="h-5 w-5"}){ return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-6-4.35-6-10a6 6 0 1112 0c0 5.65-6 10-6 10z"/><circle cx="12" cy="11" r="2"/></svg>) }
function LogoutIcon({className="h-5 w-5"}){ return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 19V5a2 2 0 00-2-2h-7"/></svg>) }
function HomeIcon(){ return (<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9.5L12 3l9 6.5V21a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1V9.5z"/></svg>) }
function ShieldIcon(){ return (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>) }
function BadgeIcon(){ return (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M7 20h10l-5-5-5 5z"/></svg>) }
function UsersIcon(){ return (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>) }
function UserHeartIcon(){ return (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 21v-2a4 4 0 014-4h4"/><path d="M12 11a4 4 0 100-8 4 4 0 000 8z"/><path d="M21.8 13.6a2.6 2.6 0 00-3.7 0l-.1.1-.1-.1a2.6 2.6 0 00-3.7 3.7l3.8 3.8 3.8-3.8a2.6 2.6 0 000-3.7z"/></svg>) }
function MapIcon(){ return (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l-6 3V6l6-3 6 3 6-3z"/><path d="M9 5v13M15 8v13"/></svg>) }
function SwapIcon(){ return (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 7h14M10 4l-3 3 3 3"/><path d="M17 17H3M14 14l3 3-3 3"/></svg>) }
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
function MenuIcon(){ return (<svg className="h-5 w-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>) }
function EyeIcon({className="h-4 w-4"}){ return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>) }
function EditIcon({className="h-4 w-4"}){ return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>) }
function TrashIcon({className="h-4 w-4"}){ return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2"/></svg>) }
