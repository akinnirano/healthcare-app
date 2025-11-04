import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import OnThisPage from './components/OnThisPage'
import DocPage from './pages/DocPage'

export default function App() {
  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />
      <div className="flex">
        <Sidebar />
        <Routes>
          <Route path="/" element={<Navigate to="/getting-started" replace />} />
          <Route path="/:slug" element={<DocPage />} />
        </Routes>
        <OnThisPage />
      </div>
    </div>
  )
}

