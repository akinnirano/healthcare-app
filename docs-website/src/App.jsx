import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import OnThisPage from './components/OnThisPage'
import DocPage from './pages/DocPage'
import DocsLogin from './pages/DocsLogin'
import DocsRegister from './pages/DocsRegister'
import ApiKeyManagement from './pages/ApiKeyManagement'
import ProtectedRoute from './components/ProtectedRoute'
import { useDocsAuth } from './context/DocsAuthContext'

export default function App() {
  const { isAuthenticated } = useDocsAuth()

  return (
    <div className="min-h-screen bg-dark-bg">
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/getting-started" replace /> : <DocsLogin />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/getting-started" replace /> : <DocsRegister />} />
        
        {/* Protected documentation routes */}
        <Route path="/*" element={
          <ProtectedRoute>
            <div className="min-h-screen bg-dark-bg">
              <Header />
              <div className="flex">
                <Sidebar />
                <Routes>
                  <Route path="/" element={<Navigate to="/getting-started" replace />} />
                  <Route path="/api-key" element={<ApiKeyManagement />} />
                  <Route path="/:slug" element={<DocPage />} />
                </Routes>
                <OnThisPage />
              </div>
            </div>
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  )
}

