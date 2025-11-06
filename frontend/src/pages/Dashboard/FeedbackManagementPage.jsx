import React, { useState } from "react";
import api from "../../api/axios";

export default function FeedbackManagementPage(){
  const [form, setForm] = useState({ visit_id: "", rating: "", comments: "" })
  const [message, setMessage] = useState("")
  const [errorLog, setErrorLog] = useState("")
  const [lastFeedback, setLastFeedback] = useState(null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Feedback Management</h2>
        <p className="text-sm text-slate-500 mt-1">Create and manage feedback for visits</p>
      </div>

      {/* Feedback Form */}
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

      {/* Last Feedback */}
      {lastFeedback && (
        <div className="rounded-2xl border border-slate-100 bg-white p-4 md:p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Last Feedback Submitted</h3>
          <div className="text-sm text-slate-700">ID: {lastFeedback.id}</div>
          <div className="text-sm text-slate-700">Visit ID: {lastFeedback.visit_id}</div>
          <div className="text-sm text-slate-700">Rating: {lastFeedback.rating}/5</div>
          <div className="text-sm text-slate-700">Comments: {lastFeedback.comments || '—'}</div>
        </div>
      )}
    </div>
  )
}


