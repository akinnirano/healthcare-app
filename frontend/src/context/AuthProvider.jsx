import React, { createContext, useState, useEffect, useRef } from 'react'
import { getUserFromToken } from '../utils/jwt'
import api, { login as apiLogin, isTokenValid } from '../api/axios'

export const AuthContext = createContext()

/**
 * AuthProvider manages authentication state and JWT token lifecycle
 * Features:
 * - Automatic token validation and expiration handling
 * - Auto-logout on token expiration
 * - Response interceptor for 401 errors
 * - Persistent storage in localStorage
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('access_token'))
  const [loading, setLoading] = useState(true)
  const logoutTimerRef = useRef(null)
  const axiosInterceptorRef = useRef(null)

  function clearLogoutTimer(){
    if (logoutTimerRef.current){
      clearTimeout(logoutTimerRef.current)
      logoutTimerRef.current = null
    }
  }

  // Validate and manage token state
  useEffect(() => {
    clearLogoutTimer()
    
    if (token) {
      // Validate token format and expiration
      const u = getUserFromToken(token)
      
      if (!u) {
        // Invalid token format
        console.warn('Invalid token format detected, clearing authentication')
        setToken(null)
        setLoading(false)
        return
      }
      
      setUser(u)
      localStorage.setItem('access_token', token)
      
      const expSec = u?.exp
      if (expSec && Number.isFinite(expSec)){
        const ms = expSec * 1000 - Date.now()
        
        if (ms > 0){
          // Schedule auto-logout before token expires
          logoutTimerRef.current = setTimeout(() => {
            console.log('Token expired, logging out...')
            setToken(null)
          }, ms)
        } else {
          // Token already expired
          console.warn('Token has already expired, clearing authentication')
          setToken(null)
        }
      }
    } else {
      setUser(null)
      localStorage.removeItem('access_token')
    }
    
    setLoading(false)
    return () => clearLogoutTimer()
  }, [token])

  // Response interceptor to auto-logout on 401 errors
  useEffect(() => {
    // Clean up existing interceptor
    if (axiosInterceptorRef.current != null){
      api.interceptors.response.eject(axiosInterceptorRef.current)
      axiosInterceptorRef.current = null
    }
    
    // Add response interceptor
    axiosInterceptorRef.current = api.interceptors.response.use(
      (resp) => resp,
      (error) => {
        // Auto-logout on 401 Unauthorized
        if (error?.response?.status === 401){
          console.warn('Received 401 Unauthorized, clearing authentication')
          setToken(null)
        }
        return Promise.reject(error)
      }
    )
    
    return () => {
      if (axiosInterceptorRef.current != null){
        api.interceptors.response.eject(axiosInterceptorRef.current)
        axiosInterceptorRef.current = null
      }
    }
  }, [])

  /**
   * Login user with email/phone and password
   * Stores JWT token in state and localStorage
   */
  async function login(email, password) {
    try {
      const data = await apiLogin(email, password)
      if (data?.access_token) {
        setToken(data.access_token)
      }
      return data
    } catch (error) {
      // Clear any existing invalid tokens
      setToken(null)
      throw error
    }
  }
  
  /**
   * Logout user and clear authentication state
   */
  function logout(){ 
    clearLogoutTimer()
    setToken(null) 
  }

  /**
   * Check if user is authenticated with a valid token
   */
  const isAuthenticated = token && user && isTokenValid()

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      loading,
      isAuthenticated 
    }}>
      {children}
    </AuthContext.Provider>
  )
}
