import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Shield, CheckCircle, XCircle, User, Briefcase, TrendingUp,
  Users, Calendar, ArrowRight, Camera, Zap, Building2, Clock,
  BadgeCheck, FileText, Hash, AlertTriangle, Bell, CreditCard, DollarSign
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { getUserClaims, CompanyClaim } from '@/pages/CompanyClaimPage'

// ── Shared localStorage helpers (same keys as JobsPage/EventsPage) ──
function loadJobs() {
  try { return JSON.parse(localStorage.getItem('hirepath-jobs') || '[]') } catch { return [] }
}
function loadJobApplications() {
  try { return JSON.parse(localStorage.getItem('hirepath-job-applications') || '[]') } catch { return [] }
}
function loadEvents() {
  try { return JSON.parse(localStorage.getItem('hirepath-events') || '[]') } catch { return [] }
}
function loadEventAttendees() {
  try { return JSON.parse(localStorage.getItem('hirepath-event-attendees') || '[]') } catch { return [] }
}

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const faceVerified = user?.verificationStatus?.face
  const faceImage = user?.faceImage
  const companyClaims = user?.id ? getUserClaims(user.id) : []

  // ── Notifications: job applications to MY jobs + event registrations to MY events ──
  const myJobs = loadJobs().filter((j: any) => j.ownerId === user?.id)
  const myJobIds = myJobs.map((j: any) => j.id)
  const jobApps = loadJobApplications().filter((a: any) => myJobIds.includes(a.jobId))

  const myEvents = loadEvents().filter((e: any) => e.creatorId === user?.id)
  const myEventIds = myEvents.map((e: any) => e.id)
  const eventAttendees = loadEventAttendees().filter((a: any) => myEventIds.includes(a.eventId))

  // Build notifications list
  type Notification = { id: string; type: 'job_app' | 'event_reg' | 'event_pay'; name: string; detail: string; time: string; amount?: number }
  const notifications: Notification[] = []

  jobApps.forEach((a: any) => {
    const job = myJobs.find((j: any) => j.id === a.jobId)
    notifications.push({
      id: a.id,
      type: 'job_app',
      name: a.applicantName,
      detail: `Applied for "${job?.title || 'Unknown'}"`,
      time: a.appliedAt,
    })
  })

  eventAttendees.forEach((a: any) => {
    const evt = myEvents.find((e: any) => e.id === a.eventId)
    notifications.push({
      id: a.id,
      type: a.paymentStatus === 'paid' ? 'event_pay' : 'event_reg',
      name: a.userName,
      detail: a.paymentStatus === 'paid'
        ? `Paid for "${evt?.title || 'Event'}"`
        : `Registered for "${evt?.title || 'Event'}"`,
      time: a.registeredAt,
      amount: a.paymentStatus === 'paid' ? evt?.price : undefined,
    })
  })

  // Sort by most recent
  notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome Header */}
      <div className="nexus-card p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="relative flex-shrink-0">
            {faceImage ? (
              <div className="relative">
                <img src={faceImage} alt={user?.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2"
                  style={{ borderColor: faceVerified ? '#10B981' : '#333' }} />
                {faceVerified && (
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#10B981' }}>
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ) : (
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
                style={{ backgroundColor: 'var(--color-network)' }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              Welcome back, {user?.name || 'User'}
            </h1>
            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
            <div className="flex flex-wrap gap-2">
              {faceVerified ? (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
                  <Shield className="h-3 w-3" /> Face Verified
                </span>
              ) : (
                <Link to="/face-verification"
                  className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                  <XCircle className="h-3 w-3" /> Verify Face
                </Link>
              )}
              <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: 'rgba(59,111,216,0.1)', color: 'var(--color-network)' }}>
                <User className="h-3 w-3" /> {user?.role || 'Member'}
              </span>
              {companyClaims.some(c => c.status === 'verified') && (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }}>
                  <Building2 className="h-3 w-3" /> Company Owner
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Link to="/profile" className="nexus-btn nexus-btn-outline text-sm">View Profile</Link>
            <Link to="/feed" className="nexus-btn nexus-btn-primary text-sm">
              Go to Feed <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { icon: Users, label: 'Network', href: '/connections', color: '#3B6FD8', desc: 'Connect' },
          { icon: Briefcase, label: 'Jobs', href: '/jobs', color: '#10B981', desc: 'Opportunities' },
          { icon: Calendar, label: 'Events', href: '/events', color: '#F59E0B', desc: 'Attend' },
          { icon: TrendingUp, label: 'Business', href: '/opportunities', color: '#8B5CF6', desc: 'Deals' },
          { icon: Building2, label: 'Verify Company', href: '/company-claim', color: '#EC4899', desc: 'Upload docs' },
        ].map((item, i) => (
          <Link key={i} to={item.href}
            className="nexus-card p-4 transition-all hover:shadow-lg cursor-pointer">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
              style={{ backgroundColor: `${item.color}15` }}>
              <item.icon className="h-5 w-5" style={{ color: item.color }} />
            </div>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{item.label}</h3>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
          </Link>
        ))}
      </div>

      {/* ═══ NOTIFICATIONS: Job Applications + Event Payments ═══ */}
      {notifications.length > 0 && (
        <div className="nexus-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <div className="relative">
                <Bell className="h-5 w-5" style={{ color: '#F59E0B' }} />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ backgroundColor: '#EF4444' }}>{notifications.length > 99 ? '99+' : notifications.length}</span>
              </div>
              Notifications
            </h2>
            <div className="flex gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {jobApps.length} Applications</span>
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {eventAttendees.length} Registrations</span>
            </div>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {notifications.slice(0, 20).map(n => {
              const iconCfg = {
                job_app: { icon: Briefcase, color: '#3B6FD8', bg: 'rgba(59,111,216,0.1)', label: 'Job Application' },
                event_reg: { icon: Calendar, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', label: 'Free Registration' },
                event_pay: { icon: CreditCard, color: '#10B981', bg: 'rgba(16,185,129,0.1)', label: 'Payment Received' },
              }[n.type]
              return (
                <div key={n.id} className="flex items-center gap-4 p-3 rounded-xl transition-colors hover:bg-gray-900/50"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: iconCfg.bg }}>
                    <iconCfg.icon className="h-5 w-5" style={{ color: iconCfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      <strong>{n.name}</strong>{' '}
                      <span style={{ color: 'var(--text-secondary)' }}>{n.detail}</span>
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: '#666' }}>{new Date(n.time).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {n.amount !== undefined && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold"
                        style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
                        + ₹{n.amount}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider"
                      style={{ backgroundColor: iconCfg.bg, color: iconCfg.color }}>{iconCfg.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Company Ownership Claims */}
      <div className="nexus-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Building2 className="h-5 w-5" /> Company Ownership Claims
          </h2>
          <Link to="/company-claim" className="nexus-btn nexus-btn-primary text-xs">+ New Claim</Link>
        </div>
        {companyClaims.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'rgba(236,72,153,0.1)' }}>
              <Building2 className="h-8 w-8" style={{ color: '#EC4899' }} />
            </div>
            <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No Company Claims</h3>
            <p className="text-sm mb-4 max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Upload your official documents to verify company ownership.
            </p>
            <Link to="/company-claim" className="nexus-btn nexus-btn-primary text-sm">
              <Building2 className="h-4 w-4 mr-2" /> Verify Company
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {companyClaims.map((claim) => (
              <ClaimCard key={claim.id} claim={claim} />
            ))}
          </div>
        )}
      </div>

      {/* Verification + Account Info */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="nexus-card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Shield className="h-5 w-5" /> Verification Status
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="flex items-center gap-3">
                <Camera className="h-5 w-5" style={{ color: faceVerified ? '#10B981' : '#666' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Face Verification</span>
              </div>
              {faceVerified ?
                <CheckCircle className="h-5 w-5" style={{ color: '#10B981' }} /> :
                <Link to="/face-verification" className="text-xs font-medium px-3 py-1 rounded-full"
                  style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>Verify</Link>}
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5" style={{ color: '#10B981' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Email Verified</span>
              </div>
              <CheckCircle className="h-5 w-5" style={{ color: '#10B981' }} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5" style={{ color: companyClaims.some(c => c.status === 'verified') ? '#10B981' : '#666' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Company Owner</span>
              </div>
              {companyClaims.some(c => c.status === 'verified') ?
                <CheckCircle className="h-5 w-5" style={{ color: '#10B981' }} /> :
                <Link to="/company-claim" className="text-xs font-medium px-3 py-1 rounded-full"
                  style={{ backgroundColor: 'rgba(236,72,153,0.1)', color: '#EC4899' }}>Verify</Link>}
            </div>
          </div>
        </div>
        <div className="nexus-card p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Account Information</h2>
          <div className="space-y-3">
            {[
              { label: 'User ID', value: user?.id },
              { label: 'Email', value: user?.email },
              { label: 'Name', value: user?.name },
              { label: 'Role', value: user?.role },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                <span className="text-sm font-medium capitalize" style={{ color: 'var(--text-primary)' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const ClaimCard: React.FC<{ claim: CompanyClaim }> = ({ claim }) => {
  const cfg = {
    pending: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', icon: Clock, label: 'Pending' },
    verified: { color: '#10B981', bg: 'rgba(16,185,129,0.1)', icon: BadgeCheck, label: 'Verified' },
    rejected: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', icon: XCircle, label: 'Rejected' },
  }[claim.status]
  const checksPass = Object.values(claim.checks).filter(Boolean).length
  const checksTotal = Object.values(claim.checks).length

  return (
    <div className="p-5 rounded-xl border" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#3B6FD8,#8B5CF6)' }}>
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{claim.companyName}</h3>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {new Date(claim.submittedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
          style={{ backgroundColor: cfg.bg, color: cfg.color }}>
          <cfg.icon className="h-3.5 w-3.5" /> {cfg.label}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        {[
          { l: 'CIN', v: claim.cin }, { l: 'GST', v: claim.gst },
          { l: 'PAN', v: claim.pan }, { l: 'UDYAM', v: claim.udyam },
        ].filter(f => f.v).map((f, i) => (
          <div key={i} className="text-xs">
            <span style={{ color: 'var(--text-secondary)' }}>{f.l}: </span>
            <span className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>{f.v}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="h-full rounded-full" style={{
            width: `${(checksPass / checksTotal) * 100}%`,
            backgroundColor: checksPass === checksTotal ? '#10B981' : '#F59E0B',
          }} />
        </div>
        <span className="text-xs font-medium" style={{ color: checksPass === checksTotal ? '#10B981' : '#F59E0B' }}>
          {checksPass}/{checksTotal}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {Object.entries(claim.checks).map(([key, val]) => (
          <span key={key} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
            style={{ backgroundColor: val ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: val ? '#10B981' : '#EF4444' }}>
            {val ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            {{ faceVerified: 'Face', documentsUploaded: 'Docs', registryVerified: 'Registry' }[key] || key}
          </span>
        ))}
      </div>
    </div>
  )
}

export default DashboardPage