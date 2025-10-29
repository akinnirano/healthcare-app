import React, { useEffect, useState } from 'react'
import api from '../../services/api'
export default function Timeslots(){ const [slots,setSlots]=useState([]); useEffect(()=>{ api.get('/timeslots').then(r=>setSlots(r.data)).catch(()=>{}) },[]); return (<div className="p-8"><h2 className="text-xl font-bold">Timeslot Management</h2><ul className="mt-4">{slots.map(s=> (<li key={s.id} className="p-2 border my-1">{s.start} - {s.end}</li>))}</ul></div>) }
