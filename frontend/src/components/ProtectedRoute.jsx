import React from 'react'
import { Navigate } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthProvider'

export default function ProtectedRoute({ children, roles, privileges, disallowRoles }){
  const { user, token } = useContext(AuthContext)
  // Wait for user to hydrate from token to avoid false redirects
  if (token && !user) return null
  if (!user) return <Navigate to="/login" replace />
  const userRole = (user.role || '').toString().toLowerCase()
  if (disallowRoles && disallowRoles.length){
    const blocked = disallowRoles.map(r => r.toString().toLowerCase())
    if (blocked.includes(userRole)) return <div className="p-8">Unauthorized</div>
  }
  if (roles && roles.length){
    const userRole = (user.role || '').toString().toLowerCase()
    const allowed = roles.map(r => r.toString().toLowerCase())
    if (!allowed.includes(userRole)) return <div className="p-8">Unauthorized</div>
  }
  if (privileges && privileges.length){
    const have = Array.isArray(user.privileges) ? user.privileges.map((p)=> p.toString().toLowerCase()) : []
    const need = privileges.map((p)=> p.toString().toLowerCase())
    const ok = need.every((p)=> have.includes(p))
    if (!ok) return <div className="p-8">Unauthorized</div>
  }
  return children
}
