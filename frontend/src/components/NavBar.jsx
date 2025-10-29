import React from 'react'
import { Link } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthProvider'

export default function NavBar(){
  const { user, logout } = useContext(AuthContext)
  return (
    <nav className="bg-white shadow p-4 flex justify-between">
      <div className="flex gap-4">
        <Link to="/" className="font-bold">WholeHealth</Link>
        <Link to="/services">Services</Link>
        <Link to="/contact">Contact</Link>
      </div>
      <div>
        {user ? (
          <div className="flex items-center gap-4">
            <Link to="/dashboard">Dashboard</Link>
            <button onClick={logout} className="px-3 py-1 rounded bg-red-500 text-white">Logout</button>
          </div>
        ) : (
          <Link to="/login" className="px-3 py-1 rounded bg-blue-600 text-white">Login</Link>
        )}
      </div>
    </nav>
  )
}
