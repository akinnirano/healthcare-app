import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, ExternalLink, ChevronDown } from 'lucide-react'

export default function Header() {
  const [searchFocused, setSearchFocused] = useState(false)

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

        {/* Search */}
        <div className={`relative transition-all duration-200 ${searchFocused ? 'w-96' : 'w-80'}`}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search documentation..."
              className="w-full pl-10 pr-12 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/15"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 px-2 py-0.5 text-xs bg-white/20 rounded text-white">
              ⌘ K
            </kbd>
          </div>
        </div>
      </div>
    </header>
  )
}

