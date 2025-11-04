import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Copy, ChevronDown } from 'lucide-react'
import MarkdownRenderer from '../components/MarkdownRenderer'

// Map of all documentation files
const DOCS = {
  // Getting Started
  'getting-started': { title: 'Getting Started', file: 'START_HERE.md' },
  
  // JWT Authentication (5 files)
  'jwt-guide': { title: 'JWT Authentication Guide', file: 'JWT_AUTHENTICATION_GUIDE.md' },
  'jwt-quickref': { title: 'JWT Quick Reference', file: 'JWT_QUICK_REFERENCE.md' },
  'jwt-checklist': { title: 'JWT Verification Checklist', file: 'JWT_VERIFICATION_CHECKLIST.md' },
  'jwt-architecture': { title: 'JWT Architecture', file: 'JWT_ARCHITECTURE.md' },
  'jwt-summary': { title: 'JWT Implementation Summary', file: 'JWT_IMPLEMENTATION_SUMMARY.md' },
  
  // GPS Tracking (2 files)
  'gps-guide': { title: 'GPS Tracking Guide', file: 'GPS_TRACKING_GUIDE.md' },
  'gps-complete': { title: 'GPS Implementation', file: 'GPS_IMPLEMENTATION_COMPLETE.md' },
  
  // Registration (3 files)
  'registration': { title: 'Public Registration Endpoints', file: 'REGISTRATION_ENDPOINTS_PUBLIC.md' },
  'changes': { title: 'Changes Summary', file: 'CHANGES_SUMMARY.md' },
  'implementation': { title: 'Implementation Complete', file: 'IMPLEMENTATION_COMPLETE.md' },
  
  // CRUD & Database
  'crud-fix': { title: 'CRUD Update Fix', file: 'CRUD_UPDATE_FIX.md' },
  
  // Deployment & Summary (3 files)
  'deployment': { title: 'Deployment Guide', file: 'DEPLOYMENT_READY.md' },
  'summary': { title: 'Complete Implementation Summary', file: 'COMPLETE_IMPLEMENTATION_SUMMARY.md' },
  'readme': { title: 'Project README', file: 'README.md' },
}

export default function DocPage() {
  const { slug } = useParams()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const doc = DOCS[slug] || DOCS['getting-started']

  useEffect(() => {
    setLoading(true)
    setError(null)

    // Use base path for markdown files (works with /docs-website/ base)
    fetch(`/docs-website/docs/${doc.file}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load documentation')
        return res.text()
      })
      .then(text => {
        setContent(text)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [slug])

  if (loading) {
    return (
      <main className="flex-1 bg-dark-content overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-5/6 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex-1 bg-dark-content overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-8">
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Documentation</h2>
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 bg-dark-content overflow-y-auto">
      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="text-sm text-gray-400 mb-6">
          <span>API Reference</span>
          <span className="mx-2">&gt;</span>
          <span className="text-white">{doc.title}</span>
        </nav>

        {/* Page Title */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">{doc.title}</h1>
          <button 
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700/30 hover:bg-gray-700/50 rounded-lg transition-colors text-gray-300 hover:text-white"
          >
            <Copy size={16} />
            <span className="text-sm">Copy link</span>
            <ChevronDown size={14} />
          </button>
        </div>

        {/* Markdown Content */}
        <MarkdownRenderer content={content} />
      </div>
    </main>
  )
}

