import React, { useState, useEffect } from 'react'
import {
  Briefcase, Search, MapPin, Clock, Filter, Plus, Building2, Users,
  CheckCircle, XCircle, ChevronDown, ChevronUp, DollarSign, Loader2,
  BadgeCheck, Send, Eye, Trash2, Shield, ArrowRight, X, Globe, User
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { getUserClaims } from '@/pages/CompanyClaimPage'
import { generateAvatar } from '@/lib/utils'
import toast from 'react-hot-toast'

// ── Types ────────────────────────────────────────────────────────────────────
interface Job {
  id: string
  ownerId: string
  ownerName: string
  companyName: string
  title: string
  description: string
  type: 'Full-Time' | 'Part-Time' | 'Contract' | 'Internship'
  workMode: 'Remote' | 'On-site' | 'Hybrid'
  location: string
  salary: string
  skills: string[]
  createdAt: string
  status: 'active' | 'closed'
}

interface JobApplication {
  id: string
  jobId: string
  applicantId: string
  applicantName: string
  applicantEmail: string
  applicantFaceImage?: string
  coverLetter: string
  appliedAt: string
  status: 'applied' | 'reviewing' | 'shortlisted' | 'rejected'
}

// ── Persistent Storage (shared across all users via localStorage) ────────────
function loadJobs(): Job[] {
  try { return JSON.parse(localStorage.getItem('hirepath-jobs') || '[]') } catch { return [] }
}
function saveJobs(jobs: Job[]) {
  localStorage.setItem('hirepath-jobs', JSON.stringify(jobs))
}
function loadApplications(): JobApplication[] {
  try { return JSON.parse(localStorage.getItem('hirepath-job-applications') || '[]') } catch { return [] }
}
function saveApplications(apps: JobApplication[]) {
  localStorage.setItem('hirepath-job-applications', JSON.stringify(apps))
}

// ═══════════════════════════════════════════════════════════════════════════════
const JobsPage: React.FC = () => {
  const { user } = useAuthStore()
  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [tab, setTab] = useState<'browse' | 'my-jobs' | 'applicants'>('browse')
  const [showPostForm, setShowPostForm] = useState(false)
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null)

  // Check if user is verified company owner
  const companyClaims = user?.id ? getUserClaims(user.id) : []
  const verifiedClaims = companyClaims.filter(c => c.status === 'verified')
  const isVerifiedOwner = verifiedClaims.length > 0

  // Post form state
  const [jobTitle, setJobTitle] = useState('')
  const [jobDesc, setJobDesc] = useState('')
  const [jobCompany, setJobCompany] = useState('')
  const [jobType, setJobType] = useState<Job['type']>('Full-Time')
  const [jobWorkMode, setJobWorkMode] = useState<Job['workMode']>('Remote')
  const [jobLocation, setJobLocation] = useState('')
  const [jobSalary, setJobSalary] = useState('')
  const [jobSkills, setJobSkills] = useState('')

  useEffect(() => {
    setJobs(loadJobs())
    setApplications(loadApplications())
  }, [])

  // ── Post Job ─────────────────────────────────────────────────────────
  const handlePostJob = () => {
    if (!jobTitle.trim() || !jobDesc.trim() || !jobCompany) {
      toast.error('Fill in all required fields')
      return
    }
    const newJob: Job = {
      id: `job-${Date.now()}`,
      ownerId: user!.id,
      ownerName: user!.name,
      companyName: jobCompany,
      title: jobTitle.trim(),
      description: jobDesc.trim(),
      type: jobType,
      workMode: jobWorkMode,
      location: jobLocation.trim() || 'India',
      salary: jobSalary.trim(),
      skills: jobSkills.split(',').map(s => s.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
      status: 'active',
    }
    const updated = [newJob, ...jobs]
    setJobs(updated)
    saveJobs(updated)
    setShowPostForm(false)
    setJobTitle(''); setJobDesc(''); setJobType('Full-Time'); setJobWorkMode('Remote')
    setJobLocation(''); setJobSalary(''); setJobSkills('')
    toast.success('Job posted successfully!')
  }

  // ── Apply to Job ─────────────────────────────────────────────────────
  const handleApply = (jobId: string) => {
    if (!user) return
    const existing = applications.find(a => a.jobId === jobId && a.applicantId === user.id)
    if (existing) { toast.error('You already applied to this job'); return }

    const app: JobApplication = {
      id: `app-${Date.now()}`,
      jobId,
      applicantId: user.id,
      applicantName: user.name,
      applicantEmail: user.email,
      applicantFaceImage: user.faceImage,
      coverLetter: coverLetter.trim(),
      appliedAt: new Date().toISOString(),
      status: 'applied',
    }
    const updated = [...applications, app]
    setApplications(updated)
    saveApplications(updated)
    setApplyingJobId(null)
    setCoverLetter('')
    toast.success('Application submitted!')
  }

  // ── Update application status ────────────────────────────────────────
  const updateAppStatus = (appId: string, status: JobApplication['status']) => {
    const updated = applications.map(a => a.id === appId ? { ...a, status } : a)
    setApplications(updated)
    saveApplications(updated)
    toast.success(`Application ${status}`)
  }

  // ── Delete Job ───────────────────────────────────────────────────────
  const deleteJob = (jobId: string) => {
    const updated = jobs.filter(j => j.id !== jobId)
    setJobs(updated)
    saveJobs(updated)
    const updatedApps = applications.filter(a => a.jobId !== jobId)
    setApplications(updatedApps)
    saveApplications(updatedApps)
    toast.success('Job deleted')
  }

  const filteredJobs = jobs.filter(j =>
    j.status === 'active' && (
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  )

  const myJobs = jobs.filter(j => j.ownerId === user?.id)
  const hasApplied = (jobId: string) => applications.some(a => a.jobId === jobId && a.applicantId === user?.id)

  const tabs = [
    { key: 'browse', label: 'Browse Jobs', icon: Search, count: filteredJobs.length },
    ...(isVerifiedOwner ? [
      { key: 'my-jobs', label: 'My Job Posts', icon: Briefcase, count: myJobs.length },
      { key: 'applicants', label: 'Applicants', icon: Users, count: applications.filter(a => myJobs.some(j => j.id === a.jobId)).length },
    ] : []),
  ] as const

  // ═════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="nexus-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              Job Board
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Discover opportunities from verified companies on Hirex
            </p>
          </div>
          {isVerifiedOwner && (
            <button onClick={() => { setShowPostForm(!showPostForm); setTab('browse') }}
              className="nexus-btn flex items-center gap-2 text-sm font-medium px-5 py-2.5"
              style={{
                background: showPostForm ? 'rgba(239,68,68,0.1)' : 'linear-gradient(135deg,#10B981,#059669)',
                color: showPostForm ? '#EF4444' : '#fff',
                border: showPostForm ? '1px solid rgba(239,68,68,0.3)' : 'none',
                borderRadius: '12px',
              }}>
              {showPostForm ? <><X className="h-4 w-4" /> Close</> : <><Plus className="h-4 w-4" /> Post a Job</>}
            </button>
          )}
        </div>

        {/* Search */}
        <div className="flex gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#888' }} />
            <input type="text" placeholder="Search jobs by title, company, skill..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="nexus-input w-full pl-10 pr-4 py-2.5 text-sm" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
              style={{
                backgroundColor: tab === t.key ? 'rgba(16,185,129,0.15)' : 'transparent',
                color: tab === t.key ? '#10B981' : 'var(--text-secondary)',
                border: tab === t.key ? '1px solid rgba(16,185,129,0.3)' : '1px solid transparent',
              }}>
              <t.icon className="h-4 w-4" />
              {t.label}
              {t.count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: tab === t.key ? 'rgba(16,185,129,0.2)' : '#333', color: tab === t.key ? '#10B981' : '#888' }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Post Job Form (Owner Only) ═══ */}
      {showPostForm && isVerifiedOwner && (
        <div className="nexus-card p-6 space-y-4" style={{ border: '1px solid rgba(16,185,129,0.2)' }}>
          <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <BadgeCheck className="h-5 w-5" style={{ color: '#10B981' }} /> Post a New Job
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company dropdown */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Company *</label>
              <select value={jobCompany} onChange={e => setJobCompany(e.target.value)}
                className="nexus-input w-full py-2.5 text-sm" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                <option value="">Select your company</option>
                {verifiedClaims.map(c => (
                  <option key={c.id} value={c.companyName}>{c.companyName}</option>
                ))}
              </select>
            </div>
            {/* Job Title */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Job Title *</label>
              <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                placeholder="e.g. Senior React Developer" className="nexus-input w-full py-2.5 text-sm" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Description *</label>
            <textarea value={jobDesc} onChange={e => setJobDesc(e.target.value)}
              placeholder="Full job description, requirements, responsibilities..."
              className="nexus-input w-full py-2.5 text-sm min-h-[120px]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Type</label>
              <select value={jobType} onChange={e => setJobType(e.target.value as Job['type'])}
                className="nexus-input w-full py-2.5 text-sm" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                {['Full-Time', 'Part-Time', 'Contract', 'Internship'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Work Mode</label>
              <select value={jobWorkMode} onChange={e => setJobWorkMode(e.target.value as Job['workMode'])}
                className="nexus-input w-full py-2.5 text-sm" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                {['Remote', 'On-site', 'Hybrid'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Location</label>
              <input type="text" value={jobLocation} onChange={e => setJobLocation(e.target.value)}
                placeholder="e.g. Pune, Maharashtra" className="nexus-input w-full py-2.5 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Annual Salary (₹)</label>
              <input type="text" value={jobSalary} onChange={e => setJobSalary(e.target.value)}
                placeholder="e.g. 12,00,000" className="nexus-input w-full py-2.5 text-sm" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Skills (comma-separated)</label>
            <input type="text" value={jobSkills} onChange={e => setJobSkills(e.target.value)}
              placeholder="React, Node.js, TypeScript, MongoDB" className="nexus-input w-full py-2.5 text-sm" />
          </div>

          <div className="flex justify-end pt-2">
            <button onClick={handlePostJob}
              className="nexus-btn flex items-center gap-2 text-sm font-semibold px-6 py-3"
              style={{ background: 'linear-gradient(135deg,#10B981,#059669)', color: '#fff', borderRadius: '12px', border: 'none' }}>
              <Send className="h-4 w-4" /> Publish Job
            </button>
          </div>
        </div>
      )}

      {/* ═══ Browse Jobs Tab ═══ */}
      {tab === 'browse' && (
        filteredJobs.length === 0 ? (
          <div className="nexus-card p-16 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'rgba(16,185,129,0.1)' }}>
              <Briefcase className="h-8 w-8" style={{ color: '#10B981' }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              {searchQuery ? 'No Jobs Found' : 'No Jobs Yet'}
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {searchQuery ? 'Try different keywords' : isVerifiedOwner ? 'Post the first job for your company!' : 'Job listings will appear when verified companies post opportunities.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map(job => {
              const appCount = applications.filter(a => a.jobId === job.id).length
              const alreadyApplied = hasApplied(job.id)
              const isOwner = job.ownerId === user?.id
              const isExpanded = expandedJobId === job.id

              return (
                <div key={job.id} className="nexus-card overflow-hidden transition-all hover:shadow-lg">
                  <div className="p-5">
                    {/* Job Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg,#3B6FD8,#8B5CF6)' }}>
                          <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{job.title}</h3>
                          <p className="text-sm flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                            <Building2 className="h-3.5 w-3.5" /> {job.companyName}
                            <span className="mx-1">•</span>
                            <MapPin className="h-3.5 w-3.5" /> {job.location}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                              style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10B981' }}>{job.type}</span>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                              style={{ backgroundColor: 'rgba(59,111,216,0.1)', color: '#3B6FD8' }}>{job.workMode}</span>
                            {job.salary && (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                                style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>
                                ₹ {job.salary}
                              </span>
                            )}
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                              style={{ backgroundColor: '#222', color: '#888' }}>
                              <Clock className="h-3 w-3 inline mr-0.5" />
                              {new Date(job.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                        className="p-2 rounded-lg transition-colors hover:bg-gray-800">
                        {isExpanded ? <ChevronUp className="h-5 w-5" style={{ color: '#888' }} /> :
                          <ChevronDown className="h-5 w-5" style={{ color: '#888' }} />}
                      </button>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t space-y-3" style={{ borderColor: 'var(--border-default)' }}>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                          {job.description}
                        </p>
                        {job.skills.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>REQUIRED SKILLS</p>
                            <div className="flex flex-wrap gap-1.5">
                              {job.skills.map((s, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium"
                                  style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }}>{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          Posted by <strong>{job.ownerName}</strong> • {appCount} applicant{appCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t" style={{ borderColor: 'var(--border-default)' }}>
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <Users className="h-3.5 w-3.5 inline mr-1" />{appCount} applicant{appCount !== 1 ? 's' : ''}
                      </span>
                      <div className="flex gap-2">
                        {isOwner ? (
                          <button onClick={() => deleteJob(job.id)}
                            className="nexus-btn text-xs px-3 py-1.5 flex items-center gap-1"
                            style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px' }}>
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        ) : alreadyApplied ? (
                          <span className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-medium"
                            style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}>
                            <CheckCircle className="h-4 w-4" /> Applied
                          </span>
                        ) : (
                          <button onClick={() => { setApplyingJobId(job.id); setExpandedJobId(job.id) }}
                            className="nexus-btn flex items-center gap-1.5 text-xs font-medium px-4 py-2"
                            style={{ background: 'linear-gradient(135deg,#3B6FD8,#8B5CF6)', color: '#fff', border: 'none', borderRadius: '10px' }}>
                            <Send className="h-3.5 w-3.5" /> Apply Now
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Apply Modal */}
                    {applyingJobId === job.id && !alreadyApplied && !isOwner && (
                      <div className="mt-4 p-4 rounded-xl space-y-3" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(59,111,216,0.2)' }}>
                        <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Apply to {job.title}</h4>
                        <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
                          {user?.faceImage ? (
                            <img src={user.faceImage} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: 'var(--color-network)' }}>{user?.name?.charAt(0)}</div>
                          )}
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
                          </div>
                        </div>
                        <textarea value={coverLetter} onChange={e => setCoverLetter(e.target.value)}
                          placeholder="Why are you a great fit for this role? (optional)"
                          className="nexus-input w-full text-sm min-h-[80px]" />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setApplyingJobId(null)} className="nexus-btn nexus-btn-outline text-xs">Cancel</button>
                          <button onClick={() => handleApply(job.id)}
                            className="nexus-btn text-xs px-4 py-2"
                            style={{ background: 'linear-gradient(135deg,#3B6FD8,#8B5CF6)', color: '#fff', border: 'none', borderRadius: '10px' }}>
                            <Send className="h-3.5 w-3.5 inline mr-1" /> Submit Application
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* ═══ My Jobs Tab (Owner) ═══ */}
      {tab === 'my-jobs' && isVerifiedOwner && (
        myJobs.length === 0 ? (
          <div className="nexus-card p-12 text-center">
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No Jobs Posted</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Post your first job to start hiring!</p>
            <button onClick={() => { setShowPostForm(true); setTab('browse') }}
              className="nexus-btn nexus-btn-primary text-sm"><Plus className="h-4 w-4 mr-1" /> Post a Job</button>
          </div>
        ) : (
          <div className="space-y-4">
            {myJobs.map(job => {
              const jobApps = applications.filter(a => a.jobId === job.id)
              return (
                <div key={job.id} className="nexus-card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{job.title}</h3>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {job.companyName} • {job.type} • {job.workMode} • Posted {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
                        {jobApps.length} applicant{jobApps.length !== 1 ? 's' : ''}
                      </span>
                      <button onClick={() => deleteJob(job.id)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-gray-800">
                        <Trash2 className="h-4 w-4" style={{ color: '#EF4444' }} />
                      </button>
                    </div>
                  </div>
                  {job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {job.skills.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded text-[10px] font-medium"
                          style={{ backgroundColor: '#222', color: '#888' }}>{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}

      {/* ═══ Applicants Tab (Owner Dashboard) ═══ */}
      {tab === 'applicants' && isVerifiedOwner && (
        <div className="space-y-4">
          {myJobs.map(job => {
            const jobApps = applications.filter(a => a.jobId === job.id)
            if (jobApps.length === 0) return null
            return (
              <div key={job.id} className="nexus-card overflow-hidden">
                <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-default)' }}>
                  <div>
                    <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{job.title}</h3>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{job.companyName} • {jobApps.length} applicant{jobApps.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
                  {jobApps.map(app => {
                    const avatar = generateAvatar(app.applicantName)
                    const statusColors: Record<string, { bg: string; color: string }> = {
                      applied: { bg: 'rgba(59,111,216,0.1)', color: '#3B6FD8' },
                      reviewing: { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B' },
                      shortlisted: { bg: 'rgba(16,185,129,0.1)', color: '#10B981' },
                      rejected: { bg: 'rgba(239,68,68,0.1)', color: '#EF4444' },
                    }
                    const sc = statusColors[app.status]
                    return (
                      <div key={app.id} className="p-4 flex items-center gap-4">
                        {app.applicantFaceImage ? (
                          <img src={app.applicantFaceImage} alt="" className="w-12 h-12 rounded-xl object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: 'var(--color-network)' }}>{avatar.initials}</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{app.applicantName}</p>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{app.applicantEmail}</p>
                          {app.coverLetter && (
                            <p className="text-xs mt-1 italic line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                              "{app.coverLetter}"
                            </p>
                          )}
                          <p className="text-[10px] mt-1" style={{ color: '#666' }}>
                            Applied {new Date(app.appliedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize"
                            style={{ backgroundColor: sc.bg, color: sc.color }}>{app.status}</span>
                          {app.status === 'applied' && (
                            <div className="flex gap-1">
                              <button onClick={() => updateAppStatus(app.id, 'shortlisted')}
                                className="p-1.5 rounded-lg" style={{ backgroundColor: 'rgba(16,185,129,0.1)' }} title="Shortlist">
                                <CheckCircle className="h-4 w-4" style={{ color: '#10B981' }} />
                              </button>
                              <button onClick={() => updateAppStatus(app.id, 'rejected')}
                                className="p-1.5 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }} title="Reject">
                                <XCircle className="h-4 w-4" style={{ color: '#EF4444' }} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
          {applications.filter(a => myJobs.some(j => j.id === a.jobId)).length === 0 && (
            <div className="nexus-card p-12 text-center">
              <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No Applications Yet</h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Applicants will appear here when users apply to your jobs.</p>
            </div>
          )}
        </div>
      )}

      {/* Verified Owner Banner */}
      {!isVerifiedOwner && (
        <div className="nexus-card p-5 flex items-center gap-4" style={{ border: '1px solid rgba(139,92,246,0.2)' }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'rgba(139,92,246,0.1)' }}>
            <Shield className="h-6 w-6" style={{ color: '#8B5CF6' }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Want to post jobs?</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Verify your company ownership to unlock job posting. Upload your business documents.
            </p>
          </div>
          <a href="/company-claim"
            className="nexus-btn text-xs px-4 py-2 flex items-center gap-1"
            style={{ background: 'linear-gradient(135deg,#8B5CF6,#6366F1)', color: '#fff', border: 'none', borderRadius: '10px' }}>
            <BadgeCheck className="h-3.5 w-3.5" /> Verify Company
          </a>
        </div>
      )}
    </div>
  )
}

export default JobsPage