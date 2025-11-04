import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import api from '../api/axios'
import { AuthContext } from '../context/AuthProvider'
import { useGPSTracking } from '../hooks/useGPSTracking'
import { TopNav, SideNav } from '../pages/Dashboard/AdminDashboard'
import staffMarkerUrl from '../../images/staff1.png'
import patientMarkerUrl from '../../images/marker.png'

// Load Leaflet from CDN (no npm dependency)
async function loadLeaflet(){
  if (typeof window !== 'undefined' && window.L) return window.L
  const cssId = 'leaflet-css'
  if (!document.getElementById(cssId)){
    const link = document.createElement('link')
    link.id = cssId
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
  }
  await new Promise((resolve) => {
    if (window.L) return resolve()
    const scriptId = 'leaflet-js'
    if (document.getElementById(scriptId)){
      const el = document.getElementById(scriptId)
      el.addEventListener('load', resolve, { once: true })
      return
    }
    const script = document.createElement('script')
    script.id = scriptId
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.async = true
    script.onload = resolve
    document.body.appendChild(script)
  })
  return window.L
}

function toNumOrNaN(v){
  if (v === null || v === undefined || v === '') return NaN
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return Number.isFinite(n) ? n : NaN
}

function pickCoord(rec){
  const pairs = [
    [rec?.latitude, rec?.longitude],
    [rec?.lat, rec?.lon],
    [rec?.lat, rec?.lng],
    [rec?.location?.lat, rec?.location?.lon],
    [rec?.location?.lat, rec?.location?.lng],
    [rec?.coords?.lat, rec?.coords?.lng],
  ]
  for (const [a,b] of pairs){
    const la = toNumOrNaN(a), lb = toNumOrNaN(b)
    if (Number.isFinite(la) && Number.isFinite(lb)) return { lat: la, lon: lb }
  }
  return { lat: NaN, lon: NaN }
}

function haversineKm(lat1, lon1, lat2, lon2){
  const toRad = (d) => (d * Math.PI) / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

export default function SpecificMapTracker(){
  const { user } = useContext(AuthContext)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState({ account: true, service: true, ops: false })
  const toggle = (key) => { setOpenGroups(s => ({ account: false, service: false, ops: false, [key]: !s[key] || true })) }
  function handleLogout(){ try { localStorage.removeItem('access_token') } catch(_){} window.location.href = '/login' }

  const [targetStaffId, setTargetStaffId] = useState(() => {
    try {
      const v = new URLSearchParams(window.location.search).get('staffId')
      return v ? parseInt(v, 10) : null
    } catch(_) { return null }
  })
  const [staffItem, setStaffItem] = useState(null)
  const [patients, setPatients] = useState([])
  const [serviceReqById, setServiceReqById] = useState({})
  const [assignments, setAssignments] = useState([])
  const [reportRows, setReportRows] = useState([])
  const [youPos, setYouPos] = useState(null)
  const mapRef = useRef(null)
  const staffLayerRef = useRef(null)
  const patientLayerRef = useRef(null)
  const routeLayerRef = useRef(null)
  const mapEl = useRef(null)

  // Resolve staffId if not provided via query param
  useEffect(() => {
    async function resolveStaff(){
      if (targetStaffId) return
      try {
        const stRes = await api.get('/staff', { params: { limit: 1000 } })
        const list = Array.isArray(stRes.data) ? stRes.data : []
        const me = (user && user.id != null) ? list.find(s => Number(s.user_id) === Number(user.id)) : null
        if (me) setTargetStaffId(me.id)
      } catch(_) {}
    }
    resolveStaff()
  }, [user, targetStaffId])

  // Fetch assignments for staff, patients and service requests
  useEffect(() => {
    let mounted = true
    async function load(){
      if (!targetStaffId) return
      try {
        const [asgRes, patRes, srRes, stRes] = await Promise.all([
          api.get('/assignments', { params: { limit: 1000 } }),
          api.get('/patients', { params: { limit: 1000 } }),
          api.get('/service_requests', { params: { limit: 1000 } }),
          api.get('/staff', { params: { limit: 1000 } }),
        ])
        if (!mounted) return
        const asgAll = Array.isArray(asgRes.data) ? asgRes.data : []
        const asgMine = asgAll.filter(a => Number(a.staff_id) === Number(targetStaffId))
        const pats = Array.isArray(patRes.data) ? patRes.data : []
        const srs = Array.isArray(srRes.data) ? srRes.data : []
        const stList = Array.isArray(stRes.data) ? stRes.data : []
        const staffRec = stList.find(s => Number(s.id) === Number(targetStaffId)) || null
        const srMap = Object.fromEntries(srs.map(r => [r.id, r]))
        setServiceReqById(srMap)
        setPatients(pats)
        setAssignments(asgMine)
        setStaffItem(staffRec)
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e)
      }
    }
    load()
    return () => { mounted = false }
  }, [targetStaffId])

  // Init map once - zoomed out to max (world view)
  useEffect(() => {
    let destroyed = false
    ;(async () => {
      const L = await loadLeaflet()
      if (destroyed) return
      if (mapRef.current) return
      const center = [20, 0] // roughly global view center
      const map = L.map(mapEl.current, { center, zoom: 19, scrollWheelZoom: true })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19 }).addTo(map)
      mapRef.current = map
      staffLayerRef.current = L.layerGroup().addTo(map)
      patientLayerRef.current = L.layerGroup().addTo(map)
      routeLayerRef.current = L.layerGroup().addTo(map)
    })()
    return () => { destroyed = true; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, [])

  // Update markers and distance report
  useEffect(() => {
    const L = window.L
    const map = mapRef.current
    if (!L || !map || !patientLayerRef.current || !staffLayerRef.current) return
    const patientLayer = patientLayerRef.current
    const staffLayer = staffLayerRef.current
    patientLayer.clearLayers()
    staffLayer.clearLayers()
    // no route lines

    // Image markers for staff and patients
    const staffIcon = L.icon({
      iconUrl: staffMarkerUrl,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -24],
    })
    const patientIcon = L.icon({
      iconUrl: patientMarkerUrl,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -24],
    })

    // Staff marker (from staff profile if coordinates present) OR live position
    let staffPoint = null
    const staffCoord = staffItem ? pickCoord(staffItem) : { lat: NaN, lon: NaN }
    if (Number.isFinite(staffCoord.lat) && Number.isFinite(staffCoord.lon)){
      staffPoint = [staffCoord.lat, staffCoord.lon]
      try { L.marker(staffPoint, { icon: staffIcon }).bindPopup(`<strong>Staff</strong>`).addTo(staffLayer).setOpacity(0.75) } catch(_) {}
    }
    if (youPos && Number.isFinite(youPos.lat) && Number.isFinite(youPos.lon)){
      const yp = [youPos.lat, youPos.lon]
      staffPoint = yp
      try { L.marker(yp, { icon: staffIcon }).bindPopup(`<strong>You</strong>`).addTo(staffLayer).setOpacity(0.75) } catch(_) {}
    }

    // Patients for the staff assignments
    const rows = []
    const patsById = Object.fromEntries((patients || []).map(p => [p.id, p]))
    for (const a of assignments){
      const sr = serviceReqById[a.service_request_id]
      if (!sr) continue
      const p = patsById[sr.patient_id]
      if (!p) continue
      const c = pickCoord(p)
      if (!(Number.isFinite(c.lat) && Number.isFinite(c.lon))) continue
      const pt = [c.lat, c.lon]
      try {
        const startUrl = `/dashboard/startshift?staffId=${encodeURIComponent(String(targetStaffId || ''))}&lat=${encodeURIComponent(String(c.lat))}&lon=${encodeURIComponent(String(c.lon))}&purpose=${encodeURIComponent((p.full_name || 'Patient') + ' visit')}`
        const endUrl = `/dashboard/endshift?lat=${encodeURIComponent(String(c.lat))}&lon=${encodeURIComponent(String(c.lon))}`
        L.marker(pt, { icon: patientIcon })
          .bindPopup(`
            <div>
              <strong>Patient</strong><br/>${p.full_name || 'Patient'}<br/>
              <small>${c.lat.toFixed(4)}, ${c.lon.toFixed(4)}</small>
              <div class="mt-2 grid gap-1">
                <a href="${startUrl}" class="inline-block rounded bg-emerald-600 px-2 py-1 text-xs text-white" style="color:#fff">Start Shift here</a>
                <a href="${endUrl}" class="inline-block rounded bg-indigo-600 px-2 py-1 text-xs text-white" style="color:#fff">End Shift here</a>
              </div>
            </div>
          `)
          .addTo(patientLayer)
          .setOpacity(0.75)
      } catch(_) {}
      let distanceKm = null
      if (staffPoint){
        distanceKm = haversineKm(staffPoint[0], staffPoint[1], c.lat, c.lon)
      }
      rows.push({
        id: p.id,
        name: p.full_name || `Patient #${p.id}`,
        email: p.email || '',
        address: p.address || '',
        lat: c.lat,
        lon: c.lon,
        distanceKm: Number.isFinite(distanceKm) ? distanceKm : null,
      })
    }
    setReportRows(rows)

    // Keep the view zoomed-in to staff if available, else first patient
    try {
      if (staffPoint){
        map.setView(staffPoint, 19)
      } else if (rows.length){
        map.setView([rows[0].lat, rows[0].lon], 19)
      }
    } catch(_) {}
  }, [assignments, patients, serviceReqById, staffItem, youPos])

  // GPS Tracking - automatically updates backend every 30 seconds
  const gpsTracking = useGPSTracking({ updateInterval: 30000, autoUpdate: true })
  
  // Update youPos state when GPS tracking updates
  useEffect(() => {
    if (gpsTracking.latitude !== null && gpsTracking.longitude !== null) {
      setYouPos({ lat: gpsTracking.latitude, lon: gpsTracking.longitude })
    }
  }, [gpsTracking.latitude, gpsTracking.longitude])

  const staffName = useMemo(() => {
    const uName = user && (user.full_name || user.email)
    return staffItem?.full_name || uName || 'You'
  }, [user, staffItem])

  return (
    <div className="relative min-h-screen bg-slate-50">
      {mobileOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-slate-900 text-slate-200 p-3 shadow-xl">
            <SideNav open={openGroups} onToggle={toggle} active={'map'} onSelect={()=>setMobileOpen(false)} onLogout={handleLogout} />
          </div>
        </div>
      )}

      <TopNav onSelect={()=>{}} onLogout={handleLogout} onToggleSidebar={() => setMobileOpen(true)} />

      <div className="w-full px-4 sm:px-6 py-6 grid grid-cols-12 gap-6">
        <aside className="hidden md:block col-span-12 md:col-span-3 lg:col-span-2 xl:col-span-2">
          <SideNav open={openGroups} onToggle={toggle} active={'map'} onSelect={()=>{}} onLogout={handleLogout} />
        </aside>
        <main className="col-span-12 md:col-span-9 lg:col-span-10 xl:col-span-10 space-y-6">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Assigned Patients for: <span className="font-semibold">{staffName}</span></h2>
            </div>
            <div className="relative my-4">
              <div ref={mapEl} className="h-[800px] w-full rounded-lg" />
              <div className="absolute top-2 left-2 right-2 z-10">
                <div className="flex flex-wrap items-center gap-2">
                  {(reportRows || []).filter(r => Number.isFinite(r.distanceKm)).map(r => (
                    <span key={r.id} className="inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur px-3 py-1 text-xs text-slate-700 shadow ring-1 ring-slate-200">
                      <span className="font-medium">{r.name}</span>
                      <span className="text-slate-500">{r.distanceKm.toFixed(2)} km</span>
                    </span>
                  ))}
                  {(!reportRows || !reportRows.some(r => Number.isFinite(r.distanceKm))) && (
                    <span className="inline-flex items-center rounded-full bg-white/90 backdrop-blur px-3 py-1 text-xs text-slate-500 shadow ring-1 ring-slate-200">Distances will appear when your location is available</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 px-1 py-2 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-600"></span> Staff/You</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-600"></span> Patients</span>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="py-2 pr-3">Patient</th>
                    <th className="py-2 pr-3">Email</th>
                    <th className="py-2 pr-3">Latitude</th>
                    <th className="py-2 pr-3">Longitude</th>
                    <th className="py-2 pr-3">Address</th>
                    <th className="py-2 pr-3">Distance (km)</th>
                  </tr>
                </thead>
                <tbody>
                  {(reportRows || []).map(r => (
                    <tr key={r.id} className="border-t border-slate-100">
                      <td className="py-2 pr-3 text-slate-700">{r.name}</td>
                      <td className="py-2 pr-3 text-slate-600">{r.email}</td>
                      <td className="py-2 pr-3 text-slate-700">{Number.isFinite(r.lat) ? r.lat.toFixed(4) : ''}</td>
                      <td className="py-2 pr-3 text-slate-700">{Number.isFinite(r.lon) ? r.lon.toFixed(4) : ''}</td>
                      <td className="py-2 pr-3 text-slate-600">{r.address || ''}</td>
                      <td className="py-2 pr-3 text-slate-700">{Number.isFinite(r.distanceKm) ? r.distanceKm.toFixed(2) : '—'}</td>
                    </tr>
                  ))}
                  {(!reportRows || reportRows.length === 0) && (
                    <tr><td className="py-3 text-slate-500" colSpan={6}>No assigned patients found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}


