import React, { useEffect, useRef } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import { useAuthStore } from '@/store/authStore'
import { connectionApi } from '@/lib/api'

interface LayoutProps {
  children?: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore()
  const hasRegistered = useRef(false)

  // Auto-register ALL users from the local user database into the backend registry
  // This ensures every signed-up user appears in the Network/Connections page
  useEffect(() => {
    if (isAuthenticated && user && !hasRegistered.current) {
      hasRegistered.current = true

      // 1. Register the current logged-in user
      connectionApi.registerUser({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        faceImage: user.faceImage,
        verificationStatus: user.verificationStatus,
      }).catch(() => {})

      // 2. Register ALL users from hirepath-userdb (localStorage)
      try {
        const raw = localStorage.getItem('hirepath-userdb')
        if (raw) {
          const userDB: Record<string, { name: string; email: string; userId: string }> = JSON.parse(raw)
          Object.values(userDB).forEach((u) => {
            // Don't re-register the current user (already done above)
            if (u.userId === user.id) return
            connectionApi.registerUser({
              id: u.userId,
              name: u.name,
              email: u.email,
              role: 'user',
            }).catch(() => {})
          })
        }
      } catch {}

      // 3. Also register the auth store user from hirepath-auth-storage
      try {
        const authRaw = localStorage.getItem('hirepath-auth-storage')
        if (authRaw) {
          const authData = JSON.parse(authRaw)
          const storedUser = authData?.state?.user
          if (storedUser && storedUser.id !== user.id) {
            connectionApi.registerUser({
              id: storedUser.id,
              name: storedUser.name,
              email: storedUser.email,
              role: storedUser.role || 'user',
              faceImage: storedUser.faceImage,
              verificationStatus: storedUser.verificationStatus,
            }).catch(() => {})
          }
        }
      } catch {}
    }
  }, [isAuthenticated, user])

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Navbar />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  )
}

export default Layout