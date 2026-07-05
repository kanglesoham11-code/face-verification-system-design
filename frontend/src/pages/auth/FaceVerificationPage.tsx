import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Shield, CheckCircle, ArrowRight, Lock, 
  Mail, Eye, EyeOff, AlertCircle, Scan, UserPlus, LogIn, AlertTriangle
} from 'lucide-react'
import FaceVerification, { FaceMatchResult } from '@/components/FaceVerification'
import { useAuthStore, generateDemoToken } from '@/store/authStore'
import { connectionApi } from '@/lib/api'
import toast from 'react-hot-toast'

const PYTHON_API = 'http://localhost:8000'

// ── Persistent User Database (localStorage-backed) ───────────────────────────
// This survives page reloads, unlike a plain JS object.
type UserRecord = { name: string; email: string; password: string; userId: string }

function loadUserDB(): Record<string, UserRecord> {
  try {
    const raw = localStorage.getItem('hirepath-userdb')
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveUserDB(db: Record<string, UserRecord>) {
  localStorage.setItem('hirepath-userdb', JSON.stringify(db))
}

// Load on module init — always in sync
const userDB: Record<string, UserRecord> = loadUserDB()

// Helper to add a user and persist
function addUser(email: string, record: UserRecord) {
  userDB[email.toLowerCase()] = record
  saveUserDB(userDB)
}

// Helper to remove a user and persist
function removeUser(email: string) {
  delete userDB[email.toLowerCase()]
  saveUserDB(userDB)
}

// Export so ProfilePage can access it for deletion
export { userDB, removeUser }

type PageState =
  | 'face_scan'          // Step 1: MANDATORY face scan (always first)
  | 'existing_login'     // Step 2a: Face matched → enter password to login
  | 'new_register'       // Step 2b: New face → create account with email/password
  | 'success'            // Done

const FaceVerificationPage: React.FC = () => {
  const navigate = useNavigate()
  const { login, setFaceImage } = useAuthStore()

  const [pageState, setPageState] = useState<PageState>('face_scan')
  const [matchResult, setMatchResult] = useState<FaceMatchResult | null>(null)
  const [snapshot, setSnapshot] = useState('')
  const [captureBlob, setCaptureBlob] = useState<Blob | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Form fields
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formError, setFormError] = useState('')

  // ── Handle face scan result ────────────────────────────────────────────────
  const handleScanResult = (result: {
    livenessPassed: boolean
    matchResult: FaceMatchResult | null
    snapshot: string
    captureBlob: Blob
  }) => {
    setSnapshot(result.snapshot)
    setCaptureBlob(result.captureBlob)

    if (!result.livenessPassed) {
      toast.error('Liveness check failed. Try again.')
      return
    }

    const match = result.matchResult

    if (match === null) {
      // No faces in DB → definitely new user
      setPageState('new_register')
    } else if (match.matched && match.confidence >= 80) {
      // Face already registered → must login with password
      setMatchResult(match)
      // Pre-fill email if we know it
      const existingUser = Object.values(userDB).find(u => u.userId === match.name)
      if (existingUser) setFormEmail(existingUser.email)
      setPageState('existing_login')
    } else {
      // No strong match → new user
      setPageState('new_register')
    }
  }

  // ── Login with password (face already confirmed) ───────────────────────────
  const handleLogin = async () => {
    setFormError('')
    if (!formEmail.trim() || !formEmail.includes('@')) { setFormError('Enter your email address'); return }
    if (!formPassword) { setFormError('Enter your password'); return }

    try {
      setIsProcessing(true)
      const existing = userDB[formEmail.trim().toLowerCase()]

      if (!existing) {
        setFormError('No account found with this email.')
        return
      }
      if (existing.password !== formPassword) {
        setFormError('Incorrect password.')
        return
      }
      // Verify that the face matches this account
      if (matchResult?.name && existing.userId !== matchResult.name) {
        setFormError('This email does not match the scanned face. Please try again.')
        return
      }

      login(
        {
          id: existing.userId,
          email: existing.email,
          name: existing.name,
          role: 'user',
          verificationStatus: { email: true, face: true, faceVerifiedAt: new Date(), identity: false },
          profileComplete: 100,
          faceImage: snapshot,
        },
        generateDemoToken(existing.userId, existing.email, 'user')
      )
      setFaceImage(snapshot)
      // Register user in backend network registry
      connectionApi.registerUser({ id: existing.userId, name: existing.name, email: existing.email, role: 'user', faceImage: snapshot, verificationStatus: { email: true, face: true, faceVerifiedAt: new Date(), identity: false } }).catch(() => {})
      toast.success(`Welcome back, ${existing.name}!`)
      setPageState('success')
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch (err: any) {
      toast.error(err.message || 'Login failed')
    } finally {
      setIsProcessing(false)
    }
  }

  // ── Register new account (face already captured) ───────────────────────────
  const handleRegister = async () => {
    setFormError('')
    if (!formName.trim()) { setFormError('Name is required'); return }
    if (!formEmail.trim() || !formEmail.includes('@')) { setFormError('Valid email is required'); return }
    if (formPassword.length < 6) { setFormError('Password must be at least 6 characters'); return }
    if (!captureBlob) { toast.error('Face capture missing. Scan again.'); setPageState('face_scan'); return }

    try {
      setIsProcessing(true)

      // Final duplicate check with strict threshold
      const checkFd = new FormData()
      checkFd.append('file', captureBlob, 'face.jpg')
      try {
        const checkRes = await fetch(`${PYTHON_API}/verify?threshold=0.45`, { method: 'POST', body: checkFd })
        if (checkRes.ok) {
          const checkData = await checkRes.json()
          if (checkData.matched && checkData.confidence >= 75) {
            toast.error(`This face is already registered. Please login instead.`)
            setMatchResult(checkData)
            const existingUser = Object.values(userDB).find(u => u.userId === checkData.name)
            if (existingUser) setFormEmail(existingUser.email)
            setPageState('existing_login')
            return
          }
        }
      } catch { /* No faces stored — fine */ }

      // Check if email already exists with a DIFFERENT face
      const existingByEmail = userDB[formEmail.trim().toLowerCase()]
      let userId: string

      if (existingByEmail) {
        // Email exists — but we ALREADY confirmed the face is new (Python DB didn't match).
        // This means the old face data was cleared/deleted. Allow re-registration
        // by reusing the existing userId and overwriting with new face.
        userId = existingByEmail.userId
      } else {
        userId = `user-${Date.now()}`
      }

      // Store face in Python backend
      const storeFd = new FormData()
      storeFd.append('file', captureBlob, 'face.jpg')
      const storeRes = await fetch(`${PYTHON_API}/store?name=${encodeURIComponent(userId)}`, { method: 'POST', body: storeFd })
      if (!storeRes.ok) {
        const errData = await storeRes.json()
        throw new Error(errData.detail || 'Failed to store face')
      }

      // Store/update credentials persistently (localStorage)
      addUser(formEmail.trim(), {
        name: formName.trim(),
        email: formEmail.trim(),
        password: formPassword,
        userId,
      })

      login(
        {
          id: userId,
          email: formEmail.trim(),
          name: formName.trim(),
          role: 'user',
          verificationStatus: { email: true, face: true, faceVerifiedAt: new Date(), identity: false },
          profileComplete: 100,
          faceImage: snapshot,
        },
        generateDemoToken(userId, formEmail.trim(), 'user')
      )
      setFaceImage(snapshot)
      // Register user in backend network registry
      connectionApi.registerUser({ id: userId, name: formName.trim(), email: formEmail.trim(), role: 'user', faceImage: snapshot, verificationStatus: { email: true, face: true, faceVerifiedAt: new Date(), identity: false } }).catch(() => {})
      toast.success('Account created with face verification!')
      setPageState('success')
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch (err: any) {
      toast.error(err.message || 'Registration failed')
    } finally {
      setIsProcessing(false)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER: Success
  // ═══════════════════════════════════════════════════════════════════════════
  if (pageState === 'success') {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: 'rgba(16,185,129,0.1)' }}>
            <CheckCircle className="h-10 w-10" style={{ color: '#10B981' }} />
          </div>
          <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Welcome!</h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Redirecting to dashboard...</p>
          {snapshot && (
            <div className="flex justify-center mb-6">
              <div className="relative">
                <img src={snapshot} alt="Verified" className="w-32 h-32 rounded-full object-cover border-4" style={{ borderColor: '#10B981' }} />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#10B981' }}>
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          )}
          <button onClick={() => navigate('/dashboard')} className="nexus-btn nexus-btn-primary mt-4">
            Continue to Dashboard <ArrowRight className="h-5 w-5 ml-2" />
          </button>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER: Step 2a — Face matched → Login with password
  // ═══════════════════════════════════════════════════════════════════════════
  if (pageState === 'existing_login' && matchResult) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Face Recognized!
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Step 1 ✓ Face verified • <strong>Step 2: Enter your password to login</strong>
          </p>
        </div>

        {/* Face confirmation */}
        <div className="flex justify-center">
          <div className="flex items-center gap-4 p-4 rounded-xl" style={{ backgroundColor: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}>
            {snapshot && (
              <div className="relative">
                <img src={snapshot} alt="Your face" className="w-20 h-20 rounded-full object-cover border-3" style={{ borderColor: '#10B981' }} />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#10B981' }}>
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              </div>
            )}
            <div>
              <p className="text-sm font-medium" style={{ color: '#10B981' }}>✓ Face Verified</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Confidence: {matchResult.confidence}%
              </p>
            </div>
          </div>
        </div>

        {/* Login form */}
        <div className="nexus-card p-6 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <LogIn className="h-5 w-5" /> Sign In to Your Account
          </h3>

          {formError && (
            <div className="p-3 rounded-lg text-sm flex items-start gap-2" style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#DC2626', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" /> {formError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#888' }} />
              <input type="email" value={formEmail} onChange={e => { setFormEmail(e.target.value); setFormError('') }}
                placeholder="you@gmail.com"
                className="w-full pl-10 pr-4 py-3 rounded-lg border text-sm"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)', outline: 'none' }} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#888' }} />
              <input type={showPassword ? 'text' : 'password'} value={formPassword}
                onChange={e => { setFormPassword(e.target.value); setFormError('') }}
                placeholder="Enter your password"
                className="w-full pl-10 pr-12 py-3 rounded-lg border text-sm"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)', outline: 'none' }} />
              <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#888' }}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button onClick={handleLogin} disabled={isProcessing || !formEmail.trim() || !formPassword}
            className="nexus-btn w-full h-14 flex items-center justify-center gap-3 text-base font-semibold"
            style={{ background: 'linear-gradient(135deg,#10B981,#059669)', color: '#fff', borderRadius: '12px', border: 'none', opacity: (isProcessing || !formEmail.trim() || !formPassword) ? 0.5 : 1 }}>
            {isProcessing ? (
              <span className="flex items-center gap-2"><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Signing In...</span>
            ) : (<><LogIn className="h-5 w-5" /> Sign In</>)}
          </button>
        </div>

        <div className="text-center space-y-2">
          <button onClick={() => { setFormError(''); setPageState('new_register') }}
            className="text-sm underline" style={{ color: 'var(--color-network)' }}>
            Not your account? Create a new one instead
          </button>
          <br />
          <button onClick={() => { setFormError(''); setFormPassword(''); setPageState('face_scan') }}
            className="text-sm underline" style={{ color: 'var(--text-secondary)' }}>
            ← Scan face again
          </button>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER: Step 2b — New face → Create account
  // ═══════════════════════════════════════════════════════════════════════════
  if (pageState === 'new_register') {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            New Face Detected
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Step 1 ✓ Face verified • <strong>Step 2: Create your account</strong>
          </p>
        </div>

        {/* Face confirmation */}
        <div className="flex justify-center">
          <div className="flex items-center gap-4 p-4 rounded-xl" style={{ backgroundColor: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}>
            {snapshot && (
              <div className="relative">
                <img src={snapshot} alt="Your face" className="w-20 h-20 rounded-full object-cover border-3" style={{ borderColor: '#10B981' }} />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#10B981' }}>
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              </div>
            )}
            <div>
              <p className="text-sm font-medium" style={{ color: '#10B981' }}>✓ New Face — Liveness Passed</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Anti-spoof verified</p>
            </div>
          </div>
        </div>

        {/* Registration form */}
        <div className="nexus-card p-6 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <UserPlus className="h-5 w-5" /> Create Your Account
          </h3>

          {formError && (
            <div className="p-3 rounded-lg text-sm flex items-start gap-2" style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#DC2626', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" /> {formError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Full Name *</label>
            <input type="text" value={formName} onChange={e => { setFormName(e.target.value); setFormError('') }}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 rounded-lg border text-sm"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)', outline: 'none' }} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Email Address *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#888' }} />
              <input type="email" value={formEmail} onChange={e => { setFormEmail(e.target.value); setFormError('') }}
                placeholder="you@gmail.com"
                className="w-full pl-10 pr-4 py-3 rounded-lg border text-sm"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)', outline: 'none' }} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Password *</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#888' }} />
              <input type={showPassword ? 'text' : 'password'} value={formPassword}
                onChange={e => { setFormPassword(e.target.value); setFormError('') }}
                placeholder="Min 6 characters"
                className="w-full pl-10 pr-12 py-3 rounded-lg border text-sm"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)', outline: 'none' }} />
              <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#888' }}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button onClick={handleRegister} disabled={isProcessing || !formName.trim() || !formEmail.trim() || formPassword.length < 6}
            className="nexus-btn w-full h-14 flex items-center justify-center gap-3 text-base font-semibold mt-2"
            style={{ background: 'linear-gradient(135deg,#10B981,#059669)', color: '#fff', borderRadius: '12px', border: 'none', opacity: (isProcessing || !formName.trim() || !formEmail.trim() || formPassword.length < 6) ? 0.5 : 1 }}>
            {isProcessing ? (
              <span className="flex items-center gap-2"><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Creating Account...</span>
            ) : (<><UserPlus className="h-5 w-5" /> Create Account</>)}
          </button>
        </div>

        <div className="text-center">
          <button onClick={() => { setFormError(''); setFormPassword(''); setPageState('face_scan') }}
            className="text-sm underline" style={{ color: 'var(--text-secondary)' }}>
            ← Scan face again
          </button>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER: Step 1 — MANDATORY Face Scan (always first)
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'linear-gradient(135deg, rgba(59,111,216,0.15), rgba(16,185,129,0.15))' }}>
          <Scan className="h-10 w-10" style={{ color: 'var(--color-network)' }} />
        </div>
        <h2 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Step 1: Face Verification
        </h2>
        <p className="mt-2 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Face scan is <strong>mandatory</strong> for all users. Complete all 4 checks to proceed.
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: 'rgba(59,111,216,0.1)', border: '2px solid var(--color-network)' }}>
          <Scan className="h-4 w-4" style={{ color: 'var(--color-network)' }} />
          <span className="text-sm font-bold" style={{ color: 'var(--color-network)' }}>1. Face Scan</span>
        </div>
        <div className="w-8 h-0.5" style={{ backgroundColor: '#333' }} />
        <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: 'rgba(107,114,128,0.1)', border: '2px solid #444' }}>
          <Lock className="h-4 w-4" style={{ color: '#888' }} />
          <span className="text-sm font-medium" style={{ color: '#888' }}>2. Login</span>
        </div>
      </div>

      {/* Camera + Liveness */}
      <div className="nexus-card p-6">
        <FaceVerification mode="scan" onVerificationResult={handleScanResult} />
      </div>

      {/* Security info */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Shield, color: '#10B981', label: 'Anti-Spoof AI', desc: 'Blocks photos & screens' },
          { icon: Lock, color: '#F59E0B', label: '1 Face = 1 Account', desc: 'Duplicate prevention' },
          { icon: Scan, color: '#3B6FD8', label: 'Multi-Frame', desc: '3-frame accuracy' },
        ].map((item, i) => (
          <div key={i} className="text-center p-3 rounded-lg" style={{ backgroundColor: `${item.color}08` }}>
            <item.icon className="h-5 w-5 mx-auto mb-1" style={{ color: item.color }} />
            <p className="text-xs font-bold" style={{ color: item.color }}>{item.label}</p>
            <p className="text-xs mt-0.5" style={{ color: '#666' }}>{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="nexus-card p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: '#F59E0B' }} />
          <div>
            <h4 className="text-sm font-medium mb-1" style={{ color: '#D97706' }}>Mandatory for All Users</h4>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Face verification cannot be skipped. After your face is verified, you will be asked to
              enter your email and password to login or create an account. Both steps are required.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FaceVerificationPage