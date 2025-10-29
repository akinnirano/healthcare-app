import React, { useEffect, useState } from 'react'
import api from '../../services/api'

export default function JobAssignment() {
  const [requests, setRequests] = useState([])
  const [staffs, setStaffs] = useState([])
  const [requestId, setRequestId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [jobType, setJobType] = useState('Hand Hygiene')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const jobOptions = [
    'Hand Hygiene',
    'Top Shower',
    'Sponge/Bed',
    'Bed Cleaning',
    'Toileting',
    'Precare',
  ]

  useEffect(() => {
    async function load() {
      try {
        const reqs = await api.get('/service_requests')
        const stfs = await api.get('/staff')
        setRequests(reqs.data || [])
        setStaffs(stfs.data || [])
      } catch (e) { console.error(e) }
    }
    load()
  }, [])

  async function assignJob(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/assignments/', {
        service_request_id: parseInt(requestId),
        staff_id: parseInt(staffId),
        job_type: jobType
      })
      setMessage(`Assigned staff successfully: ${res.data.staff_id}`)
    } catch (err) {
      setMessage('Failed to assign staff')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Assign Staff to Job</h2>

      <form onSubmit={assignJob} className="space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium">Select Service Request</label>
          <select value={requestId} onChange={(e) => setRequestId(e.target.value)} className="border w-full p-2 rounded">
            <option value="">-- Select Request --</option>
            {requests.map((r) => (<option key={r.id} value={r.id}>Request #{r.id} - {r.description || 'No details'}</option>))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Select Staff</label>
          <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className="border w-full p-2 rounded">
            <option value="">-- Select Staff --</option>
            {staffs.map((s) => (<option key={s.id} value={s.id}>{s.user?.full_name || `Staff ${s.id}`}</option>))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Type of Care / Job</label>
          <select value={jobType} onChange={(e) => setJobType(e.target.value)} className="border w-full p-2 rounded">
            {jobOptions.map((j) => (<option key={j}>{j}</option>))}
          </select>
        </div>

        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? 'Assigning...' : 'Assign Staff'}</button>
        {message && <div className="mt-3 text-green-600">{message}</div>}
      </form>
    </div>
  )
}
