import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  Search, Bell, LogOut, User, Settings, ChevronDown,
  Zap, Menu, X, Shield
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const menuRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    logout()
    localStorage.removeItem('auth-storage')
    navigate('/face-verification')
  }

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Feed', href: '/feed' },
    { name: 'Network', href: '/connections' },
    { name: 'Jobs', href: '/jobs' },
    { name: 'Events', href: '/events' },
  ]

  const isActive = (href: string) => location.pathname === href

  return (
    <nav 
      className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{ 
        background: 'var(--bg-nav)', 
        borderColor: 'var(--border-default)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--color-network)' }}>
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                HirePath
              </h1>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ 
                  color: isActive(item.href) ? 'var(--text-primary)' : 'var(--text-secondary)',
                  backgroundColor: isActive(item.href) ? 'var(--bg-card-hover)' : 'transparent'
                }}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-sm mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="nexus-input w-full pl-10 pr-4 py-2 text-sm"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <button className="relative p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)' }}>
              <Bell className="h-5 w-5" />
            </button>

            {/* User Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                {/* Face photo or initial */}
                {user?.faceImage ? (
                  <img src={user.faceImage} alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border-2"
                    style={{ borderColor: user?.verificationStatus?.face ? '#10B981' : 'var(--border-default)' }} />
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: 'var(--color-network)' }}>
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {user?.name || 'User'}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
              </button>

              {/* Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl shadow-xl py-2 z-50"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
                  <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-default)' }}>
                    <div className="flex items-center gap-3">
                      {user?.faceImage ? (
                        <img src={user.faceImage} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                          style={{ backgroundColor: 'var(--color-network)' }}>
                          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
                      </div>
                    </div>
                    {user?.verificationStatus?.face && (
                      <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: '#10B981' }}>
                        <Shield className="h-3 w-3" /> Face Verified
                      </div>
                    )}
                  </div>

                  <div className="py-1">
                    <Link to="/profile" onClick={() => setShowUserMenu(false)}
                      className="flex items-center px-4 py-2.5 text-sm transition-colors hover:opacity-80"
                      style={{ color: 'var(--text-secondary)' }}>
                      <User className="h-4 w-4 mr-3" /> View Profile
                    </Link>
                    <Link to="/settings" onClick={() => setShowUserMenu(false)}
                      className="flex items-center px-4 py-2.5 text-sm transition-colors hover:opacity-80"
                      style={{ color: 'var(--text-secondary)' }}>
                      <Settings className="h-4 w-4 mr-3" /> Settings
                    </Link>
                  </div>

                  <div className="border-t py-1" style={{ borderColor: 'var(--border-default)' }}>
                    <button onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2.5 text-sm transition-colors hover:opacity-80"
                      style={{ color: '#EF4444' }}>
                      <LogOut className="h-4 w-4 mr-3" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 rounded-lg" style={{ color: 'var(--text-secondary)' }}>
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="lg:hidden border-t py-4" style={{ borderColor: 'var(--border-default)' }}>
            <div className="space-y-1 px-2">
              {navigation.map((item) => (
                <Link key={item.name} to={item.href}
                  className="block px-3 py-2 rounded-lg text-sm font-medium"
                  style={{ 
                    color: isActive(item.href) ? 'var(--text-primary)' : 'var(--text-secondary)',
                    backgroundColor: isActive(item.href) ? 'var(--bg-card-hover)' : 'transparent'
                  }}
                  onClick={() => setShowMobileMenu(false)}>
                  {item.name}
                </Link>
              ))}
              <button onClick={handleLogout}
                className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium"
                style={{ color: '#EF4444' }}>
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar