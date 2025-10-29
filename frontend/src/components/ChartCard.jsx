import React from 'react'

export default function ChartCard(){
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-800">Activity</h2>
      <div className="mt-4 h-48 rounded-lg bg-gradient-to-r from-sky-50 via-cyan-50 to-sky-50">
        {/* Placeholder for chart */}
        <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.15),transparent_40%),_radial-gradient(circle_at_70%_60%,rgba(6,182,212,0.15),transparent_45%)] rounded-lg" />
      </div>
    </div>
  )
}
