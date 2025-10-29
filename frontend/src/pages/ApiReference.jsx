import React from 'react'
import ENDPOINTS from '../api/endpoints'

export default function ApiReference(){
  const sections = Object.entries(ENDPOINTS)
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">API Reference</h1>
      <p className="mt-2 text-sm text-gray-600">All available API endpoints grouped by resource.</p>
      <div className="mt-6 space-y-6">
        {sections.map(([group, defs]) => (
          <div key={group} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 capitalize">{group}</h2>
            <ul className="mt-3 list-disc pl-5 text-sm text-gray-700">
              {Object.entries(defs).map(([k, v]) => (
                <li key={k} className="break-all"><span className="font-medium">{k}</span>: {typeof v === 'function' ? v(':id') : v}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
