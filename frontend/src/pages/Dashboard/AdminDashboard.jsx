import React, { useState, useContext, useEffect } from "react";
import MapTracker from "../../components/MapTracker";
import ManageUsers from "./ManageUsers";
import ManagePayroll from "./ManagePayroll";
import ManageRoles from "./ManageRoles";
import ManagePriviledge from "./ManagePriviledge";
import StaffInterface from "./StaffInterface";
import AssignmentsPage from "./AssignmentsPage";
import TimesheetManagement from "./TimesheetManagement";
import ComplianceManagementPage from "./ComplianceManagementPage";
import FeedbackManagementPage from "./FeedbackManagementPage";
import VisitManagementPage from "./VisitManagementPage";
import { AuthContext } from "../../context/AuthProvider";
import api from "../../api/axios";

export default function AdminDashboard() {
  const [openGroups, setOpenGroups] = useState({ account: true, service: false, ops: false });
  const [active, setActive] = useState("map"); // default to Map
  const [mobileOpen, setMobileOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');

  const { user } = useContext(AuthContext);
  
  // Determine user role for access control
  const userRole = user?.role?.name?.toLowerCase() || '';
  const isPatient = userRole === 'patient';
  const isStaff = userRole === 'staff' || userRole === 'practitioner';
  const isAdmin = userRole === 'admin' || userRole === 'hr' || userRole === 'finance';

  useEffect(() => {
    // Fetch company name
    if (user?.company_id) {
      api.get(`/companies/${user.company_id}`)
        .then(res => setCompanyName(res.data.name))
        .catch(() => setCompanyName('Healthcare Company'));
    } else {
      setCompanyName('Healthcare Dashboard');
    }
  }, [user]);

  const toggle = (key) => {
    // open only the selected group, collapse the others
    setOpenGroups((s) => ({ account: false, service: false, ops: false, [key]: !s[key] || true }));
  };

  const handleLogout = () => {
    try { localStorage.removeItem('access_token'); } catch (_) {}
    window.location.href = '/login';
  };

  const renderContent = (key) => {
    // Render full-page components (no wrapper)
    if (key === "payroll") return <ManagePayroll />;
    if (key === "users") return <ManageUsers />;
    if (key === "roles") return <ManageRoles />;
    if (key === "privileges") return <ManagePriviledge />;
    if (key === "staff") return <StaffInterface />;
    if (key === "assignments") return <AssignmentsPage />;
    if (key === "timesheets") return <TimesheetManagement />;
    if (key === "compliance") return <ComplianceManagementPage />;
    if (key === "feedback") return <FeedbackManagementPage />;
    if (key === "visits") return <VisitManagementPage />;
    
    // Render wrapped components
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm h-[70vh] md:h-[78vh]">
        <h2 className="text-xl font-semibold text-slate-800 mb-3">{titleFor(key)}</h2>
        <div className="h-[calc(100%-2.5rem)]">
          {key === "map" && <MapTracker />}
          {key === "home" && <DashboardHome />}
          {!["map", "home", "payroll", "users", "roles", "privileges", "staff", "assignments", "timesheets", "compliance", "feedback", "visits"].includes(key) && (
            <div className="flex items-center justify-center h-full text-slate-500">
              Content for {titleFor(key)} coming soon
            </div>
          )}
        </div>
      </div>
    );
  };

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
              active={active}
              onSelect={(v) => { setActive(v); setMobileOpen(false); }}
              onLogout={handleLogout}
              isPatient={isPatient}
              isStaff={isStaff}
              isAdmin={isAdmin}
            />
          </div>
        </div>
      )}

      <div className="relative z-10 min-h-screen">
        <TopNav companyName={companyName} onSelect={setActive} onLogout={handleLogout} onToggleSidebar={() => setMobileOpen(true)} />
        <div className="w-full px-4 sm:px-6 py-6 grid grid-cols-12 gap-6">
          <aside className="hidden md:block col-span-12 md:col-span-3 lg:col-span-2 xl:col-span-2">
            <SideNav
              open={openGroups}
              onToggle={toggle}
              active={active}
              onSelect={setActive}
              onLogout={handleLogout}
              isPatient={isPatient}
              isStaff={isStaff}
              isAdmin={isAdmin}
            />
          </aside>
          <main className="col-span-12 md:col-span-9 lg:col-span-10 xl:col-span-10 space-y-6">
            {renderContent(active)}
          </main>
        </div>
      </div>
    </div>
  );
}

export function TopNav({ companyName, onSelect, onLogout, onToggleSidebar }) {
  const { user } = useContext(AuthContext)
  const displayName = (user?.full_name || user?.email || 'User')
  return (
    <header className="w-full bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm border-b border-slate-100">
      <div className="w-full px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100" aria-label="Open menu" onClick={onToggleSidebar}>
            <MenuIcon />
          </button>
          <div>
            <div className="pl-1 md:pl-5 text-slate-800 font-extrabold tracking-tight">{companyName}</div>
            {companyName && companyName !== 'Healthcare Dashboard' && (
              <div className="pl-1 md:pl-5 text-xs text-slate-500">Healthcare Management System</div>
            )}
          </div>
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
              <a href="/dashboard/assignshiffs" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50">
                <ClockIcon /> Assigned Shiffs
              </a>
              <a href="/dashboard/startshift/" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50">
                <PlayIcon /> Start Shift
              </a>
              <a href="/dashboard/endshift" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50">
                <StopIcon /> End Shift
              </a>
              <a href="/dashboard/track" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50">
                <MapPinIcon className="h-4 w-4" /> Track health practitioner
              </a>
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

export function SideNav({ open, onToggle, active, onSelect, onLogout, isPatient, isStaff, isAdmin }) {
  return (
    <nav className="rounded-2xl bg-slate-900 text-slate-200 p-3 shadow-sm h-[calc(100vh-5.5rem)] overflow-y-auto">
      <button onClick={() => onSelect("home")} className={navItemCls(active === "home")}> 
        <HomeIcon /> Dashboard
      </button>

      {/* Patient only sees basic options */}
      {isPatient && (
        <div className="mt-3 p-3 bg-slate-800 rounded-lg text-sm text-slate-400">
          <p>Welcome! View your appointments and health information.</p>
        </div>
      )}

      {/* Account Management - Admin/Staff only */}
      {!isPatient && (
        <>
          <SectionHeader title="Account Management" open={open.account} onToggle={() => onToggle("account")} />
          {open.account && (
            <div className="ml-3 grid gap-1">
              {isAdmin && (
                <>
                  <button onClick={() => onSelect("users")} className={navSubItemCls(active === "users") + " flex items-center"}><UsersIcon /> Manage Users</button>
                  <button onClick={() => onSelect("roles")} className={navSubItemCls(active === "roles") + " flex items-center"}><BadgeIcon /> Manage Roles</button>
                  <button onClick={() => onSelect("privileges")} className={navSubItemCls(active === "privileges") + " flex items-center"}><ShieldIcon /> Manage Privileges</button>
                </>
              )}
              <button onClick={() => onSelect("staff")} className={navSubItemCls(active === "staff") + " flex items-center"}><UsersIcon /> {isAdmin ? 'Manage Staff' : 'Staff Profile'}</button>
              <a href="/dashboard/patient" className={navSubItemCls(active === "patient") + " flex items-center"}><UserHeartIcon /> Manage Patient</a>
              <button onClick={() => onSelect("map")} className={navSubItemCls(active === "map") + " flex items-center"}><MapIcon /> View Map Locations</button>
              <a href="/dashboard/track" className={navSubItemCls(active === "track") + " flex items-center"}><MapIcon /> Specific Map Tracker</a>
            </div>
          )}

          {/* Service Request - Admin/Staff only */}
          <SectionHeader title="Service Request" open={open.service} onToggle={() => onToggle("service")} />
          {open.service && (
            <div className="ml-3 grid gap-1">
              <button onClick={() => onSelect("assignments")} className={navSubItemCls(active === "assignments") + " flex items-center"}><SwapIcon /> Manage Assignments</button>
              <a href="/dashboard/assignshiffs" className={navSubItemCls(active === "assignshiffs") + " flex items-center"}><ClockIcon /> All Assigned Shifts</a>
              <button onClick={() => onSelect("shift_reports")} className={navSubItemCls(active === "shift_reports") + " flex items-center"}><ClockIcon /> Manage Shift Reports</button>
              <button onClick={() => onSelect("timesheets")} className={navSubItemCls(active === "timesheets") + " flex items-center"}><DocumentIcon /> Manage Timesheets</button>
              <button onClick={() => onSelect("payroll")} className={navSubItemCls(active === "payroll") + " flex items-center"}><CashIcon /> Manage Payroll</button>
              <button onClick={() => onSelect("invoices")} className={navSubItemCls(active === "invoices") + " flex items-center"}><ReceiptIcon /> Manage Invoices</button>
              <button onClick={() => onSelect("compliance")} className={navSubItemCls(active === "compliance") + " flex items-center"}><CheckIcon /> Manage Compliance</button>
              <button onClick={() => onSelect("feedback")} className={navSubItemCls(active === "feedback") + " flex items-center"}><ChatIcon /> Manage Feedback</button>
              <button onClick={() => onSelect("visits")} className={navSubItemCls(active === "visits") + " flex items-center"}><StethoscopeIcon /> Manage Visits</button>
            </div>
          )}

          {/* Operation - Admin/Staff only */}
          <SectionHeader title="Operation" open={open.ops} onToggle={() => onToggle("ops")} />
          {open.ops && (
            <div className="ml-3 grid gap-1">
              {isAdmin && <button onClick={() => onSelect("op_assign_staff")} className={navSubItemCls(active === "op_assign_staff") + " flex items-center"}><UserPlusIcon /> Assign Staff</button>}
              <a href="/dashboard/startshift/" className={navSubItemCls(active === "startshift") + " flex items-center"}><PlayIcon /> Start Shift</a>
              <a href="/dashboard/endshift" className={navSubItemCls(active === "endshift") + " flex items-center"}><StopIcon /> End Shift</a>
              <button onClick={() => onSelect("op_submit_timesheet")} className={navSubItemCls(active === "op_submit_timesheet") + " flex items-center"}><UploadIcon /> Submit Timesheet</button>
              {isAdmin && <button onClick={() => onSelect("op_process_payroll")} className={navSubItemCls(active === "op_process_payroll") + " flex items-center"}><CashIcon /> Process Payroll</button>}
              <button onClick={() => onSelect("op_verify_compliance")} className={navSubItemCls(active === "op_verify_compliance") + " flex items-center"}><CheckIcon /> Verify Compliance</button>
              <button onClick={() => onSelect("op_today_visits")} className={navSubItemCls(active === "op_today_visits") + " flex items-center"}><CalendarIcon /> Today Visits</button>
              <button onClick={() => onSelect("op_complete_visit")} className={navSubItemCls(active === "op_complete_visit") + " flex items-center"}><CheckIcon /> Complete Visit</button>
            </div>
          )}
        </>
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

// Simple Dashboard Home Component
function DashboardHome() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="text-3xl font-bold mb-2">Welcome</div>
          <div className="text-sm opacity-90">Healthcare Management Dashboard</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="text-2xl font-bold mb-2">Quick Access</div>
          <div className="text-sm opacity-90">Navigate using the side menu</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="text-2xl font-bold mb-2">Support</div>
          <div className="text-sm opacity-90">Contact support for assistance</div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-3">Getting Started</h3>
        <ul className="space-y-2 text-slate-600">
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Use the side menu to navigate to different sections</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>View and manage users, roles, and staff</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Process payroll and manage assignments</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Track staff locations on the map</span>
          </li>
        </ul>
      </div>
    </div>
  )
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
export function StatCard({ title, value, badge }){
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
        <h3 className="text-lg font-semibold text-slate-800">Attendanc: Health Care Staffing Platform</h3>
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
