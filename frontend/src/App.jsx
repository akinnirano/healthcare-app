import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import PatientRegister from './pages/PatientRegister'
import PractitionerRegister from './pages/PractitionerRegister'
import Login from './pages/Login'
import Services from './pages/Services'
import Contact from './pages/Contact'
import Index from './pages/Index'
import AdminDashboard from './pages/Dashboard/AdminDashboard'
import UserManagementPage from './pages/Dashboard/UserManagementPage'
import RolesManagementPage from './pages/Dashboard/RolesManagementPage'
import PrivilegeManagementPage from './pages/Dashboard/PrivilegeManagementPage'
import VisitManagementPage from './pages/Dashboard/VisitManagementPage'
import AssignmentsPage from './pages/Dashboard/AssignmentsPage'
import FeedbackManagementPage from './pages/Dashboard/FeedbackManagementPage'
import ManageTimesheetPage from './pages/Dashboard/ManageTimesheetPage'
import ComplianceManagementPage from './pages/Dashboard/ComplianceManagementPage'
import Dashboard from './pages/dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import ApiReference from './pages/ApiReference'
import SpecificMapTracker from './components/SpecificMapTracker'
import AssignShiffs from './pages/Dashboard/AssignShiffs'
import Startshift from './pages/Dashboard/Startshift'
import EndShift from './pages/Dashboard/EndShift'

export default function App(){
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/services" element={<Services />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/index" element={<Index />} />
      <Route path="/register" element={<PatientRegister />} />
      <Route path="/patient/register" element={<PatientRegister />} />
      <Route path="/practitioner/register" element={<PractitionerRegister />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/dashboard/admin" element={<ProtectedRoute disallowRoles={["patient"]}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/users" element={<ProtectedRoute disallowRoles={["patient"]}><UserManagementPage /></ProtectedRoute>} />
      <Route path="/dashboard/user" element={<ProtectedRoute disallowRoles={["patient"]}><UserManagementPage /></ProtectedRoute>} />
      <Route path="/dashboard/roles" element={<ProtectedRoute disallowRoles={["patient"]}><RolesManagementPage /></ProtectedRoute>} />
      <Route path="/dashboard/privileges" element={<ProtectedRoute disallowRoles={["patient"]}><PrivilegeManagementPage /></ProtectedRoute>} />
      <Route path="/dashboard/visits" element={<ProtectedRoute disallowRoles={["patient"]}><VisitManagementPage /></ProtectedRoute>} />
      <Route path="/dashboard/assignments" element={<ProtectedRoute disallowRoles={["patient"]}><AssignmentsPage /></ProtectedRoute>} />
      <Route path="/dashboard/feedback" element={<ProtectedRoute><FeedbackManagementPage /></ProtectedRoute>} />
      <Route path="/dashboard/timesheets" element={<ProtectedRoute disallowRoles={["patient"]}><ManageTimesheetPage /></ProtectedRoute>} />
      <Route path="/dashboard/compliance" element={<ProtectedRoute disallowRoles={["patient"]}><ComplianceManagementPage /></ProtectedRoute>} />
      <Route path="/dashboard/track" element={<ProtectedRoute><SpecificMapTracker /></ProtectedRoute>} />
      <Route path="/dashboard/assignshiffs" element={<ProtectedRoute disallowRoles={["patient"]}><AssignShiffs /></ProtectedRoute>} />
      <Route path="/dashboard/startshift" element={<ProtectedRoute disallowRoles={["patient"]}><Startshift /></ProtectedRoute>} />
      <Route path="/dashboard/endshift" element={<ProtectedRoute disallowRoles={["patient"]}><EndShift /></ProtectedRoute>} />
      <Route path="/api" element={<ApiReference />} />
    </Routes>
  )
}

