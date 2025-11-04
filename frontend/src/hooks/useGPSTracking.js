import { useEffect, useRef, useState, useContext } from 'react'
import api from '../api/axios'
import { AuthContext } from '../context/AuthProvider'

/**
 * Custom hook for GPS tracking
 * Automatically obtains device location and updates backend when user is authenticated
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.updateInterval - How often to send updates to backend (ms), default 30000 (30s)
 * @param {boolean} options.highAccuracy - Use high accuracy GPS, default true
 * @param {boolean} options.autoUpdate - Automatically update backend, default true
 * @returns {Object} { latitude, longitude, accuracy, error, isTracking, startTracking, stopTracking }
 */
export function useGPSTracking(options = {}) {
  const {
    updateInterval = 30000, // Update backend every 30 seconds
    highAccuracy = true,
    autoUpdate = true
  } = options

  const { isAuthenticated } = useContext(AuthContext)
  const [location, setLocation] = useState({ latitude: null, longitude: null, accuracy: null })
  const [error, setError] = useState(null)
  const [isTracking, setIsTracking] = useState(false)
  
  const watchIdRef = useRef(null)
  const lastUpdateRef = useRef(0)
  const locationRef = useRef({ latitude: null, longitude: null })

  const updateBackend = async (lat, lon, accuracy) => {
    if (!isAuthenticated) return
    
    try {
      await api.post('/location/update', {
        latitude: lat,
        longitude: lon,
        accuracy: accuracy,
        timestamp: new Date().toISOString()
      })
      console.log('GPS location updated on backend:', { lat, lon })
    } catch (err) {
      console.warn('Failed to update location on backend:', err.message)
    }
  }

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setIsTracking(true)
    setError(null)

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        
        setLocation({ latitude, longitude, accuracy })
        locationRef.current = { latitude, longitude }
        
        // Update backend if enough time has passed and auto-update is enabled
        const now = Date.now()
        if (autoUpdate && isAuthenticated && (now - lastUpdateRef.current) >= updateInterval) {
          lastUpdateRef.current = now
          updateBackend(latitude, longitude, accuracy)
        }
      },
      (err) => {
        console.warn('GPS error:', err.message)
        setError(err.message)
        setIsTracking(false)
      },
      {
        enableHighAccuracy: highAccuracy,
        maximumAge: 10000, // Accept cached position up to 10 seconds old
        timeout: 20000 // Wait up to 20 seconds for position
      }
    )
  }

  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setIsTracking(false)
  }

  // Auto-start tracking when authenticated
  useEffect(() => {
    if (isAuthenticated && navigator.geolocation) {
      startTracking()
    } else {
      stopTracking()
    }

    return () => stopTracking()
  }, [isAuthenticated])

  // Manual update function
  const updateNow = async () => {
    const { latitude, longitude } = locationRef.current
    if (latitude !== null && longitude !== null) {
      await updateBackend(latitude, longitude, location.accuracy)
    }
  }

  return {
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
    error,
    isTracking,
    startTracking,
    stopTracking,
    updateNow
  }
}

/**
 * Simpler hook that just gets current position once
 * @returns {Object} { latitude, longitude, accuracy, error, loading, getCurrentLocation }
 */
export function useCurrentLocation() {
  const [location, setLocation] = useState({ latitude: null, longitude: null, accuracy: null })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return Promise.reject(new Error('Geolocation not supported'))
    }

    setLoading(true)
    setError(null)

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords
          setLocation({ latitude, longitude, accuracy })
          setLoading(false)
          resolve({ latitude, longitude, accuracy })
        },
        (err) => {
          setError(err.message)
          setLoading(false)
          reject(err)
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 10000
        }
      )
    })
  }

  return {
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
    error,
    loading,
    getCurrentLocation
  }
}

