import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

// Import Nexus styles
import '@/styles/nexus.css'

// Layout Components
import Layout from '@/components/Layout'
import AuthLayout from '@/components/AuthLayout'

// Auth Pages
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage'
import FaceVerificationPage from '@/pages/auth/FaceVerificationPage'

// Main Pages
import DashboardPage from '@/pages/DashboardPage'
import ProfilePage from '@/pages/ProfilePage'
import FeedPage from '@/pages/FeedPage'
import ConnectionsPage from '@/pages/ConnectionsPage'
import JobsPage from '@/pages/JobsPage'
import EventsPage from '@/pages/EventsPage'
import OpportunitiesPage from '@/pages/OpportunitiesPage'
import ServicesPage from '@/pages/ServicesPage'
import CompaniesPage from '@/pages/CompaniesPage'
import SettingsPage from '@/pages/SettingsPage'
import CompanyClaimPage from '@/pages/CompanyClaimPage'

// Protected Route — requires authentication (face OR email)
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore()
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/face-verification" replace />
  }
  
  return <>{children}</>
}

function App() {
  const { setLoading } = useAuthStore()

  useEffect(() => {
    setLoading(false)
  }, [])

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Routes>
        {/* Face Verification — ENTRY POINT */}
        <Route path="/face-verification" element={
          <AuthLayout>
            <FaceVerificationPage />
          </AuthLayout>
        } />

        {/* Legacy auth routes → face verification */}
        <Route path="/login" element={<Navigate to="/face-verification" replace />} />
        <Route path="/register" element={<Navigate to="/face-verification" replace />} />
        
        <Route path="/verify-email" element={
          <AuthLayout><VerifyEmailPage /></AuthLayout>
        } />

        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute><Layout><Navigate to="/dashboard" replace /></Layout></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
        <Route path="/feed" element={<ProtectedRoute><Layout><FeedPage /></Layout></ProtectedRoute>} />
        <Route path="/profile/:userId?" element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>} />
        <Route path="/connections" element={<ProtectedRoute><Layout><ConnectionsPage /></Layout></ProtectedRoute>} />
        <Route path="/jobs" element={<ProtectedRoute><Layout><JobsPage /></Layout></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute><Layout><EventsPage /></Layout></ProtectedRoute>} />
        <Route path="/opportunities" element={<ProtectedRoute><Layout><OpportunitiesPage /></Layout></ProtectedRoute>} />
        <Route path="/services" element={<ProtectedRoute><Layout><ServicesPage /></Layout></ProtectedRoute>} />
        <Route path="/companies" element={<ProtectedRoute><Layout><CompaniesPage /></Layout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Layout><SettingsPage /></Layout></ProtectedRoute>} />
        <Route path="/company-claim" element={<ProtectedRoute><Layout><CompanyClaimPage /></Layout></ProtectedRoute>} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/face-verification" replace />} />
      </Routes>
    </div>
  )
}

export default App