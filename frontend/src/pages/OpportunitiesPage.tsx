import React from 'react'
import { TrendingUp, Handshake } from 'lucide-react'

const OpportunitiesPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="nexus-card p-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Opportunities</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Explore business partnerships, investments, and collaborations
        </p>
      </div>

      <div className="nexus-card p-16 text-center">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: 'rgba(139,92,246,0.1)' }}>
          <TrendingUp className="h-10 w-10" style={{ color: '#8B5CF6' }} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          No Opportunities Yet
        </h2>
        <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Business opportunities and partnership proposals will appear here as they become available.
        </p>
      </div>
    </div>
  )
}

export default OpportunitiesPage