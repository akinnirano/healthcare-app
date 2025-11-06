import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthProvider'
import FooterBlue from '../components/FooterBlue'

export default function Login(){
  const [identifier, setIdentifier] = useState('') // email or phone
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useContext(AuthContext)
  const nav = useNavigate()

  async function submit(e){
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const id = identifier.trim()
      const pwd = password
      const data = await login(id, pwd)
      const role = data?.role || (data?.access_token && JSON.parse(atob(data.access_token.split('.')[1])).role)
      const r = (role || '').toString().toLowerCase()
      if (r === 'patient') nav('/dashboard/track')
      else nav('/dashboard')
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Invalid credentials'
      setError(detail)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Full-width Banner (400px height) */}
      <div className="relative h-[400px] w-full overflow-hidden bg-gradient-to-r from-sky-50 to-cyan-50">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-sky-100 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-cyan-100 blur-3xl" />
        </div>
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900">Welcome back</h1>
            <p className="mt-3 text-sm sm:text-base text-gray-600">Sign in to manage staffing and care operations.</p>
          </div>
          <div className="hidden sm:block opacity-80">
            <HeroVector />
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-md mx-auto p-8">
        <h2 className="text-xl font-semibold mb-4">Login</h2>
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
          )}
          <input value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder="Email or Phone" className="w-full p-2 border rounded" />
          <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password" className="w-full p-2 border rounded" />
          <button disabled={loading} className="w-full p-2 rounded bg-blue-600 text-white disabled:opacity-60" type="submit">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>

      <FooterBlue />
    </div>
  )
}

function HeroVector(){
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="h-32 w-32">
      <defs>
        <linearGradient id="hero-grad-login" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e0f2fe"/>
          <stop offset="100%" stopColor="#bae6fd"/>
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="90" fill="url(#hero-grad-login)" />
      <rect x="70" y="70" width="60" height="60" rx="10" fill="#0ea5e9" opacity="0.2" />
      <path d="M100 60 L100 140 M60 100 L140 100" stroke="#0284c7" strokeWidth="8" strokeLinecap="round"/>
    </svg>
  )
}
