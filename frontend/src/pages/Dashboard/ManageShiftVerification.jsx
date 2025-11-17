import React, { useContext, useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { AuthContext } from "../../context/AuthProvider";
import { TopNav, SideNav } from "./AdminDashboard";

const ADMIN_ROLES = ["admin", "hr", "finance"];

export default function ManageShiftVerification() {
  const { user } = useContext(AuthContext);
  const role = (user?.role?.name || user?.role || "").toString().toLowerCase();
  const isAdmin = ADMIN_ROLES.includes(role);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState({ account: true, service: true, ops: false });
  const [active, setActive] = useState("shift_verification");
  const [staffRows, setStaffRows] = useState([]);
  const [timesheetRows, setTimesheetRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorLog, setErrorLog] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    staff_id: "",
    total_hours: "",
    submitted: false,
    verified: false,
  });

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setErrorLog("");
      try {
        const [staffRes, timesheetRes] = await Promise.all([
          api.get("/staff", { params: { limit: 1000 } }),
          api.get("/timesheets", { params: { limit: 500 } })
        ]);
        if (cancelled) return;
        setStaffRows(Array.isArray(staffRes.data) ? staffRes.data : []);
        setTimesheetRows(Array.isArray(timesheetRes.data) ? timesheetRes.data : []);
      } catch (error) {
        if (!cancelled) {
          const detail = error?.response?.data;
          setErrorLog(detail ? JSON.stringify(detail, null, 2) : error?.message || "Failed to load timesheet data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const toggle = (key) => {
    setOpenGroups((s) => ({ account: false, service: false, ops: false, [key]: !s[key] || true }));
  };

  function handleLogout() {
    try {
      localStorage.removeItem("access_token");
    } catch (_) {}
    window.location.href = "/login";
  }

  const staffLookup = useMemo(() => {
    return Object.fromEntries(staffRows.map((row) => [row.id, row]));
  }, [staffRows]);

  const formattedTimesheets = useMemo(() => {
    return timesheetRows.map((row) => {
      const start = row.shift_start ? new Date(row.shift_start) : null;
      const end = row.shift_end ? new Date(row.shift_end) : null;
      const created = row.created_at ? new Date(row.created_at) : null;
      const displayDate = start || created;
      return {
        ...row,
        displayDate,
        shiftWindow: formatShiftWindow(start, end),
        startLocation: formatLatLng(row.start_lat, row.start_lng),
        endLocation: formatLatLng(row.end_lat, row.end_lng),
      };
    });
  }, [timesheetRows]);

  function beginEdit(timesheet) {
    setEditingId(timesheet.id);
    setForm({
      staff_id: timesheet.staff_id ? String(timesheet.staff_id) : "",
      total_hours: timesheet.total_hours != null ? String(timesheet.total_hours) : "",
      submitted: Boolean(timesheet.submitted),
      verified: Boolean(timesheet.verified),
    });
    setStatusMessage("");
  }

  function resetForm() {
    setEditingId(null);
    setForm({ staff_id: "", total_hours: "", submitted: false, verified: false });
    setStatusMessage("");
  }

  function handleFormChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!editingId) return;
    setStatusMessage("Updating timesheet...");
    try {
      const payload = {
        staff_id: form.staff_id ? Number(form.staff_id) : undefined,
        total_hours: form.total_hours !== "" ? Number(form.total_hours) : undefined,
        submitted: form.submitted,
        verified: form.verified,
      };
      await api.put(`/timesheets/${editingId}`, payload);
      setStatusMessage("Timesheet updated successfully.");
      resetForm();
      const refreshed = await api.get("/timesheets", { params: { limit: 500 } });
      setTimesheetRows(Array.isArray(refreshed.data) ? refreshed.data : []);
    } catch (error) {
      const detail = error?.response?.data;
      setStatusMessage(detail ? JSON.stringify(detail, null, 2) : error?.message || "Failed to update timesheet");
    }
  }

  async function handleDelete(timesheetId) {
    if (!window.confirm("Delete this timesheet? This action cannot be undone.")) return;
    try {
      await api.delete(`/timesheets/${timesheetId}`);
      setTimesheetRows((rows) => rows.filter((row) => row.id !== timesheetId));
      if (editingId === timesheetId) {
        resetForm();
      }
    } catch (error) {
      const detail = error?.response?.data;
      alert(detail ? JSON.stringify(detail, null, 2) : error?.message || "Failed to delete timesheet");
    }
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          Only administrators can access the Shift Verification workspace.
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
          <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-slate-800">Shift Verification</h1>
                <p className="text-sm text-slate-500">Review, correct, and approve timesheet entries.</p>
              </div>
              {statusMessage && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  {statusMessage}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-4">
              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-slate-500">Timesheet ID</label>
                <input
                  type="text"
                  value={editingId ? `TS-${String(editingId).padStart(5,'0')}` : "—"}
                  readOnly
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-slate-500">Staff</label>
                <select
                  name="staff_id"
                  value={form.staff_id}
                  onChange={handleFormChange}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                  disabled={!editingId}
                >
                  <option value="">Select staff</option>
                  {staffRows.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.user?.full_name || row.full_name || `Staff #${row.id}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-slate-500">Total Hours</label>
                <input
                  type="number"
                  name="total_hours"
                  value={form.total_hours}
                  onChange={handleFormChange}
                  step="0.01"
                  min="0"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g. 8"
                  disabled={!editingId}
                />
              </div>
              <div className="md:col-span-1 flex items-center gap-4">
                <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    name="submitted"
                    checked={form.submitted}
                    onChange={handleFormChange}
                    disabled={!editingId}
                    className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  Submitted
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    name="verified"
                    checked={form.verified}
                    onChange={handleFormChange}
                    disabled={!editingId}
                    className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  Verified
                </label>
              </div>
              <div className="md:col-span-4 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={!editingId}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-teal-700 disabled:opacity-50"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Reset
                </button>
              </div>
            </form>
          </section>

          {errorLog && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <div className="font-semibold">Error</div>
              <pre className="mt-2 whitespace-pre-wrap text-xs">{errorLog}</pre>
            </div>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Timesheet Log</h2>
                <p className="text-xs text-slate-500">Edit or delete submissions. Verification requires review of GPS and shift duration.</p>
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
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Ref</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Staff</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Role</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Date</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Hours</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Shift Window</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Start GPS</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">End GPS</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Status</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {formattedTimesheets.length === 0 && (
                      <tr>
                        <td colSpan={10} className="px-3 py-6 text-center text-slate-400">No timesheets available.</td>
                      </tr>
                    )}
                    {formattedTimesheets.map((row) => (
                      <tr key={row.id} className={row.verified ? "bg-emerald-50" : row.submitted ? "bg-teal-50" : ""}>
                        <td className="px-3 py-2 font-mono text-slate-700">{row.timesheet_ref || `TS-${row.id}`}</td>
                        <td className="px-3 py-2 text-slate-600">{row.staff_name || `Staff #${row.staff_id}`}</td>
                        <td className="px-3 py-2 text-slate-500">{row.staff_role || "—"}</td>
                        <td className="px-3 py-2 text-slate-600">{row.displayDate ? formatDate(row.displayDate) : '—'}</td>
                        <td className="px-3 py-2 text-slate-600">{row.total_hours != null ? Number(row.total_hours).toFixed(2) : '—'}</td>
                        <td className="px-3 py-2 text-slate-600">{row.shiftWindow || '—'}</td>
                        <td className="px-3 py-2 text-slate-600">{row.startLocation || '—'}</td>
                        <td className="px-3 py-2 text-slate-600">{row.endLocation || '—'}</td>
                        <td className="px-3 py-2 text-slate-600">{formatStatus(row.submitted, row.verified)}</td>
                        <td className="px-3 py-2 text-slate-600">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => beginEdit(row)}
                              className="rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(row.id)}
                              className="rounded-lg border border-rose-300 px-3 py-1 text-xs text-rose-600 hover:bg-rose-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
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
