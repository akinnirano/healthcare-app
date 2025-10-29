import React, { useEffect, useRef, useState, useContext } from 'react'
import api from '../api/axios'
import { AuthContext } from '../context/AuthProvider'

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

export default function MapTracker(){
  const { user } = useContext(AuthContext)
  const [staff, setStaff] = useState([])
  const [patients, setPatients] = useState([])
  const [users, setUsers] = useState([])
  const [geoCache, setGeoCache] = useState({}) // address -> {lat, lon}
  const [reportRows, setReportRows] = useState([])
  const [selectedStaffId, setSelectedStaffId] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const v = params.get('staffId')
      return v ? parseInt(v, 10) : null
    } catch (_) { return null }
  })
  const [orgFilter] = useState(() => {
    try { return new URLSearchParams(window.location.search).get('org') || '' } catch (_) { return '' }
  })
  const mapRef = useRef(null)
  const staffLayerRef = useRef(null)
  const patientLayerRef = useRef(null)
  const youLayerRef = useRef(null)
  const routeLayerRef = useRef(null)
  const mapEl = useRef(null)
  const geoPendingRef = useRef(new Set())

  // Fetch coordinates periodically
  useEffect(() => {
    let mounted = true
    async function fetchAll(){
      try {
        const [staffRes, patientRes, usersRes] = await Promise.all([
          api.get('/staff'),
          api.get('/patients'),
          api.get('/users', { params: { limit: 1000 } })
        ])
        if (!mounted) return
        const rawStaff = Array.isArray(staffRes.data) ? staffRes.data : []
        const rawPatients = Array.isArray(patientRes.data) ? patientRes.data : []
        const rawUsers = Array.isArray(usersRes.data) ? usersRes.data : []
        const filt = String(orgFilter || '').trim()
        const staffFiltered = filt ? rawStaff.filter(r => recordMatchesOrg(r, filt)) : rawStaff
        const patientFiltered = filt ? rawPatients.filter(r => recordMatchesOrg(r, filt)) : rawPatients
        const usersFiltered = filt ? rawUsers.filter(r => recordMatchesOrg(r, filt)) : rawUsers
        setStaff(staffFiltered)
        setPatients(patientFiltered)
        setUsers(usersFiltered)

        try {
          // Build indexes to find coordinates for each user from staff or patient profile
          const staffByUserId = {}
          staffFiltered.forEach(st => { if (st && st.user_id != null) staffByUserId[st.user_id] = st })
          const patientByUserId = {}
          patientFiltered.forEach(p => { if (p && p.user_id != null) patientByUserId[p.user_id] = p })
          const patientByEmail = {}
          const patientByName = {}
          patientFiltered.forEach(p => {
            if (!p) return
            if (p.email) patientByEmail[String(p.email).toLowerCase()] = p
            if (p.full_name) patientByName[String(p.full_name).toLowerCase()] = p
          })

          const rows = usersFiltered.map(u => {
            let lat = NaN, lon = NaN
            // 1) If user has staff profile, use staff coords
            const st = staffByUserId[u.id]
            if (st){ const c = pickCoord(st); lat = c.lat; lon = c.lon }
            // 2) Otherwise, try to match patient by user_id, then email, then name
            if (!(isFinite(lat) && isFinite(lon))){
              const pu = patientByUserId[u.id] || null
              const pe = (!pu && u.email && patientByEmail[String(u.email).toLowerCase()]) || null
              const pn = (!pu && !pe && u.full_name && patientByName[String(u.full_name).toLowerCase()]) || null
              const p = pu || pe || pn
              if (p){ const c = pickCoord(p); lat = c.lat; lon = c.lon }
            }
            const latNum = toNumOrNaN(lat)
            const lonNum = toNumOrNaN(lon)
            return {
              id: u.id,
              name: u.full_name || '',
              email: u.email || '',
              lat: isFinite(latNum) ? latNum : null,
              lon: isFinite(lonNum) ? lonNum : null,
            }
          })
          // Print all users with their lat/lon (if available)
          // eslint-disable-next-line no-console
          console.table(rows)
          try { console.debug('counts', { users: usersFiltered.length, staff: staffFiltered.length, patients: patientFiltered.length }) } catch(_) {}
        } catch (_) { /* ignore console logging issues */ }
      } catch (e) { console.error(e) }
    }
    fetchAll()
    const t = setInterval(fetchAll, 15000)
    return () => { mounted = false; clearInterval(t) }
  }, [])

  // Initialize map once
  useEffect(() => {
    let destroyed = false
    ;(async () => {
      const L = await loadLeaflet()
      if (destroyed) return
      if (mapRef.current) return
      const center = [43.6532, -79.3832]
      const map = L.map(mapEl.current, { center, zoom: 11, scrollWheelZoom: true })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map)
      mapRef.current = map
      staffLayerRef.current = L.layerGroup().addTo(map)
      patientLayerRef.current = L.layerGroup().addTo(map)
      youLayerRef.current = L.layerGroup().addTo(map)
      routeLayerRef.current = L.layerGroup().addTo(map)
    })()
    return () => { destroyed = true; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, [])

  // Update markers when data changes
  useEffect(() => {
    const L = window.L
    const map = mapRef.current
    if (!L || !map || !staffLayerRef.current || !patientLayerRef.current) return

    const staffLayer = staffLayerRef.current
    const patientLayer = patientLayerRef.current
    const routeLayer = routeLayerRef.current
    staffLayer.clearLayers()
    patientLayer.clearLayers()
    routeLayer && routeLayer.clearLayers()

    // Patient markers: blue; Staff/admin/etc.: red
    const patientIcon = { color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.9, radius: 6, weight: 2 }
    const staffIcon = { color: '#dc2626', fillColor: '#ef4444', fillOpacity: 0.9, radius: 6, weight: 2 }
    const highlightIcon = { color: '#059669', fillColor: '#10b981', fillOpacity: 0.95, radius: 8, weight: 3 }

    let anyPoint = null
    let selectedPoint = null

    // Indexes to resolve coordinates for users
    const userById = {}
    ;(users || []).forEach(u => { if (u && u.id != null) userById[u.id] = u })
    const staffByUserId = {}
    ;(staff || []).forEach(st => { if (st && st.user_id != null) staffByUserId[st.user_id] = st })
    const patientByEmail = {}
    const patientByName = {}
    const patientByUserId = {}
    ;(patients || []).forEach(p => {
      if (!p) return
      if (p.user_id != null) patientByUserId[p.user_id] = p
      if (p.email) patientByEmail[String(p.email).toLowerCase()] = p
      if (p.full_name) patientByName[String(p.full_name).toLowerCase()] = p
    })

    // Plot per user based on linked patient/staff coordinates
    const rowsForReport = []
    ;(users || []).forEach(u => {
      let role = null
      let source = 'unknown'
      let lat = NaN, lon = NaN
    const st = staffByUserId[u.id]
    const stCoord = st ? pickCoord(st) : { lat: NaN, lon: NaN }
    const pu = patientByUserId[u.id] || null
    const pe = (!pu && u.email && patientByEmail[String(u.email).toLowerCase()]) || null
    const pn = (!pu && !pe && u.full_name && patientByName[String(u.full_name).toLowerCase()]) || null
    const p = pu || pe || pn
      const pCoord = p ? pickCoord(p) : { lat: NaN, lon: NaN }

      if (st && Number.isFinite(stCoord.lat) && Number.isFinite(stCoord.lon)){
        role = 'staff'; source = 'staff'; lat = stCoord.lat; lon = stCoord.lon
      }
      if (!(Number.isFinite(lat) && Number.isFinite(lon)) && p && Number.isFinite(pCoord.lat) && Number.isFinite(pCoord.lon)){
        role = 'patient'; source = 'patient'; lat = pCoord.lat; lon = pCoord.lon
      }
      // Try geocoding address when coords unavailable
      let address = ''
      if (!(Number.isFinite(lat) && Number.isFinite(lon))){
        address = (p && p.address) || (st && st.address) || (u && u.address) || ''
        const key = String(address || '').trim().toLowerCase()
        const cached = key ? geoCache[key] : null
        if (cached && Number.isFinite(cached.lat) && Number.isFinite(cached.lon)){
          lat = cached.lat; lon = cached.lon; source = 'geocoded-cache'
        } else if (key && !geoPendingRef.current.has(key)){
          geoPendingRef.current.add(key)
          geocodeAddress(key).then((pt) => {
            if (pt){ setGeoCache((prev) => ({ ...prev, [key]: pt })) }
            geoPendingRef.current.delete(key)
          }).catch(() => { geoPendingRef.current.delete(key) })
        }
      }
      const latNum = toNumOrNaN(lat)
      const lonNum = toNumOrNaN(lon)
      if (!(Number.isFinite(latNum) && Number.isFinite(lonNum))) return
      anyPoint = anyPoint || [latNum, lonNum]
      const isSelected = st && selectedStaffId && Number(selectedStaffId) === Number(st.id)
      const icon = isSelected ? highlightIcon : (role === 'patient' ? patientIcon : staffIcon)
      const layer = role === 'patient' ? patientLayer : staffLayer
      const name = u.full_name || (st && st.full_name) || (p && p.full_name) || 'User'
      const email = u.email ? `<br/><small>${u.email}</small>` : ''
      try { console.log('Resolved user coord:', { id: u.id, name, email: u.email || '', role: role || 'unknown', source, lat: latNum, lon: lonNum, address }) } catch(_) {}
      rowsForReport.push({
        id: u.id,
        name,
        email: u.email || '',
        role: role || 'unknown',
        staffLat: Number.isFinite(stCoord.lat) ? stCoord.lat : null,
        staffLon: Number.isFinite(stCoord.lon) ? stCoord.lon : null,
        patientLat: Number.isFinite(pCoord.lat) ? pCoord.lat : null,
        patientLon: Number.isFinite(pCoord.lon) ? pCoord.lon : null,
        address,
      })
      const marker = L.circleMarker([latNum, lonNum], icon)
        .bindPopup(`<strong>${role === 'patient' ? 'Patient' : 'Staff'}</strong><br/>${name}${email}<br/><small>${latNum.toFixed(4)}, ${lonNum.toFixed(4)}</small>`)
        .addTo(layer)
      if (isSelected){
        selectedPoint = [latNum, lonNum]
        try { marker.openPopup(); map.setView([latNum, lonNum], 14, { animate: true }) } catch(_) {}
      }
    })

    try { setReportRows(rowsForReport) } catch(_) {}

    if (anyPoint){
      try {
        const group = L.featureGroup([staffLayer, patientLayer])
        map.fitBounds(group.getBounds().pad(0.2))
      } catch (_) {}
    }

    // If we have both user and selected staff point, draw a line
    const youLayer = youLayerRef.current
    if (youLayer && selectedPoint && youLayer._layers){
      const userMarkers = Object.values(youLayer._layers)
      if (userMarkers.length){
        const youLatLng = userMarkers[0].getLatLng()
        if (youLatLng){
          try {
            routeLayer.addLayer(L.polyline([selectedPoint, [youLatLng.lat, youLatLng.lng]], { color: '#0ea5e9', weight: 2, dashArray: '4 4' }))
          } catch(_) {}
        }
      }
    }
  }, [staff, patients, users, geoCache])

  // Track user's device location (phone/system) if permitted
  useEffect(() => {
    const L = window.L
    const map = mapRef.current
    if (!L || !map || !youLayerRef.current) return
    const youLayer = youLayerRef.current
    let youMarker = null
    let watchId = null
    if (navigator.geolocation){
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          youLayer.clearLayers()
          const who = (user && (user.full_name || user.email)) ? ` - ${String(user.full_name || user.email)}` : ''
          youMarker = L.circleMarker([latitude, longitude], { color: '#065f46', fillColor: '#10b981', fillOpacity: 0.6, radius: 7, weight: 2 })
            .bindPopup(`<strong>You${who}</strong>`)
            .addTo(youLayer)
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
      )
    }
    return () => { if (watchId && navigator.geolocation) navigator.geolocation.clearWatch(watchId) }
  }, [])

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-2">
      <div ref={mapEl} className="h-[800px] w-full py-6 rounded-lg" />
      <div className="flex items-center gap-4 px-2 py-2 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-600"></span> Patients</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-600"></span> Staff</span>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Email</th>
              <th className="py-2 pr-3">Role</th>
              <th className="py-2 pr-3">Staff Lat</th>
              <th className="py-2 pr-3">Staff Lon</th>
              <th className="py-2 pr-3">Patient Lat</th>
              <th className="py-2 pr-3">Patient Lon</th>
              <th className="py-2 pr-3">Address</th>
            </tr>
          </thead>
          <tbody>
            {(reportRows || []).map(r => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="py-2 pr-3 text-slate-700">{r.name}</td>
                <td className="py-2 pr-3 text-slate-600">{r.email}</td>
                <td className="py-2 pr-3 text-slate-600">{r.role}</td>
                <td className="py-2 pr-3 text-slate-700">{Number.isFinite(r.staffLat) ? r.staffLat.toFixed(4) : ''}</td>
                <td className="py-2 pr-3 text-slate-700">{Number.isFinite(r.staffLon) ? r.staffLon.toFixed(4) : ''}</td>
                <td className="py-2 pr-3 text-slate-700">{Number.isFinite(r.patientLat) ? r.patientLat.toFixed(4) : ''}</td>
                <td className="py-2 pr-3 text-slate-700">{Number.isFinite(r.patientLon) ? r.patientLon.toFixed(4) : ''}</td>
                <td className="py-2 pr-3 text-slate-600">{r.address || ''}</td>
              </tr>
            ))}
            {reportRows.length === 0 && (
              <tr><td className="py-3 text-slate-500" colSpan={8}>No users to display</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Heuristic: check common organization fields on records (and nested user)
function recordMatchesOrg(rec, org){
  if (!org) return true
  const o = String(org).trim().toLowerCase()
  const candidates = []
  try {
    candidates.push(rec.organization, rec.organisation, rec.org, rec.orgName, rec.organisation_name, rec.organization_name)
    candidates.push(rec.org_id, rec.organization_id, rec.organisation_id)
    if (rec.user){
      candidates.push(rec.user.organization, rec.user.organisation, rec.user.org, rec.user.org_id, rec.user.organization_id)
    }
  } catch (_) {}
  for (const c of candidates){
    if (c == null) continue
    const s = String(c).trim().toLowerCase()
    if (!s) continue
    if (s === o) return true
  }
  return false
}

// Safe numeric parse for coordinates; prevents null -> 0 coercion
function toNumOrNaN(v){
  if (v === null || v === undefined || v === '') return NaN
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return Number.isFinite(n) ? n : NaN
}

// Try multiple common shapes to extract coordinates
function pickCoord(rec){
  const pairs = [
    [rec?.latitude, rec?.longitude],
    [rec?.lat, rec?.lon],
    [rec?.lat, rec?.lng],
    [rec?.location?.lat, rec?.location?.lon],
    [rec?.location?.lat, rec?.location?.lng],
    [rec?.coords?.lat, rec?.coords?.lng],
    [rec?.user?.latitude, rec?.user?.longitude],
  ]
  for (const [a,b] of pairs){
    const la = toNumOrNaN(a), lb = toNumOrNaN(b)
    if (Number.isFinite(la) && Number.isFinite(lb)) return { lat: la, lon: lb }
  }
  return { lat: NaN, lon: NaN }
}

async function geocodeAddress(address){
  try {
    if (!address) return null
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
    const resp = await fetch(url, { headers: { 'Accept': 'application/json' } })
    if (!resp.ok) return null
    const data = await resp.json()
    if (Array.isArray(data) && data.length){
      const lat = toNumOrNaN(data[0].lat)
      const lon = toNumOrNaN(data[0].lon)
      if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon }
    }
  } catch (_) {}
  return null
}
