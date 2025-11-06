import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'

const navigationItems = [
  {
    title: 'Getting Started',
    href: '/getting-started',
  },
  {
    title: 'API Key Management',
    href: '/api-key',
    highlight: true,
  },
  {
    title: 'JWT Authentication',
    href: '/jwt-guide',
    expandable: true,
    children: [
      { title: 'Complete Guide', href: '/jwt-guide' },
      { title: 'Quick Reference', href: '/jwt-quickref' },
      { title: 'Architecture', href: '/jwt-architecture' },
      { title: 'Verification Checklist', href: '/jwt-checklist' },
    ]
  },
  {
    title: 'GPS Tracking',
    href: '/gps-guide',
    expandable: true,
    children: [
      { title: 'Complete Guide', href: '/gps-guide' },
      { title: 'Implementation', href: '/gps-complete' },
    ]
  },
  {
    title: 'Registration',
    href: '/registration'
  },
  {
    title: 'CRUD Operations',
    href: '/crud-fix'
  },
  {
    title: 'Deployment',
    href: '/deployment'
  },
]

const coreResources = [
  { title: 'Complete Summary', href: '/summary' },
  { title: 'Project README', href: '/readme' },
  { title: 'Changes Summary', href: '/changes' },
  { title: 'Implementation Complete', href: '/implementation' },
  { title: 'API Reference (Swagger)', href: 'https://api.hremsoftconsulting.com/docs', external: true },
]

export default function Sidebar() {
  const location = useLocation()
  const [expandedSections, setExpandedSections] = useState({ 
    'JWT Authentication': true,
    'GPS Tracking': true 
  })

  const toggleSection = (title) => {
    setExpandedSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }))
  }

  const isActive = (href) => {
    return location.pathname === href || location.pathname === `/docs-website${href}`
  }

  return (
    <aside className="w-64 bg-dark-sidebar h-[calc(100vh-4rem)] overflow-y-auto border-r border-gray-700/50 sticky top-16">
      <nav className="p-4 space-y-1">
        {navigationItems.map((item) => {
          const active = isActive(item.href)
          
          return (
            <div key={item.title}>
              {item.expandable ? (
                <button
                  onClick={() => toggleSection(item.title)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-gray-300 hover:bg-gray-700/30 hover:text-white"
                >
                  <span className="text-sm font-medium">{item.title}</span>
                  {expandedSections[item.title] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              ) : (
                <Link
                  to={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    active
                      ? 'bg-teal-600/20 text-teal-400 border-l-4 border-teal-500'
                      : item.highlight
                      ? 'text-teal-400 hover:bg-teal-700/20 hover:text-teal-300'
                      : 'text-gray-300 hover:bg-gray-700/30 hover:text-white'
                  }`}
                >
                  <span className="text-sm font-medium">{item.title}</span>
                  {item.highlight && <span className="text-xs px-2 py-0.5 bg-teal-500/20 text-teal-400 rounded-full">NEW</span>}
                </Link>
              )}
              
              {item.children && expandedSections[item.title] && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.title}
                      to={child.href}
                      className={`block px-3 py-1.5 text-sm rounded transition-colors ${
                        isActive(child.href)
                          ? 'text-purple-400 bg-purple-600/10'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700/20'
                      }`}
                    >
                      {child.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        <div className="pt-6">
          <div className="border-t border-gray-700/50 pt-4">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Core Resources
            </h3>
            {coreResources.map((item) => (
              item.external ? (
                <a
                  key={item.title}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/30 hover:text-white rounded-lg transition-colors"
                >
                  <span>{item.title}</span>
                  <ExternalLink size={14} />
                </a>
              ) : (
                <Link
                  key={item.title}
                  to={item.href}
                  className="block px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/30 hover:text-white rounded-lg transition-colors"
                >
                  {item.title}
                </Link>
              )
            ))}
          </div>
        </div>
      </nav>
    </aside>
  )
}

