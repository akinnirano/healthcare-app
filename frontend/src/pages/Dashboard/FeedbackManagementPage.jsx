import React, { useState } from "react";
import api from "../../api/axios";
import { TopNav, SideNav, StatCard } from "./AdminDashboard";

export default function FeedbackManagementPage(){
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState({ account: true, service: true, ops: false })
  const [form, setForm] = useState({ visit_id: "", rating: "", comments: "" })
  const [message, setMessage] = useState("")
  const [errorLog, setErrorLog] = useState("")
  const [lastFeedback, setLastFeedback] = useState(null)

  const toggle = (key) => { setOpenGroups(s => ({ account: false, service: false, ops: false, [key]: !s[key] || true })) }
  function handleLogout(){ try { localStorage.removeItem('access_token') } catch(_){} window.location.href = '/login' }

  return (
    <div className="relative min-h-screen bg-slate-50">
      {mobileOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-slate-900 text-slate-200 p-3 shadow-xl">
            <SideNav open={openGroups} onToggle={toggle} active={'feedback'} onSelect={()=>setMobileOpen(false)} onLogout={handleLogout} />
          </div>
        </div>
      )}

      <TopNav onSelect={()=>{}} onLogout={handleLogout} onToggleSidebar={() => setMobileOpen(true)} />

      <div className="w-full px-4 sm:px-6 py-6 grid grid-cols-12 gap-6">
        <aside className="hidden md:block col-span-12 md:col-span-3 lg:col-span-2 xl:col-span-2">
          <SideNav open={openGroups} onToggle={toggle} active={'feedback'} onSelect={()=>{}} onLogout={handleLogout} />
        </aside>
        <main className="col-span-12 md:col-span-9 lg:col-span-10 xl:col-span-10 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <StatCard title="Feedback" value="Create" badge="Form" />
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4 md:p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">Create Feedback</h2>
            {message && <div className="mt-2 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div>}
            {errorLog && <pre className="mt-2 overflow-auto rounded bg-rose-50 p-3 text-xs text-rose-700 ring-1 ring-rose-100">{errorLog}</pre>}
            <form onSubmit={async (e)=>{
              e.preventDefault(); setMessage(''); setErrorLog('')
              try {
                const payload = {
                  visit_id: form.visit_id ? parseInt(form.visit_id, 10) : null,
                  rating: form.rating ? parseInt(form.rating, 10) : null,
                  comments: form.comments || null,
                }
                const resp = await api.post('/feedback', {}, { params: payload })
                setLastFeedback(resp?.data || null)
                setMessage('Feedback submitted successfully')
                setForm({ visit_id: '', rating: '', comments: '' })
              } catch (err){ setErrorLog(JSON.stringify(err?.response?.data || { message: err?.message }, null, 2)) }
            }} className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="block text-sm text-slate-600">Visit ID</span>
                <input value={form.visit_id} onChange={(e)=>setForm(f=>({...f, visit_id: e.target.value}))} placeholder="e.g. 1" required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
              </label>
              <label className="block">
                <span className="block text-sm text-slate-600">Rating (1-5)</span>
                <input type="number" min={1} max={5} value={form.rating} onChange={(e)=>setForm(f=>({...f, rating: e.target.value}))} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
              </label>
              <label className="block md:col-span-2">
                <span className="block text-sm text-slate-600">Comments</span>
                <input value={form.comments} onChange={(e)=>setForm(f=>({...f, comments: e.target.value}))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
              </label>
              <div className="md:col-span-2">
                <button className="mt-2 rounded-lg bg-sky-600 px-5 py-2 text-white shadow hover:bg-sky-700">Submit Feedback</button>
              </div>
            </form>
          </div>

          {lastFeedback && (
            <div className="rounded-2xl border border-slate-100 bg-white p-4 md:p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Last Feedback</h3>
              <div className="text-sm text-slate-700">ID: {lastFeedback.id}</div>
              <div className="text-sm text-slate-700">Visit ID: {lastFeedback.visit_id}</div>
              <div className="text-sm text-slate-700">Rating: {lastFeedback.rating}</div>
              <div className="text-sm text-slate-700">Comments: {lastFeedback.comments || '—'}</div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}


