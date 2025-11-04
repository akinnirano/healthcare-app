import React from 'react'
import { Navigate } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthProvider'

/**
 * ProtectedRoute component that requires JWT authentication
 * Features:
 * - Redirects to login if not authenticated
 * - Supports role-based access control
 * - Supports privilege-based access control
 * - Handles loading state during authentication check
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Protected content
 * @param {string[]} props.roles - Allowed roles (optional)
 * @param {string[]} props.privileges - Required privileges (optional)
 * @param {string[]} props.disallowRoles - Blocked roles (optional)
 */
export default function ProtectedRoute({ children, roles, privileges, disallowRoles }){
  const { user, token, loading, isAuthenticated } = useContext(AuthContext)
  
  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  // Wait for user to hydrate from token to avoid false redirects
  if (token && !user) return null
  
  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }
  
  // Check role-based restrictions
  const userRole = (user.role || '').toString().toLowerCase()
  
  if (disallowRoles && disallowRoles.length){
    const blocked = disallowRoles.map(r => r.toString().toLowerCase())
    if (blocked.includes(userRole)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="max-w-md p-8 bg-red-50 border border-red-200 rounded-lg">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-600">You do not have permission to access this page.</p>
          </div>
        </div>
      )
    }
  }
  
  if (roles && roles.length){
    const allowed = roles.map(r => r.toString().toLowerCase())
    if (!allowed.includes(userRole)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="max-w-md p-8 bg-red-50 border border-red-200 rounded-lg">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-600">
              Required role: {roles.join(' or ')}
            </p>
          </div>
        </div>
      )
    }
  }
  
  // Check privilege-based restrictions
  if (privileges && privileges.length){
    const have = Array.isArray(user.privileges) 
      ? user.privileges.map((p)=> p.toString().toLowerCase()) 
      : []
    const need = privileges.map((p)=> p.toString().toLowerCase())
    const missing = need.filter(p => !have.includes(p))
    
    if (missing.length > 0) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="max-w-md p-8 bg-red-50 border border-red-200 rounded-lg">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Insufficient Privileges</h2>
            <p className="text-red-600">
              Missing privileges: {missing.join(', ')}
            </p>
          </div>
        </div>
      )
    }
  }
  
  return children
}
