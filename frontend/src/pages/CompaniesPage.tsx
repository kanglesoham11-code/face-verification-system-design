import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  Users, 
  Building2,
  TrendingUp,
  Award,
  Plus,
  ArrowRight,
  ExternalLink
} from 'lucide-react'

const CompaniesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState('all')
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)

  // Mock data for companies
  const mockCompanies = [
    {
      id: '1',
      name: 'TechCorp Solutions',
      logo: 'TC',
      industry: 'Technology',
      description: 'Leading provider of enterprise software solutions and cloud infrastructure services.',
      location: 'San Francisco, CA',
      size: '1,000-5,000',
      founded: 2015,
      rating: 4.8,
      reviewCount: 234,
      website: 'https://techcorp.com',
      verified: true,
      hiring: true,
      culture: ['Innovation', 'Remote-First', 'Work-Life Balance'],
      recentNews: 'Raised $50M Series C funding'
    },
    {
      id: '2',
      name: 'Green Energy Innovations',
      logo: 'GE',
      industry: 'Energy',
      description: 'Pioneering sustainable energy solutions for a cleaner future.',
      location: 'Austin, TX',
      size: '500-1,000',
      founded: 2018,
      rating: 4.6,
      reviewCount: 89,
      website: 'https://greenenergy.com',
      verified: true,
      hiring: false,
      culture: ['Sustainability', 'Innovation', 'Impact-Driven'],
      recentNews: 'Launched new solar panel technology'
    },
    {
      id: '3',
      name: 'FinanceFlow',
      logo: 'FF',
      industry: 'Finance',
      description: 'Modern financial services platform revolutionizing personal banking.',
      location: 'New York, NY',
      size: '100-500',
      founded: 2020,
      rating: 4.9,
      reviewCount: 156,
      website: 'https://financeflow.com',
      verified: true,
      hiring: true,
      culture: ['Fast-Paced', 'Data-Driven', 'Customer-First'],
      recentNews: 'IPO filing announced'
    }
  ]

  const industries = [
    { id: 'all', name: 'All Industries', count: 1247 },
    { id: 'technology', name: 'Technology', count: 423 },
    { id: 'finance', name: 'Finance', count: 312 },
    { id: 'healthcare', name: 'Healthcare', count: 289 },
    { id: 'energy', name: 'Energy', count: 156 },
    { id: 'retail', name: 'Retail', count: 67 }
  ]

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setCompanies(mockCompanies as any)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredCompanies = companies.filter((company: any) => {
    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         company.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesIndustry = selectedIndustry === 'all' || 
                           company.industry.toLowerCase() === selectedIndustry
    return matchesSearch && matchesIndustry
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 
          className="text-4xl font-bold mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          Company Directory
        </h1>
        <p 
          className="text-xl max-w-2xl mx-auto"
          style={{ color: 'var(--text-secondary)' }}
        >
          Discover verified companies, read authentic reviews, and explore career opportunities
        </p>
      </div>

      {/* Search and Filters */}
      <div className="nexus-card p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                placeholder="Search companies, industries, or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="nexus-input pl-10 w-full"
              />
            </div>
          </div>

          {/* Industry Filter */}
          <div className="lg:w-64">
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="nexus-input w-full"
            >
              {industries.map((industry) => (
                <option key={industry.id} value={industry.id}>
                  {industry.name} ({industry.count})
                </option>
              ))}
            </select>
          </div>

          {/* Add Company Button */}
          <button className="nexus-btn nexus-btn-primary">
            <Plus className="h-4 w-4" />
            Add Company
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="text-center">
          <div 
            className="text-3xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            1M+
          </div>
          <div 
            className="text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            Verified Companies
          </div>
        </div>
        <div className="text-center">
          <div 
            className="text-3xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            500K+
          </div>
          <div 
            className="text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            Employee Reviews
          </div>
        </div>
        <div className="text-center">
          <div 
            className="text-3xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            4.2★
          </div>
          <div 
            className="text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            Average Rating
          </div>
        </div>
        <div className="text-center">
          <div 
            className="text-3xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            50K+
          </div>
          <div 
            className="text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            Open Positions
          </div>
        </div>
      </div>

      {/* Companies Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 
            className="text-2xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {selectedIndustry === 'all' ? 'All Companies' : industries.find(i => i.id === selectedIndustry)?.name}
          </h2>
          <div 
            className="text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            {filteredCompanies.length} companies found
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="nexus-card p-6 nexus-loading">
                <div className="h-4 bg-gray-300 rounded mb-4"></div>
                <div className="h-3 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company: any) => (
              <div key={company.id} className="nexus-card p-6 group cursor-pointer">
                {/* Company Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-lg font-bold"
                      style={{ backgroundColor: 'var(--color-companies)' }}
                    >
                      {company.logo}
                    </div>
                    <div>
                      <h3 
                        className="font-semibold group-hover:text-blue-400 transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {company.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {company.verified && (
                          <Award className="h-4 w-4 text-blue-400" />
                        )}
                        <span 
                          className="text-sm"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {company.industry}
                        </span>
                      </div>
                    </div>
                  </div>
                  {company.hiring && (
                    <span 
                      className="nexus-badge"
                      style={{ 
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        color: '#10B981'
                      }}
                    >
                      Hiring
                    </span>
                  )}
                </div>

                <p 
                  className="text-sm mb-4 line-clamp-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {company.description}
                </p>

                {/* Company Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2" style={{ color: 'var(--text-muted)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {company.location}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Users className="h-4 w-4 mr-2" style={{ color: 'var(--text-muted)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {company.size}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Building2 className="h-4 w-4 mr-2" style={{ color: 'var(--text-muted)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Founded {company.founded}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Star className="h-4 w-4 mr-2 text-yellow-400" />
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {company.rating} ({company.reviewCount})
                    </span>
                  </div>
                </div>

                {/* Culture Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {company.culture.slice(0, 2).map((tag: string) => (
                    <span 
                      key={tag}
                      className="px-2 py-1 rounded text-xs"
                      style={{ 
                        backgroundColor: 'var(--bg-input)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                  {company.culture.length > 2 && (
                    <span 
                      className="px-2 py-1 rounded text-xs"
                      style={{ 
                        backgroundColor: 'var(--bg-input)',
                        color: 'var(--text-muted)'
                      }}
                    >
                      +{company.culture.length - 2} more
                    </span>
                  )}
                </div>

                {/* Recent News */}
                {company.recentNews && (
                  <div 
                    className="text-xs mb-4 p-2 rounded"
                    style={{ 
                      backgroundColor: 'rgba(59, 111, 216, 0.1)',
                      color: 'var(--color-network)'
                    }}
                  >
                    <TrendingUp className="h-3 w-3 inline mr-1" />
                    {company.recentNews}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button className="nexus-btn nexus-btn-outline flex-1">
                    View Profile
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </button>
                  <button 
                    className="nexus-btn nexus-btn-outline p-2"
                    title="Visit Website"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Featured Companies Section */}
      <div>
        <h2 
          className="text-2xl font-bold mb-6"
          style={{ color: 'var(--text-primary)' }}
        >
          Featured Companies
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {companies.slice(0, 4).map((company: any) => (
            <div key={`featured-${company.id}`} className="nexus-card p-4 text-center">
              <div 
                className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-xl font-bold mx-auto mb-3"
                style={{ backgroundColor: 'var(--color-companies)' }}
              >
                {company.logo}
              </div>
              <h3 
                className="font-semibold mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                {company.name}
              </h3>
              <p 
                className="text-sm mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                {company.industry}
              </p>
              <div className="flex items-center justify-center text-sm">
                <Star className="h-4 w-4 mr-1 text-yellow-400" />
                <span style={{ color: 'var(--text-secondary)' }}>
                  {company.rating}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="nexus-card p-8 text-center">
        <h3 
          className="text-2xl font-bold mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          Is your company listed?
        </h3>
        <p 
          className="mb-6 max-w-2xl mx-auto"
          style={{ color: 'var(--text-secondary)' }}
        >
          Join thousands of companies on Nexus. Create your company profile, showcase your culture, and attract top talent.
        </p>
        <button className="nexus-btn nexus-btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Your Company
        </button>
      </div>
    </div>
  )
}

export default CompaniesPage