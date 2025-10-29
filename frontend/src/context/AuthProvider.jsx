import React, { createContext, useState, useEffect, useRef } from 'react'
import { getUserFromToken } from '../utils/jwt'
import api, { login as apiLogin } from '../api/axios'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('access_token'))
  const logoutTimerRef = useRef(null)
  const axiosInterceptorRef = useRef(null)

  function clearLogoutTimer(){
    if (logoutTimerRef.current){
      clearTimeout(logoutTimerRef.current)
      logoutTimerRef.current = null
    }
  }

  useEffect(() => {
    // manage token state and schedule auto-logout
    clearLogoutTimer()
    if (token) {
      const u = getUserFromToken(token)
      setUser(u)
      localStorage.setItem('access_token', token)
      const expSec = u?.exp
      if (expSec && Number.isFinite(expSec)){
        const ms = expSec * 1000 - Date.now()
        if (ms > 0){
          logoutTimerRef.current = setTimeout(() => setToken(null), ms)
        } else {
          // already expired
          setToken(null)
        }
      }
    } else {
      setUser(null)
      localStorage.removeItem('access_token')
    }
    return () => clearLogoutTimer()
  }, [token])

  // Response interceptor to auto-logout on 401
  useEffect(() => {
    if (axiosInterceptorRef.current != null){
      api.interceptors.response.eject(axiosInterceptorRef.current)
      axiosInterceptorRef.current = null
    }
    axiosInterceptorRef.current = api.interceptors.response.use(
      (resp) => resp,
      (error) => {
        if (error?.response?.status === 401){
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

  async function login(email, password) {
    const data = await apiLogin(email, password)
    if (data?.access_token) setToken(data.access_token)
    return data
  }
  function logout(){ setToken(null) }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
