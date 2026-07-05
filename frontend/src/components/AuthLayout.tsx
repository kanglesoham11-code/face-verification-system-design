import React from 'react'
import { Link } from 'react-router-dom'
import { Users, Shield, Zap } from 'lucide-react'

interface AuthLayoutProps {
  children: React.ReactNode
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="flex min-h-screen">
        {/* Left Side - Branding */}
        <div 
          className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
          style={{ 
            background: 'linear-gradient(135deg, var(--color-network), var(--color-business))'
          }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div 
              className="absolute top-0 left-0 w-full h-full" 
              style={{ 
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)', 
                backgroundSize: '30px 30px' 
              }}
            />
          </div>
          
          <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
            {/* Logo */}
            <div className="mb-12">
              <Link to="/" className="flex items-center space-x-3">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-sm"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                >
                  <Zap className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Nexus</h1>
                  <p className="text-white/70 text-sm">Verified Professional Platform</p>
                </div>
              </Link>
            </div>

            {/* Features */}
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center backdrop-blur-sm"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                >
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Verified Identity</h3>
                  <p className="text-white/80 leading-relaxed">
                    Advanced biometric verification ensures every connection is with a real, verified professional.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center backdrop-blur-sm"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                >
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Trusted Network</h3>
                  <p className="text-white/80 leading-relaxed">
                    Connect with verified professionals, share opportunities, and build meaningful business relationships.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center backdrop-blur-sm"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                >
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">AI-Powered Matching</h3>
                  <p className="text-white/80 leading-relaxed">
                    Smart recommendations for connections, opportunities, and collaborations tailored to your goals.
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">2.1M+</div>
                <div className="text-white/70 text-sm">Verified Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">500K+</div>
                <div className="text-white/70 text-sm">Companies</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">99.9%</div>
                <div className="text-white/70 text-sm">Security Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div 
          className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12"
          style={{ background: 'var(--bg-primary)' }}
        >
          <div className="mx-auto w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-8 text-center">
              <Link to="/" className="inline-flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: 'var(--color-network)' }}
                >
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <h1 
                    className="text-xl font-bold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Nexus
                  </h1>
                  <p 
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Verified Professional Platform
                  </p>
                </div>
              </Link>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout