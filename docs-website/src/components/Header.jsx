import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ExternalLink, ChevronDown, Key, LogOut, User } from 'lucide-react'
import { useDocsAuth } from '../context/DocsAuthContext'

export default function Header() {
  const [searchFocused, setSearchFocused] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, logout } = useDocsAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-teal-600 border-b border-teal-700 sticky top-0 z-50">
      <div className="h-16 px-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-8">
          <Link to="/getting-started" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
              <span className="text-teal-600 font-bold text-lg">H</span>
            </div>
            <span className="text-white font-semibold text-lg">Healthcare API</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/getting-started" className="text-white hover:text-teal-100 transition-colors font-medium">
              API Reference
            </Link>
            <Link to="/deployment" className="text-white hover:text-teal-100 transition-colors">
              Guides
            </Link>
            <a href="https://api.hremsoftconsulting.com/docs" target="_blank" rel="noopener noreferrer" className="text-white hover:text-teal-100 transition-colors flex items-center space-x-1">
              <span>Swagger UI</span>
              <ExternalLink size={14} />
            </a>
          </nav>
        </div>

        {/* Right side - Search and User Menu */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className={`relative transition-all duration-200 ${searchFocused ? 'w-80' : 'w-64'}`}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search docs..."
                className="w-full pl-10 pr-12 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/15"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
              <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 px-2 py-0.5 text-xs bg-white/20 rounded text-white">
                ⌘ K
              </kbd>
            </div>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              onBlur={() => setTimeout(() => setUserMenuOpen(false), 200)}
              className="flex items-center space-x-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
            >
              <User size={18} />
              <span className="text-sm font-medium">{user?.email || 'User'}</span>
              <ChevronDown size={16} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-700">
                  <p className="text-sm text-white font-medium truncate">{user?.email}</p>
                  <p className="text-xs text-gray-400">{user?.role || 'User'}</p>
                </div>
                
                <Link
                  to="/api-key"
                  className="flex items-center space-x-2 px-4 py-2.5 text-gray-300 hover:bg-slate-700 hover:text-white transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Key size={16} />
                  <span className="text-sm">API Key</span>
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-4 py-2.5 text-red-400 hover:bg-slate-700 hover:text-red-300 transition-colors"
                >
                  <LogOut size={16} />
                  <span className="text-sm">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

