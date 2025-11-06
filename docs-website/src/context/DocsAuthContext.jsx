import React, { createContext, useState, useEffect, useContext } from 'react'
import axios from 'axios'

const DocsAuthContext = createContext()

export function useDocsAuth() {
  const context = useContext(DocsAuthContext)
  if (!context) {
    throw new Error('useDocsAuth must be used within DocsAuthProvider')
  }
  return context
}

export function DocsAuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('docs_access_token'))
  const [apiKey, setApiKey] = useState(localStorage.getItem('docs_api_key'))
  const [loading, setLoading] = useState(true)

  // Check if token is valid
  const isTokenValid = () => {
    if (!token) return false
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const exp = payload.exp
      if (!exp) return false
      // Check if token expires in more than 1 minute
      return (exp * 1000) > (Date.now() + 60000)
    } catch (e) {
      return false
    }
  }

  // Login function
  const login = async (email, password) => {
    try {
      // Call the main backend login endpoint
      const response = await axios.post('/api/auth/login', {
        email,
        password
      })

      const { access_token, role } = response.data
      
      // Store token
      localStorage.setItem('docs_access_token', access_token)
      setToken(access_token)

      // Decode token to get user info
      const payload = JSON.parse(atob(access_token.split('.')[1]))
      setUser({
        id: payload.sub,
        email: email,
        role: role
      })

      // Generate or retrieve API key
      await fetchApiKey(access_token)

      return response.data
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  // Logout function
  const logout = () => {
    localStorage.removeItem('docs_access_token')
    localStorage.removeItem('docs_api_key')
    setToken(null)
    setUser(null)
    setApiKey(null)
  }

  // Fetch or generate API key
  const fetchApiKey = async (authToken = token) => {
    if (!authToken) return

    try {
      const response = await axios.get('/api/docs/api-key', {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      })

      const key = response.data.api_key
      localStorage.setItem('docs_api_key', key)
      setApiKey(key)
    } catch (error) {
      console.error('Failed to fetch API key:', error)
    }
  }

  // Regenerate API key
  const regenerateApiKey = async () => {
    if (!token) throw new Error('Not authenticated')

    try {
      const response = await axios.post('/api/docs/api-key/regenerate', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const key = response.data.api_key
      localStorage.setItem('docs_api_key', key)
      setApiKey(key)
      return key
    } catch (error) {
      console.error('Failed to regenerate API key:', error)
      throw error
    }
  }

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      if (token && isTokenValid()) {
        try {
          // Decode token to get user info
          const payload = JSON.parse(atob(token.split('.')[1]))
          setUser({
            id: payload.sub,
            role: payload.role
          })

          // Fetch API key if not present
          if (!apiKey) {
            await fetchApiKey(token)
          }
        } catch (error) {
          console.error('Failed to initialize auth:', error)
          logout()
        }
      } else {
        logout()
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const value = {
    user,
    token,
    apiKey,
    loading,
    isAuthenticated: !!token && !!user && isTokenValid(),
    login,
    logout,
    regenerateApiKey
  }

  return (
    <DocsAuthContext.Provider value={value}>
      {children}
    </DocsAuthContext.Provider>
  )
}


