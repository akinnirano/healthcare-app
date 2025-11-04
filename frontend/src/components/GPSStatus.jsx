import React from 'react'
import { MapPin, Wifi, WifiOff, AlertCircle } from 'lucide-react'

/**
 * GPS Tracking Status Indicator
 * Shows current GPS tracking status with visual feedback
 */
export default function GPSStatus({ latitude, longitude, accuracy, error, isTracking }) {
  if (error) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="text-red-600" size={16} />
        <span className="text-sm text-red-700">GPS Error: {error}</span>
      </div>
    )
  }

  if (!isTracking) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
        <WifiOff className="text-gray-400" size={16} />
        <span className="text-sm text-gray-600">GPS Tracking Disabled</span>
      </div>
    )
  }

  if (latitude === null || longitude === null) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="animate-spin">
          <Wifi className="text-yellow-600" size={16} />
        </div>
        <span className="text-sm text-yellow-700">Obtaining GPS location...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
      <div className="relative">
        <MapPin className="text-green-600" size={16} />
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

