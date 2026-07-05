import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  Clock, 
  DollarSign,
  Briefcase,
  Users,
  Plus,
  ArrowRight
} from 'lucide-react'

const ServicesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  // Mock data for services
  const mockServices = [
    {
      id: '1',
      title: 'Full-Stack Web Development',
      description: 'Complete web application development using React, Node.js, and MongoDB',
      provider: {
        name: 'Alex Johnson',
        avatar: 'AJ',
        rating: 4.9,
        completedProjects: 127
      },
      category: 'Development',
      price: { min: 50, max: 150, type: 'hourly' },
      skills: ['React', 'Node.js', 'MongoDB', 'TypeScript'],
      location: 'Remote',
      responseTime: '< 2 hours',
      featured: true
    },
    {
      id: '2',
      title: 'UI/UX Design & Prototyping',
      description: 'Modern, user-centered design for web and mobile applications',
      provider: {
        name: 'Sarah Chen',
        avatar: 'SC',
        rating: 4.8,
        completedProjects: 89
      },
      category: 'Design',
      price: { min: 40, max: 100, type: 'hourly' },
      skills: ['Figma', 'Adobe XD', 'Sketch', 'Prototyping'],
      location: 'San Francisco, CA',
      responseTime: '< 4 hours',
      featured: false
    },
    {
      id: '3',
      title: 'Digital Marketing Strategy',
      description: 'Comprehensive digital marketing campaigns and social media management',
      provider: {
        name: 'Mike Rodriguez',
        avatar: 'MR',
        rating: 4.7,
        completedProjects: 156
      },
      category: 'Marketing',
      price: { min: 2000, max: 10000, type: 'project' },
      skills: ['SEO', 'Social Media', 'Google Ads', 'Analytics'],
      location: 'New York, NY',
      responseTime: '< 1 hour',
      featured: true
    }
  ]

  const categories = [
    { id: 'all', name: 'All Services', count: 1247 },
    { id: 'development', name: 'Development', count: 423 },
    { id: 'design', name: 'Design', count: 312 },
    { id: 'marketing', name: 'Marketing', count: 289 },
    { id: 'writing', name: 'Writing', count: 156 },
    { id: 'consulting', name: 'Consulting', count: 67 }
  ]

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setServices(mockServices as any)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredServices = services.filter((service: any) => {
    const matchesSearch = service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || 
                           service.category.toLowerCase() === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 
          className="text-4xl font-bold mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          Professional Services
        </h1>
        <p 
          className="text-xl max-w-2xl mx-auto"
          style={{ color: 'var(--text-secondary)' }}
        >
          Find expert freelancers and service providers for your projects
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
                placeholder="Search services, skills, or providers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="nexus-input pl-10 w-full"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="lg:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="nexus-input w-full"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.count})
                </option>
              ))}
            </select>
          </div>

          {/* Post Service Button */}
          <button className="nexus-btn nexus-btn-primary">
            <Plus className="h-4 w-4" />
            Post Service
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
            500K+
          </div>
          <div 
            className="text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            Active Services
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
            Service Providers
          </div>
        </div>
        <div className="text-center">
          <div 
            className="text-3xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            4.8★
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
            98%
          </div>
          <div 
            className="text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            Success Rate
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 
            className="text-2xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {selectedCategory === 'all' ? 'All Services' : categories.find(c => c.id === selectedCategory)?.name}
          </h2>
          <div 
            className="text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            {filteredServices.length} services found
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
            {filteredServices.map((service: any) => (
              <div key={service.id} className="nexus-card p-6 group cursor-pointer">
                {service.featured && (
                  <div className="flex items-center mb-3">
                    <span 
                      className="nexus-badge"
                      style={{ 
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        color: '#F59E0B'
                      }}
                    >
                      Featured
                    </span>
                  </div>
                )}

                <h3 
                  className="text-lg font-semibold mb-2 group-hover:text-blue-400 transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {service.title}
                </h3>

                <p 
                  className="text-sm mb-4 line-clamp-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {service.description}
                </p>

                {/* Provider Info */}
                <div className="flex items-center space-x-3 mb-4">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: 'var(--color-services)' }}
                  >
                    {service.provider.avatar}
                  </div>
                  <div>
                    <div 
                      className="font-medium text-sm"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {service.provider.name}
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      <div className="flex items-center">
                        <Star className="h-3 w-3 text-yellow-400 mr-1" />
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {service.provider.rating}
                        </span>
                      </div>
                      <span style={{ color: 'var(--text-muted)' }}>•</span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {service.provider.completedProjects} projects
                      </span>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {service.skills.slice(0, 3).map((skill: string) => (
                    <span 
                      key={skill}
                      className="px-2 py-1 rounded text-xs"
                      style={{ 
                        backgroundColor: 'var(--bg-input)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                  {service.skills.length > 3 && (
                    <span 
                      className="px-2 py-1 rounded text-xs"
                      style={{ 
                        backgroundColor: 'var(--bg-input)',
                        color: 'var(--text-muted)'
                      }}
                    >
                      +{service.skills.length - 3} more
                    </span>
                  )}
                </div>

                {/* Service Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" style={{ color: 'var(--text-muted)' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>
                        ${service.price.min}-${service.price.max}/{service.price.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" style={{ color: 'var(--text-muted)' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {service.location}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" style={{ color: 'var(--text-muted)' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>
                        Responds {service.responseTime}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button className="nexus-btn nexus-btn-outline w-full">
                  View Details
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Call to Action */}
      <div className="nexus-card p-8 text-center">
        <h3 
          className="text-2xl font-bold mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          Ready to offer your services?
        </h3>
        <p 
          className="mb-6 max-w-2xl mx-auto"
          style={{ color: 'var(--text-secondary)' }}
        >
          Join thousands of professionals earning on Nexus. Create your service listing and start connecting with clients today.
        </p>
        <button className="nexus-btn nexus-btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Create Service Listing
        </button>
      </div>
    </div>
  )
}

export default ServicesPage