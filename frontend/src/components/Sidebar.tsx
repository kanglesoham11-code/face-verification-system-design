import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  Users, 
  Briefcase, 
  Calendar, 
  Target, 
  Settings, 
  User,
  Menu,
  X,
  Rss
} from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Feed', href: '/feed', icon: Rss },
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Connections', href: '/connections', icon: Users },
  { name: 'Jobs', href: '/jobs', icon: Briefcase },
  { name: 'Events', href: '/events', icon: Calendar },
  { name: 'Opportunities', href: '/opportunities', icon: Target },
  { name: 'Settings', href: '/settings', icon: Settings },
]

const Sidebar: React.FC = () => {
  const location = useLocation()
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  const { user } = useAuthStore()

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 z-50 h-full bg-white border-r border-secondary-200 transition-all duration-300 flex flex-col",
        sidebarOpen ? "w-64" : "w-16"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-secondary-200">
          {sidebarOpen && (
            <Link to="/dashboard" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-secondary-900">SyncUp</h1>
              </div>
            </Link>
          )}
          
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-secondary-100 transition-colors"
          >
            {sidebarOpen ? (
              <X className="h-5 w-5 text-secondary-600" />
            ) : (
              <Menu className="h-5 w-5 text-secondary-600" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-100 text-primary-700"
                    : "text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900"
                )}
                title={!sidebarOpen ? item.name : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User Profile */}
        {sidebarOpen && user && (
          <div className="p-4 border-t border-secondary-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-secondary-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-secondary-500 truncate">
                  {user.email}
                </p>
              </div>
            </div>
            
            {/* Verification Status */}
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-secondary-600">Email</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium",
                  user.verificationStatus.email
                    ? "bg-success-100 text-success-800"
                    : "bg-warning-100 text-warning-800"
                )}>
                  {user.verificationStatus.email ? 'Verified' : 'Pending'}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-secondary-600">Face ID</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium",
                  user.verificationStatus.face
                    ? "bg-success-100 text-success-800"
                    : "bg-warning-100 text-warning-800"
                )}>
                  {user.verificationStatus.face ? 'Verified' : 'Pending'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default Sidebar