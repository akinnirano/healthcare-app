import React, { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../../context/AuthProvider'
import api from '../../api/axios'
import MapTracker from '../../components/MapTracker'

export default function PatientDashboard() {
  const { user } = useContext(AuthContext)
  const [activeView, setActiveView] = useState('visits')
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedVisit, setSelectedVisit] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    fetchVisits()
  }, [])

  const fetchVisits = async () => {
    setLoading(true)
    try {
      const res = await api.get('/visits/')
      // Filter visits for current patient if patient_id is available
      const patientVisits = res.data || []
      setVisits(patientVisits)
    } catch (error) {
      console.error('Error fetching visits:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    try { localStorage.removeItem('access_token') } catch (_) {}
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white p-4 shadow-xl">
            <PatientSidebar 
              activeView={activeView} 
              setActiveView={(v) => { setActiveView(v); setMobileOpen(false); }} 
              onLogout={handleLogout}
            />
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-20">
        <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden p-2 hover:bg-slate-100 rounded-lg"
              onClick={() => setMobileOpen(true)}
            >
              <MenuIcon />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Patient Portal</h1>
              <p className="text-xs text-slate-500">Healthcare Management System</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
              <UserIcon />
              <span className="text-sm font-medium text-slate-700">{user?.full_name || 'Patient'}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-73px)] sticky top-[73px]">
          <PatientSidebar activeView={activeView} setActiveView={setActiveView} onLogout={handleLogout} />
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6">
          {activeView === 'visits' && (
            <VisitsView 
              visits={visits} 
              loading={loading} 
              onRefresh={fetchVisits}
              onSelectVisit={setSelectedVisit}
            />
          )}
          {activeView === 'map' && (
            <StaffMapView visits={visits} selectedVisit={selectedVisit} />
          )}
          {activeView === 'feedback' && (
            <FeedbackView />
          )}
        </main>
      </div>
    </div>
  )
}

// ========================================
// PATIENT SIDEBAR
// ========================================
function PatientSidebar({ activeView, setActiveView, onLogout }) {
  return (
    <nav className="p-4 space-y-2">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
        Menu
      </h2>
      
      <NavButton 
        active={activeView === 'visits'} 
        onClick={() => setActiveView('visits')}
        icon={<CalendarIcon />}
      >
        My Visits
      </NavButton>
      
      <NavButton 
        active={activeView === 'map'} 
        onClick={() => setActiveView('map')}
        icon={<MapIcon />}
      >
        Track Staff on Map
      </NavButton>
      
      <NavButton 
        active={activeView === 'feedback'} 
        onClick={() => setActiveView('feedback')}
        icon={<ChatIcon />}
      >
        Feedback
      </NavButton>

      <div className="pt-4 mt-4 border-t border-slate-200">
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
        >
          <LogoutIcon />
          Logout
        </button>
      </div>
    </nav>
  )
}

function NavButton({ active, onClick, icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition ${
        active 
          ? 'bg-teal-50 text-teal-700 font-medium' 
          : 'text-slate-700 hover:bg-slate-50'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}

// ========================================
// VISITS VIEW
// ========================================
function VisitsView({ visits, loading, onRefresh, onSelectVisit }) {
  const [filterStatus, setFilterStatus] = useState('all')

  const filteredVisits = visits.filter(visit => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'completed') return visit.completed
    if (filterStatus === 'pending') return !visit.completed
    return true
  })

  const completedCount = visits.filter(v => v.completed).length
  const pendingCount = visits.filter(v => !v.completed).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My Visits</h2>
          <p className="text-sm text-slate-500 mt-1">View all your healthcare visits and staff assignments</p>
        </div>
        <button 
          onClick={onRefresh}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition flex items-center gap-2"
        >
          <RefreshIcon />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="Total Visits" 
          value={visits.length} 
          icon={<CalendarIcon />}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard 
          title="Completed" 
          value={completedCount} 
          icon={<CheckIcon />}
          color="bg-green-100 text-green-600"
        />
        <StatCard 
          title="Pending" 
          value={pendingCount} 
          icon={<ClockIcon />}
          color="bg-orange-100 text-orange-600"
        />
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <FilterButton active={filterStatus === 'all'} onClick={() => setFilterStatus('all')}>
          All Visits
        </FilterButton>
        <FilterButton active={filterStatus === 'pending'} onClick={() => setFilterStatus('pending')}>
          Pending
        </FilterButton>
        <FilterButton active={filterStatus === 'completed'} onClick={() => setFilterStatus('completed')}>
          Completed
        </FilterButton>
      </div>

      {/* Visits Table/List */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Staff Assigned</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Notes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredVisits.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="text-slate-400">
                        <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No visits found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredVisits.map((visit) => (
                    <tr key={visit.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {formatDateTime(visit.scheduled_time)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={`https://ui-avatars.com/api/?name=Staff&background=14b8a6&color=fff`}
                            alt="Staff"
                            className="w-8 h-8 rounded-full"
                          />
                          <div>
                            <div className="text-sm font-medium text-slate-800">
                              Staff ID: {visit.staff_id || 'Not assigned'}
                            </div>
                            <div className="text-xs text-slate-500">Healthcare Professional</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {visit.completed ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckIcon className="w-3 h-3 mr-1" />
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            <ClockIcon className="w-3 h-3 mr-1" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                        {visit.notes || 'No notes'}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => onSelectVisit(visit)}
                          className="px-3 py-1.5 text-xs bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                        >
                          Track on Map
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ========================================
// STAFF MAP VIEW
// ========================================
function StaffMapView({ visits, selectedVisit }) {
  const [staffLocations, setStaffLocations] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchStaffLocations()
  }, [visits])

  const fetchStaffLocations = async () => {
    setLoading(true)
    try {
      // Get unique staff IDs from visits
      const staffIds = [...new Set(visits.map(v => v.staff_id).filter(Boolean))]
      
      // Fetch location for each staff
      const locations = []
      for (const staffId of staffIds) {
        try {
          const res = await api.get(`/location/staff/${staffId}`)
          if (res.data && res.data.latitude && res.data.longitude) {
            locations.push({
              staff_id: staffId,
              latitude: res.data.latitude,
              longitude: res.data.longitude,
              name: res.data.name || `Staff ${staffId}`,
              last_update: res.data.last_update
            })
          }
        } catch (error) {
          console.log(`No location for staff ${staffId}`)
        }
      }
      
      setStaffLocations(locations)
    } catch (error) {
      console.error('Error fetching staff locations:', error)
    } finally {
      setLoading(false)
    }
  }

  // Default center (use first staff location or default)
  const center = staffLocations.length > 0 
    ? [staffLocations[0].latitude, staffLocations[0].longitude]
    : [37.7749, -122.4194] // San Francisco default

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Staff Locations</h2>
          <p className="text-sm text-slate-500 mt-1">Track your assigned healthcare professionals</p>
        </div>
        <button 
          onClick={fetchStaffLocations}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition flex items-center gap-2"
        >
          <RefreshIcon />
          Refresh Locations
        </button>
      </div>

      {/* Map */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-[600px] relative">
          {loading ? (
            <LoadingSpinner />
          ) : staffLocations.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-slate-400">
                <MapIcon className="w-16 h-16 mx-auto mb-3 opacity-50" />
                <p>No staff locations available</p>
                <p className="text-sm mt-1">Staff will appear here when they are assigned to your visits</p>
              </div>
            </div>
          ) : (
            <MapTracker />
          )}
        </div>
      </div>

      {/* Staff List */}
      {staffLocations.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Assigned Staff</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffLocations.map((staff) => (
              <div key={staff.staff_id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(staff.name)}&background=14b8a6&color=fff`}
                    alt={staff.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="font-medium text-slate-800">{staff.name}</div>
                    <div className="text-xs text-slate-500">Staff ID: {staff.staff_id}</div>
                  </div>
                </div>
                <div className="text-xs text-slate-600 space-y-1 mt-3">
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="w-3 h-3" />
                    <span>Latitude: {staff.latitude.toFixed(4)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="w-3 h-3" />
                    <span>Longitude: {staff.longitude.toFixed(4)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-3 h-3" />
                    <span>Updated: {formatTimeAgo(staff.last_update)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ========================================
// FEEDBACK VIEW
// ========================================
function FeedbackView() {
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ visit_id: '', rating: 5, comments: '' })

  useEffect(() => {
    fetchFeedbacks()
  }, [])

  const fetchFeedbacks = async () => {
    setLoading(true)
    try {
      const res = await api.get('/feedback/')
      setFeedbacks(res.data || [])
    } catch (error) {
      console.error('Error fetching feedback:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/feedback/', formData)
      alert('Feedback submitted successfully!')
      setShowForm(false)
      setFormData({ visit_id: '', rating: 5, comments: '' })
      fetchFeedbacks()
    } catch (error) {
      alert('Error submitting feedback: ' + (error.response?.data?.detail || error.message))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Feedback</h2>
          <p className="text-sm text-slate-500 mt-1">Share your experience with our healthcare services</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
        >
          {showForm ? 'Cancel' : '+ Submit Feedback'}
        </button>
      </div>

      {/* Feedback Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Submit New Feedback</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className={`text-2xl transition ${
                      star <= formData.rating ? 'text-yellow-400' : 'text-slate-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
                <span className="ml-2 text-sm text-slate-600">({formData.rating}/5)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Comments</label>
              <textarea
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Share your experience..."
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
            >
              Submit Feedback
            </button>
          </form>
        </div>
      )}

      {/* Previous Feedback */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Your Previous Feedback</h3>
        {loading ? (
          <LoadingSpinner />
        ) : feedbacks.length === 0 ? (
          <p className="text-slate-500 text-sm">No feedback submitted yet</p>
        ) : (
          <div className="space-y-4">
            {feedbacks.map((feedback) => (
              <div key={feedback.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < feedback.rating ? 'text-yellow-400' : 'text-slate-300'}>
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-slate-500">{formatDateTime(feedback.submitted_at)}</span>
                </div>
                <p className="text-sm text-slate-700">{feedback.comments}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ========================================
// HELPER COMPONENTS
// ========================================
function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-slate-500 mb-1">{title}</div>
          <div className="text-3xl font-bold text-slate-800">{value}</div>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function FilterButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
        active
          ? 'bg-teal-600 text-white'
          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  )
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
    </div>
  )
}

// Helper functions
function formatDateTime(datetime) {
  if (!datetime) return 'N/A'
  const date = new Date(datetime)
  return date.toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatTimeAgo(datetime) {
  if (!datetime) return 'N/A'
  const date = new Date(datetime)
  const seconds = Math.floor((new Date() - date) / 1000)
  
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  return `${Math.floor(seconds / 86400)} days ago`
}

// Icons
function MenuIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}

function CalendarIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function MapIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}

function CheckIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function ClockIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}

function MapPinIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

