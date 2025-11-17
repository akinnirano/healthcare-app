import React, { useContext, useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { AuthContext } from "../../context/AuthProvider";
import { TopNav, SideNav } from "./AdminDashboard";

const STAFF_ROLE_CODES = ["psw", "rn", "doctor", "nurse", "practitioner", "staff"];

export default function ManageTimesheetPage() {
  const { user } = useContext(AuthContext);
  const role = (user?.role?.name || user?.role || "").toString().toLowerCase();
  const isPatient = role === "patient";
  const isStaffRole = STAFF_ROLE_CODES.includes(role);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState({ account: true, service: true, ops: false });
  const [active, setActive] = useState("timesheets");
  const [staffRows, setStaffRows] = useState([]);
  const [timesheetRows, setTimesheetRows] = useState([]);
  const [staffFilter, setStaffFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorLog, setErrorLog] = useState("");

  const staffProfileId = user?.staff_profile?.id;

  useEffect(() => {
    if (isStaffRole && staffProfileId) {
      setStaffFilter((prev) => prev || String(staffProfileId));
    }
  }, [isStaffRole, staffProfileId]);

  useEffect(() => {
    if (isPatient) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setErrorLog("");
      try {
        const staffParams = { limit: 1000 };
        const timesheetParams = { limit: 500 };
        if (staffFilter) {
          timesheetParams.staff_id = staffFilter;
        }
        const [staffRes, timesheetRes] = await Promise.all([
          api.get("/staff", { params: staffParams }),
          api.get("/timesheets", { params: timesheetParams })
        ]);
        if (cancelled) return;
        const staffData = Array.isArray(staffRes.data) ? staffRes.data : [];
        const timesheetData = Array.isArray(timesheetRes.data) ? timesheetRes.data : [];
        setStaffRows(staffData);
        setTimesheetRows(timesheetData);
      } catch (error) {
        if (!cancelled) {
          const detail = error?.response?.data;
          setErrorLog(detail ? JSON.stringify(detail, null, 2) : error?.message || "Failed to load timesheet data");
          setTimesheetRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [staffFilter, isPatient]);

  const visibleStaff = useMemo(() => {
    if (staffFilter) {
      return staffRows.filter((row) => String(row.id) === String(staffFilter));
    }
    return staffRows;
  }, [staffRows, staffFilter]);

  const formattedTimesheets = useMemo(() => {
    return timesheetRows.map((row) => {
      const start = row.shift_start ? new Date(row.shift_start) : null;
      const end = row.shift_end ? new Date(row.shift_end) : null;
      const created = row.created_at ? new Date(row.created_at) : null;
      const displayDate = start || created;
      const durationHours = start && end ? ((end - start) / 36e5).toFixed(2) : row.total_hours;
      return {
        ...row,
        displayDate,
        durationHours,
        shiftWindow: formatShiftWindow(start, end),
        startLocation: formatLatLng(row.start_lat, row.start_lng),
        endLocation: formatLatLng(row.end_lat, row.end_lng),
      };
    });
  }, [timesheetRows]);

  const toggle = (key) => {
    setOpenGroups((s) => ({ account: false, service: false, ops: false, [key]: !s[key] || true }));
  };

  function handleLogout() {
    try {
      localStorage.removeItem("access_token");
    } catch (_) {}
    window.location.href = "/login";
  }

  if (isPatient) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          Patients do not have access to timesheets. Please contact support if you believe this is an error.
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50">
      {mobileOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-slate-900 text-slate-200 p-3 shadow-xl">
            <SideNav
              open={openGroups}
              onToggle={toggle}
              active={active}
              onSelect={(key) => {
                setActive(key);
                setMobileOpen(false);
              }}
              onLogout={handleLogout}
              role={role}
            />
          </div>
        </div>
      )}

      <TopNav
        onSelect={setActive}
        onLogout={handleLogout}
        onToggleSidebar={() => setMobileOpen(true)}
      />

      <div className="w-full px-4 sm:px-6 py-6 grid grid-cols-12 gap-6">
        <aside className="hidden md:block col-span-12 md:col-span-3 lg:col-span-2 xl:col-span-2">
          <SideNav
            open={openGroups}
            onToggle={toggle}
            active={active}
            onSelect={setActive}
            onLogout={handleLogout}
            role={role}
          />
        </aside>

        <main className="col-span-12 md:col-span-9 lg:col-span-10 xl:col-span-10 space-y-6">
          <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-800">Timesheet Report</h1>
              <p className="text-sm text-slate-500">Review staff profiles and logged shifts with GPS footprints.</p>
            </div>
            {!isStaffRole && (
              <div className="flex flex-col items-start gap-2 text-sm text-slate-600">
                <label htmlFor="staffFilter" className="font-medium text-slate-700">Filter by staff</label>
                <select
                  id="staffFilter"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={staffFilter}
                  onChange={(e) => setStaffFilter(e.target.value)}
                >
                  <option value="">All staff members</option>
                  {staffRows.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.user?.full_name || row.full_name || `Staff #${row.id}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {isStaffRole && staffProfileId && (
              <div className="rounded-lg bg-teal-50 px-3 py-2 text-xs font-medium text-teal-700">
                Viewing personal timesheets · Staff #{staffProfileId}
              </div>
            )}
          </header>

          {errorLog && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <div className="font-semibold">Unable to load data</div>
              <pre className="mt-2 whitespace-pre-wrap text-xs">{errorLog}</pre>
            </div>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Staff Overview</h2>
              <span className="text-sm text-slate-500">{visibleStaff.length} record(s)</span>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-slate-400">Loading staff...</div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Staff</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Role</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Email</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Phone</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleStaff.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-slate-400">No staff records available.</td>
                      </tr>
                    )}
                    {visibleStaff.map((row) => {
                      const userProfile = row.user || {};
                      const locationLabel = formatLatLng(row.latitude, row.longitude);
                      return (
                        <tr key={row.id}>
                          <td className="px-3 py-2 text-slate-700 font-medium">{userProfile.full_name || row.full_name || `Staff #${row.id}`}</td>
                          <td className="px-3 py-2 text-slate-500">{(userProfile.role && userProfile.role.name) || row.role || '—'}</td>
                          <td className="px-3 py-2 text-slate-500">{userProfile.email || row.email || '—'}</td>
                          <td className="px-3 py-2 text-slate-500">{userProfile.phone || row.phone || '—'}</td>
                          <td className="px-3 py-2 text-slate-500">{locationLabel || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Timesheet Entries</h2>
                <p className="text-xs text-slate-500">Includes GPS coordinates and shift windows for auditing.</p>
              </div>
              <span className="text-sm text-slate-500">{formattedTimesheets.length} record(s)</span>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-slate-400">Loading timesheets...</div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Timesheet Ref</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Staff</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Date</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Hours</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Shift Window</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Start Location</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">End Location</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {formattedTimesheets.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-3 py-6 text-center text-slate-400">No timesheets have been submitted yet.</td>
                      </tr>
                    )}
                    {formattedTimesheets.map((row) => (
                      <tr key={row.id}>
                        <td className="px-3 py-2 font-mono text-slate-700">{row.timesheet_ref || `TS-${row.id}`}</td>
                        <td className="px-3 py-2 text-slate-600">{row.staff_name || `Staff #${row.staff_id}`}</td>
                        <td className="px-3 py-2 text-slate-600">{row.displayDate ? formatDate(row.displayDate) : '—'}</td>
                        <td className="px-3 py-2 text-slate-600">{row.durationHours != null ? Number(row.durationHours).toFixed(2) : '—'}</td>
                        <td className="px-3 py-2 text-slate-600">{row.shiftWindow || '—'}</td>
                        <td className="px-3 py-2 text-slate-600">{row.startLocation || '—'}</td>
                        <td className="px-3 py-2 text-slate-600">{row.endLocation || '—'}</td>
                        <td className="px-3 py-2 text-slate-600">{formatStatus(row.submitted, row.verified)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

function formatDate(date) {
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (e) {
    return "—";
  }
}

function formatShiftWindow(start, end) {
  if (!start && !end) return null;
  const startLabel = start ? formatDate(start) : "Unknown";
  const endLabel = end ? formatDate(end) : "Pending";
  return `${startLabel} → ${endLabel}`;
}

function formatLatLng(lat, lng) {
  if ((lat == null || isNaN(lat)) && (lng == null || isNaN(lng))) return "";
  if (lat == null || lng == null) return "Unknown";
  return `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`;
}

function formatStatus(submitted, verified) {
  if (verified) return "Verified";
  if (submitted) return "Submitted";
  return "Draft";
}
