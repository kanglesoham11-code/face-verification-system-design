import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  MapPin, Briefcase, Calendar, Mail, Globe, Edit3,
  UserPlus, MessageSquare, MoreHorizontal, Shield,
  CheckCircle, XCircle, Camera, Trash2, AlertTriangle
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn, generateAvatar } from '@/lib/utils'
import toast from 'react-hot-toast'
import { removeUser } from '@/pages/auth/FaceVerificationPage'

const PYTHON_API = 'http://localhost:8000'

const ProfilePage: React.FC = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  
  const isOwnProfile = !userId || userId === user?.id
  const faceImage = user?.faceImage
  const faceVerified = user?.verificationStatus?.face

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const profile = {
    id: userId || user?.id || '1',
    name: isOwnProfile ? user?.name || 'John Doe' : 'Sarah Johnson',
    headline: 'Senior Software Engineer | Full-Stack Developer | Tech Lead',
    location: 'San Francisco, CA',
    email: isOwnProfile ? user?.email : 'sarah.johnson@example.com',
    phone: '+1 (555) 123-4567',
    website: 'https://sarahjohnson.dev',
    about: `Passionate software engineer with 8+ years of experience building scalable web applications. 
    
I specialize in React, Node.js, and cloud architecture. Currently leading a team of 5 developers at TechCorp, where we've increased system performance by 40% and reduced deployment time by 60%.

I'm passionate about mentoring junior developers and contributing to open-source projects. Always excited to connect with fellow professionals and explore new opportunities in the tech space.`,
    connectionStatus: isOwnProfile ? null : 'connected',
    mutualConnections: 23,
    totalConnections: 156,
    profileViews: 1240,
    experience: [
      { id: 1, title: 'Senior Software Engineer', company: 'TechCorp Inc.', location: 'San Francisco, CA', startDate: '2022-01', endDate: null, current: true, description: 'Leading a team of 5 developers building scalable web applications using React, Node.js, and AWS.' },
      { id: 2, title: 'Full-Stack Developer', company: 'StartupXYZ', location: 'Remote', startDate: '2020-03', endDate: '2021-12', current: false, description: 'Built the entire platform from scratch using modern web technologies.' },
    ],
    education: [
      { id: 1, school: 'Stanford University', degree: 'Master of Science', field: 'Computer Science', startDate: '2018', endDate: '2020' },
      { id: 2, school: 'UC Berkeley', degree: 'Bachelor of Science', field: 'Computer Engineering', startDate: '2014', endDate: '2018' },
    ],
    skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker', 'Kubernetes', 'PostgreSQL', 'MongoDB', 'GraphQL', 'REST APIs'],
  }

  const avatar = generateAvatar(profile.name)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
  }

  const calculateDuration = (startDate: string, endDate: string | null) => {
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : new Date()
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    if (years === 0) return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`
    if (remainingMonths === 0) return `${years} year${years !== 1 ? 's' : ''}`
    return `${years} yr${years !== 1 ? 's' : ''} ${remainingMonths} mo`
  }

  // ── Delete Profile Handler ─────────────────────────────────────────────────
  const handleDeleteProfile = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm')
      return
    }

    try {
      setIsDeleting(true)

      // 1. Delete face from Python backend (if stored)
      if (user?.id) {
        try {
          await fetch(`${PYTHON_API}/faces/${encodeURIComponent(user.id)}`, { method: 'DELETE' })
        } catch {
          // Face may not exist in Python DB — that's OK
        }
      }

      // 2. Remove user credentials from persistent DB
      if (user?.email) {
        removeUser(user.email)
      }

      // 3. Clear auth store and localStorage
      logout()
      localStorage.removeItem('auth-storage')
      localStorage.removeItem('hirepath-userdb')

      toast.success('Profile deleted successfully')
      
      // 3. Redirect to entry point
      setTimeout(() => navigate('/face-verification'), 500)
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete profile')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="card">
        <div className="relative">
          {/* Cover Image */}
          <div className="h-48 bg-gradient-to-r from-primary-600 to-primary-700 rounded-t-lg"></div>
          
          <div className="relative px-6 pb-6">
            {/* Profile Image */}
            <div className="absolute -top-16 left-6">
              {faceImage && isOwnProfile ? (
                <div className="relative">
                  <img src={faceImage} alt={profile.name}
                    className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-lg" />
                  {faceVerified && (
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center shadow-md"
                      style={{ backgroundColor: '#10B981' }}>
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
              ) : (
                <div className={cn("w-32 h-32 rounded-full border-4 border-white flex items-center justify-center text-white text-3xl font-bold shadow-lg", avatar.colorClass)}>
                  {avatar.initials}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-4 space-x-3">
              {isOwnProfile ? (
                <>
                  <button className="btn btn-outline btn-sm">
                    <Edit3 className="h-4 w-4 mr-2" /> Edit Profile
                  </button>
                  <button onClick={() => setShowDeleteModal(true)}
                    className="btn btn-sm" style={{ color: '#EF4444', borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.05)' }}>
                    <Trash2 className="h-4 w-4 mr-2" /> Delete Profile
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-primary btn-sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    {profile.connectionStatus === 'connected' ? 'Connected' : profile.connectionStatus === 'pending' ? 'Pending' : 'Connect'}
                  </button>
                  <button className="btn btn-outline btn-sm"><MessageSquare className="h-4 w-4 mr-2" /> Message</button>
                  <button className="btn btn-ghost btn-sm"><MoreHorizontal className="h-4 w-4" /></button>
                </>
              )}
            </div>

            {/* Profile Info */}
            <div className="mt-16">
              <div className="flex items-center space-x-2 mb-2">
                <h1 className="text-3xl font-bold text-secondary-900">{profile.name}</h1>
                {faceVerified && (
                  <div className="flex items-center space-x-1 bg-success-100 text-success-800 px-2 py-1 rounded-full">
                    <Shield className="h-4 w-4" />
                    <span className="text-xs font-medium">Verified</span>
                  </div>
                )}
              </div>
              <p className="text-lg text-secondary-700 mb-4">{profile.headline}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-secondary-600">
                <div className="flex items-center"><MapPin className="h-4 w-4 mr-1" />{profile.location}</div>
                <div className="flex items-center"><Mail className="h-4 w-4 mr-1" />{profile.email}</div>
                {profile.website && (
                  <div className="flex items-center"><Globe className="h-4 w-4 mr-1" />
                    <a href={profile.website} className="text-primary-600 hover:text-primary-700">Portfolio</a>
                  </div>
                )}
              </div>
              {!isOwnProfile && (
                <div className="mt-4 text-sm text-secondary-600">
                  {profile.mutualConnections} mutual connections • {profile.totalConnections} connections
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          <div className="card">
            <div className="card-header"><h2 className="text-xl font-semibold text-secondary-900">About</h2></div>
            <div className="card-content">
              <p className="text-secondary-700 whitespace-pre-line leading-relaxed">{profile.about}</p>
            </div>
          </div>

          {/* Experience */}
          <div className="card">
            <div className="card-header"><h2 className="text-xl font-semibold text-secondary-900">Experience</h2></div>
            <div className="card-content">
              <div className="space-y-6">
                {profile.experience.map((exp) => (
                  <div key={exp.id} className="flex space-x-4">
                    <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Briefcase className="h-6 w-6 text-secondary-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-secondary-900">{exp.title}</h3>
                      <p className="text-secondary-700">{exp.company}</p>
                      <p className="text-sm text-secondary-600 mb-2">
                        {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate!)} • {calculateDuration(exp.startDate, exp.endDate)}
                      </p>
                      <p className="text-sm text-secondary-600">{exp.location}</p>
                      {exp.description && <p className="text-secondary-700 mt-2">{exp.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Education */}
          <div className="card">
            <div className="card-header"><h2 className="text-xl font-semibold text-secondary-900">Education</h2></div>
            <div className="card-content">
              <div className="space-y-6">
                {profile.education.map((edu) => (
                  <div key={edu.id} className="flex space-x-4">
                    <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-6 w-6 text-secondary-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-secondary-900">{edu.school}</h3>
                      <p className="text-secondary-700">{edu.degree} in {edu.field}</p>
                      <p className="text-sm text-secondary-600">{edu.startDate} - {edu.endDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Face Verification Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-secondary-900 flex items-center">
                <Camera className="h-5 w-5 mr-2" /> Face Verification
              </h2>
            </div>
            <div className="card-content">
              {faceImage && isOwnProfile ? (
                <div className="text-center">
                  <div className="relative inline-block mb-3">
                    <img src={faceImage} alt="Verified face"
                      className="w-24 h-24 rounded-full object-cover border-3" style={{ borderColor: '#10B981' }} />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#10B981' }}>
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-success-600">Face Verified ✓</p>
                  <p className="text-xs text-secondary-500 mt-1">
                    Verified on {user?.verificationStatus?.faceVerifiedAt ?
                      new Date(user.verificationStatus.faceVerifiedAt).toLocaleDateString() : 'Today'}
                  </p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <XCircle className="h-8 w-8 text-secondary-400" />
                  </div>
                  <p className="text-sm text-secondary-600 mb-3">Face not verified</p>
                  <Link to="/face-verification" className="btn btn-primary btn-sm">Verify Now</Link>
                </div>
              )}
            </div>
          </div>

          {/* Skills */}
          <div className="card">
            <div className="card-header"><h2 className="text-lg font-semibold text-secondary-900">Skills</h2></div>
            <div className="card-content">
              <div className="flex flex-wrap gap-2">
                {profile.skills.map(skill => (
                  <span key={skill} className="badge badge-secondary">{skill}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Profile Stats */}
          {isOwnProfile && (
            <div className="card">
              <div className="card-header"><h2 className="text-lg font-semibold text-secondary-900">Profile Analytics</h2></div>
              <div className="card-content">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary-600">Profile views</span>
                    <span className="font-semibold text-secondary-900">{profile.profileViews}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary-600">Connections</span>
                    <span className="font-semibold text-secondary-900">{profile.totalConnections}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary-600">Completion</span>
                    <span className="font-semibold text-secondary-900">{user?.profileComplete}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Verification Status */}
          <div className="card">
            <div className="card-header"><h2 className="text-lg font-semibold text-secondary-900">Verification</h2></div>
            <div className="card-content">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  {user?.verificationStatus?.email ? <CheckCircle className="h-5 w-5 text-success-600" /> : <XCircle className="h-5 w-5 text-secondary-400" />}
                  <span className="text-sm text-secondary-700">Email verified</span>
                </div>
                <div className="flex items-center space-x-3">
                  {faceVerified ? <CheckCircle className="h-5 w-5 text-success-600" /> : <XCircle className="h-5 w-5 text-secondary-400" />}
                  <span className="text-sm text-secondary-700">Face verified</span>
                </div>
                <div className="flex items-center space-x-3">
                  {user?.verificationStatus?.identity ? <CheckCircle className="h-5 w-5 text-success-600" /> : <XCircle className="h-5 w-5 text-secondary-400" />}
                  <span className="text-sm text-secondary-700">Identity verified</span>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone - Delete Profile */}
          {isOwnProfile && (
            <div className="card" style={{ border: '1px solid rgba(239,68,68,0.3)' }}>
              <div className="card-header">
                <h2 className="text-lg font-semibold flex items-center" style={{ color: '#EF4444' }}>
                  <AlertTriangle className="h-5 w-5 mr-2" /> Danger Zone
                </h2>
              </div>
              <div className="card-content">
                <p className="text-sm text-secondary-600 mb-3">
                  Permanently delete your profile, face data, and all associated information. This action cannot be undone.
                </p>
                <button onClick={() => setShowDeleteModal(true)}
                  className="btn btn-sm w-full flex items-center justify-center gap-2"
                  style={{ color: '#fff', backgroundColor: '#EF4444', border: 'none' }}>
                  <Trash2 className="h-4 w-4" /> Delete My Profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Delete Confirmation Modal ═══ */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-primary)' }}>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
                <AlertTriangle className="h-8 w-8" style={{ color: '#EF4444' }} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Delete Profile?</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                This will permanently delete your account, face verification data, and all profile information. This cannot be undone.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Type <strong>DELETE</strong> to confirm
              </label>
              <input type="text" value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE here"
                className="w-full px-4 py-3 rounded-lg border text-sm"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: deleteConfirmText === 'DELETE' ? '#EF4444' : 'var(--border-primary)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setDeleteConfirmText('') }}
                className="flex-1 py-3 rounded-lg border text-sm font-medium"
                style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
                Cancel
              </button>
              <button onClick={handleDeleteProfile}
                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                className="flex-1 py-3 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2"
                style={{ backgroundColor: deleteConfirmText === 'DELETE' ? '#EF4444' : '#999', opacity: isDeleting ? 0.6 : 1, border: 'none' }}>
                {isDeleting ? (
                  <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Deleting...</>
                ) : (
                  <><Trash2 className="h-4 w-4" /> Delete Forever</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfilePage