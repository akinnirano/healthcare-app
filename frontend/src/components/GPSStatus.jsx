import React from 'react'

/**
 * GPS Tracking Status Indicator
 * Shows current GPS tracking status with visual feedback
 */
export default function GPSStatus({ latitude, longitude, accuracy, error, isTracking }) {
  if (error) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeWidth="2"/>
          <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round"/>
          <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <span className="text-sm text-red-700">GPS Error: {error}</span>
      </div>
    )
  }

  if (!isTracking) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"/>
        </svg>
        <span className="text-sm text-gray-600">GPS Tracking Disabled</span>
      </div>
    )
  }

  if (latitude === null || longitude === null) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
        <svg className="w-4 h-4 text-yellow-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span className="text-sm text-yellow-700">Obtaining GPS location...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
      <div className="relative">
        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      </div>
      <div className="text-sm text-green-700">
        <span className="font-medium">Tracking:</span>{' '}
        {latitude.toFixed(4)}, {longitude.toFixed(4)}
        {accuracy && <span className="text-xs ml-1">(±{Math.round(accuracy)}m)</span>}
      </div>
    </div>
  )
}

