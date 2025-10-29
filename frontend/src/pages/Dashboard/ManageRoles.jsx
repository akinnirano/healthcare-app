import React, { useState, useEffect } from 'react'
import api from '../../api/axios'

export default function ManageRoles(){
  const [roles, setRoles] = useState([])
  const [privileges, setPrivileges] = useState([])
  const [selectedPrivilegeIds, setSelectedPrivilegeIds] = useState([])
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [errorLog, setErrorLog] = useState('')
  // Link user to role
  const [users, setUsers] = useState([])
  const [linkUserId, setLinkUserId] = useState('')
  const [linkRoleId, setLinkRoleId] = useState('')

  async function refresh(){
    try {
      const res = await api.get('/roles', { params: { limit: 100 } })
      setRoles(Array.isArray(res.data) ? res.data : [])
    } catch (_) { setRoles([]) }
    try {
      const pr = await api.get('/priviledges', { params: { limit: 1000 } })
      setPrivileges(Array.isArray(pr.data) ? pr.data : [])
    } catch (_){ setPrivileges([]) }
    try {
      const ur = await api.get('/users', { params: { limit: 200 } })
      setUsers(Array.isArray(ur.data) ? ur.data : [])
    } catch (_){ setUsers([]) }
  }
  useEffect(() => { refresh() }, [])

  async function createRole(e){
    e.preventDefault(); setLoading(true); setMessage(''); setErrorLog('')
    try {
      const resp = await api.post('/roles', null, { params: { name, description: desc, privilege_ids: selectedPrivilegeIds } })
      setMessage(`Role ${resp?.data?.name || name} created`)
      setName(''); setDesc(''); setSelectedPrivilegeIds([]); refresh()
    } catch (err) {
      const detail = err?.response?.data || { message: err?.message }
      setErrorLog(JSON.stringify(detail, null, 2))
    } finally { setLoading(false) }
  }

  async function linkUserToRole(e){
    e.preventDefault(); setLoading(true); setMessage(''); setErrorLog('')
    try {
      const uid = parseInt(linkUserId, 10)
      const rid = parseInt(linkRoleId, 10)
      await api.put(`/users/${uid}`, null, { params: { role_id: rid } })
      setMessage('User linked to role successfully')
      setLinkUserId(''); setLinkRoleId(''); refresh()
    } catch (err) {
      const detail = err?.response?.data || { message: err?.message }
      setErrorLog(JSON.stringify(detail, null, 2))
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      {/* Scoreboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Total Roles" value={roles.length} badge="All" />
        <StatCard title="Total Privileges" value={privileges.length} badge="All" />
        <StatCard title="Users (sample)" value="—" badge="Info" />
        <StatCard title="Linkable Users" value={users.length} badge="Users" />
      </div>
      <div className="rounded-2xl border border-slate-100 bg-white p-4 md:p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">Manage Role</h2>
        {message && <div className="mt-2 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div>}
        {errorLog && <pre className="mt-2 overflow-auto rounded bg-rose-50 p-3 text-xs text-rose-700 ring-1 ring-rose-100">{errorLog}</pre>}
        <form onSubmit={createRole} className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="block text-sm text-slate-600">Role name</span>
            <input value={name} onChange={(e)=>setName(e.target.value)} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </label>
          <label className="block">
            <span className="block text-sm text-slate-600">Description</span>
            <input value={desc} onChange={(e)=>setDesc(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </label>
          <label className="block md:col-span-2">
            <span className="block text-sm text-slate-600">Privileges</span>
            <select multiple value={selectedPrivilegeIds.map(String)} onChange={(e)=>{
              const opts = Array.from(e.target.selectedOptions).map(o=>parseInt(o.value,10));
              setSelectedPrivilegeIds(opts);
            }} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 h-40">
              {privileges.map(p => (
                <option key={p.id} value={p.id}>{p.code}</option>
              ))}
            </select>
          </label>
          <div className="md:col-span-2">
            <button disabled={loading} className="mt-2 rounded-lg bg-sky-600 px-5 py-2 text-white shadow hover:bg-sky-700 disabled:opacity-60">{loading? 'Creating...' : 'Create Role'}</button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-4 md:p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-800 mb-3">Existing Roles</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Privileges</th>
              </tr>
            </thead>
            <tbody>
              {roles.map(r => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="py-2 pr-3">{r.name}</td>
                  <td className="py-2 pr-3">{Array.isArray(r.privileges)? r.privileges.length : 0}</td>
                </tr>
              ))}
              {roles.length === 0 && <tr><td className="py-3 text-slate-500" colSpan={2}>No roles</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Link user to role */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 md:p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-800 mb-3">Link User To Role</h3>
        <form onSubmit={linkUserToRole} className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="block text-sm text-slate-600">User</span>
            <select value={linkUserId} onChange={(e)=>setLinkUserId(e.target.value)} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2">
              <option value="">Select user</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.full_name} ({u.email || 'no-email'})</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-sm text-slate-600">Role</span>
            <select value={linkRoleId} onChange={(e)=>setLinkRoleId(e.target.value)} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2">
              <option value="">Select role</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </label>
          <div className="md:col-span-2">
            <button disabled={loading} className="mt-2 rounded-lg bg-sky-600 px-5 py-2 text-white shadow hover:bg-sky-700 disabled:opacity-60">{loading? 'Linking...' : 'Link User'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

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
        <div className="h-2 rounded bg-indigo-400" style={{ width: '50%' }} />
      </div>
    </div>
  )
}


