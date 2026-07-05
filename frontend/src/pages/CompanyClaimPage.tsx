import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, Upload, FileCheck, Shield, CheckCircle, AlertCircle,
  ArrowRight, ArrowLeft, Hash, FileText, Camera,
  Loader2, XCircle, BadgeCheck, Zap, Eye, ScanSearch
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

const PYTHON_API = 'http://localhost:8000'

// ── Types ────────────────────────────────────────────────────────────────────
export interface CompanyClaim {
  id: string
  userId: string
  status: 'pending' | 'verified' | 'rejected'
  submittedAt: string
  companyName: string
  cin: string
  gst: string
  pan: string
  udyam: string
  businessCert: string | null
  gstDoc: string | null
  companyIdDoc: string | null
  checks: {
    faceVerified: boolean
    documentsUploaded: boolean
    registryVerified: boolean
  }
  registryResult?: any
}

// ── Persistent Storage ───────────────────────────────────────────────────────
function loadClaims(): CompanyClaim[] {
  try { return JSON.parse(localStorage.getItem('hirepath-company-claims') || '[]') } catch { return [] }
}
function saveClaims(claims: CompanyClaim[]) {
  localStorage.setItem('hirepath-company-claims', JSON.stringify(claims))
}
export function getUserClaims(userId: string): CompanyClaim[] {
  return loadClaims().filter(c => c.userId === userId)
}
export function getAllClaims(): CompanyClaim[] { return loadClaims() }

// ── Steps ────────────────────────────────────────────────────────────────────
type Step = 'upload' | 'extracted' | 'verify' | 'submitted'

const CompanyClaimPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('upload')
  const [isExtracting, setIsExtracting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  // Documents (base64 for display, raw File for API)
  const [businessCertFile, setBusinessCertFile] = useState<File | null>(null)
  const [gstDocFile, setGstDocFile] = useState<File | null>(null)
  const [companyIdDocFile, setCompanyIdDocFile] = useState<File | null>(null)
  const [businessCert, setBusinessCert] = useState<string | null>(null)
  const [gstDoc, setGstDoc] = useState<string | null>(null)
  const [companyIdDoc, setCompanyIdDoc] = useState<string | null>(null)

  // Upload target
  const [uploadTarget, setUploadTarget] = useState<'businessCert' | 'gstDoc' | 'companyIdDoc' | null>(null)

  // Extracted data (auto-filled from PDFs)
  const [extractedData, setExtractedData] = useState<any>(null)
  const [companyName, setCompanyName] = useState('')
  const [cin, setCin] = useState('')
  const [gst, setGst] = useState('')
  const [pan, setPan] = useState('')
  const [udyam, setUdyam] = useState('')

  // Verification result
  const [verifyResult, setVerifyResult] = useState<any>(null)

  const faceVerified = user?.verificationStatus?.face || false
  const allDocsUploaded = !!(businessCertFile && gstDocFile && companyIdDocFile)

  // ── File Upload Handler ──────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { toast.error('File must be under 10MB'); return }
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      switch (uploadTarget) {
        case 'businessCert': setBusinessCert(base64); setBusinessCertFile(file); break
        case 'gstDoc': setGstDoc(base64); setGstDocFile(file); break
        case 'companyIdDoc': setCompanyIdDoc(base64); setCompanyIdDocFile(file); break
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const triggerUpload = (target: 'businessCert' | 'gstDoc' | 'companyIdDoc') => {
    setUploadTarget(target)
    fileInputRef.current?.click()
  }

  // ── Extract data from uploaded documents ────────────────────────────────
  const handleExtract = async () => {
    if (!businessCertFile || !gstDocFile || !companyIdDocFile) {
      toast.error('Upload all 3 documents first')
      return
    }
    try {
      setIsExtracting(true)
      const formData = new FormData()
      formData.append('business_cert', businessCertFile)
      formData.append('gst_cert', gstDocFile)
      formData.append('company_id', companyIdDocFile)

      const res = await fetch(`${PYTHON_API}/extract-documents`, { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Failed to extract document data')

      const data = await res.json()
      setExtractedData(data)

      // Auto-fill fields from extracted data
      const ext = data.extracted || {}
      setCompanyName(ext.companyName || '')
      setCin(ext.cin || '')
      setGst(ext.gst || '')
      setPan(ext.pan || '')
      setUdyam(ext.udyam || '')

      toast.success('Documents analyzed! Data extracted successfully.')
      setStep('extracted')
    } catch (err: any) {
      toast.error(err.message || 'Document extraction failed')
    } finally {
      setIsExtracting(false)
    }
  }

  // ── Verify documents against database ──────────────────────────────────
  const handleVerify = async () => {
    if (!businessCertFile || !gstDocFile || !companyIdDocFile) return
    try {
      setIsVerifying(true)
      const formData = new FormData()
      formData.append('business_cert', businessCertFile)
      formData.append('gst_cert', gstDocFile)
      formData.append('company_id', companyIdDocFile)

      const res = await fetch(`${PYTHON_API}/verify-documents`, { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Verification request failed')

      const result = await res.json()
      setVerifyResult(result)

      if (result.verified) {
        toast.success('All documents verified! Ownership confirmed.')
      } else {
        toast.error(result.message || 'Verification failed')
      }
      setStep('verify')
    } catch (err: any) {
      toast.error(err.message || 'Verification failed')
    } finally {
      setIsVerifying(false)
    }
  }

  // ── Submit claim ─────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!user || !verifyResult) return

    const claim: CompanyClaim = {
      id: `claim-${Date.now()}`,
      userId: user.id,
      status: verifyResult.verified ? 'verified' : 'rejected',
      submittedAt: new Date().toISOString(),
      companyName, cin, gst, pan, udyam,
      businessCert, gstDoc, companyIdDoc,
      checks: {
        faceVerified,
        documentsUploaded: allDocsUploaded,
        registryVerified: verifyResult.verified,
      },
      registryResult: verifyResult,
    }

    const existing = loadClaims()
    existing.push(claim)
    saveClaims(existing)

    setStep('submitted')
  }

  // Hidden file input
  const HiddenInput = (
    <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png"
      className="hidden" onChange={handleFileSelect} />
  )

  // ── Document Upload Card ────────────────────────────────────────────────
  const DocCard = ({ label, file, base64, target, icon }: {
    label: string; file: File | null; base64: string | null;
    target: 'businessCert' | 'gstDoc' | 'companyIdDoc'; icon: string
  }) => (
    <div className="p-5 rounded-xl border transition-all"
      style={{
        borderColor: file ? '#10B981' : 'var(--border-primary)',
        backgroundColor: file ? 'rgba(16,185,129,0.03)' : 'var(--bg-secondary)',
      }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: file ? 'rgba(16,185,129,0.1)' : 'rgba(59,111,216,0.1)' }}>
            {file ? <CheckCircle className="h-5 w-5" style={{ color: '#10B981' }} /> :
              <FileText className="h-5 w-5" style={{ color: 'var(--color-network)' }} />}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{label} *</p>
            {file ? (
              <p className="text-xs" style={{ color: '#10B981' }}>{file.name} ({(file.size / 1024).toFixed(0)}KB)</p>
            ) : (
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>PDF, JPG, or PNG — max 10MB</p>
            )}
          </div>
        </div>
        <button onClick={() => triggerUpload(target)}
          className="nexus-btn text-xs flex items-center gap-1.5 px-4 py-2"
          style={{
            backgroundColor: file ? 'rgba(16,185,129,0.1)' : 'rgba(59,111,216,0.1)',
            color: file ? '#10B981' : 'var(--color-network)',
            border: `1px solid ${file ? 'rgba(16,185,129,0.2)' : 'rgba(59,111,216,0.2)'}`,
            borderRadius: '10px',
          }}>
          {file ? <><CheckCircle className="h-3.5 w-3.5" /> Replace</> : <><Upload className="h-3.5 w-3.5" /> Upload</>}
        </button>
      </div>
    </div>
  )

  // ═════════════════════════════════════════════════════════════════════════
  //  RENDER: Submitted
  // ═════════════════════════════════════════════════════════════════════════
  if (step === 'submitted') {
    const isVerified = verifyResult?.verified
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="nexus-card p-12 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: isVerified ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
            {isVerified ?
              <BadgeCheck className="h-10 w-10" style={{ color: '#10B981' }} /> :
              <XCircle className="h-10 w-10" style={{ color: '#EF4444' }} />}
          </div>
          <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            {isVerified ? 'Ownership Verified!' : 'Verification Failed'}
          </h2>
          <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
            {isVerified
              ? `Your ownership of ${companyName} has been confirmed. All 3 documents matched the official registry.`
              : `Documents did not match the registry. ${verifyResult?.message || ''}`}
          </p>
          <button onClick={() => navigate('/dashboard')} className="nexus-btn nexus-btn-primary">
            Go to Dashboard <ArrowRight className="h-4 w-4 ml-2" />
          </button>
        </div>
      </div>
    )
  }

  // ═════════════════════════════════════════════════════════════════════════
  //  RENDER: Main
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {HiddenInput}

      {/* Header */}
      <div className="nexus-card p-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#3B6FD8,#8B5CF6)' }}>
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Company Ownership Verification
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Upload official documents → System extracts & auto-verifies
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          {[
            { key: 'upload', label: '1. Upload Documents', icon: Upload },
            { key: 'extracted', label: '2. Extracted Data', icon: ScanSearch },
            { key: 'verify', label: '3. Verification', icon: Shield },
          ].map((s, i) => {
            const steps: Step[] = ['upload', 'extracted', 'verify']
            const currentIdx = steps.indexOf(step)
            const isActive = step === s.key
            const isDone = steps.indexOf(s.key as Step) < currentIdx
            return (
              <React.Fragment key={s.key}>
                {i > 0 && <div className="flex-1 h-0.5" style={{ backgroundColor: isDone ? '#10B981' : '#333' }} />}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap"
                  style={{
                    backgroundColor: isActive ? 'rgba(59,111,216,0.15)' : isDone ? 'rgba(16,185,129,0.1)' : 'rgba(0,0,0,0.2)',
                    color: isActive ? 'var(--color-network)' : isDone ? '#10B981' : '#666',
                    border: isActive ? '1px solid var(--color-network)' : '1px solid transparent',
                  }}>
                  {isDone ? <CheckCircle className="h-3.5 w-3.5" /> : <s.icon className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Face verification warning */}
      {!faceVerified && (
        <div className="nexus-card p-5" style={{ border: '1px solid rgba(239,68,68,0.3)' }}>
          <div className="flex items-center gap-3">
            <Camera className="h-6 w-6" style={{ color: '#EF4444' }} />
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: '#EF4444' }}>Face Verification Required</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                You must verify your face before claiming company ownership.
              </p>
            </div>
            <button onClick={() => navigate('/face-verification')}
              className="nexus-btn text-sm" style={{ backgroundColor: '#EF4444', color: '#fff', border: 'none' }}>
              Verify Face
            </button>
          </div>
        </div>
      )}

      {/* ═══ Step 1: Upload Documents ═══ */}
      {step === 'upload' && (
        <div className="nexus-card p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Upload className="h-5 w-5" /> Upload Business Documents
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Upload the 3 official documents below. The system will automatically read and extract all information.
            </p>
          </div>

          <div className="space-y-4">
            <DocCard label="Business Registration Certificate (UDYAM)"
              file={businessCertFile} base64={businessCert} target="businessCert" icon="📄" />
            <DocCard label="GST Registration Certificate"
              file={gstDocFile} base64={gstDoc} target="gstDoc" icon="📄" />
            <DocCard label="Certificate of Incorporation (CIN)"
              file={companyIdDocFile} base64={companyIdDoc} target="companyIdDoc" icon="📄" />
          </div>

          {/* Upload progress */}
          <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#1a1a1a' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${([businessCertFile, gstDocFile, companyIdDocFile].filter(Boolean).length / 3) * 100}%`,
                  backgroundColor: allDocsUploaded ? '#10B981' : 'var(--color-network)',
                }} />
            </div>
            <span className="text-xs font-medium" style={{ color: allDocsUploaded ? '#10B981' : 'var(--text-secondary)' }}>
              {[businessCertFile, gstDocFile, companyIdDocFile].filter(Boolean).length}/3 uploaded
            </span>
          </div>

          <div className="flex justify-end pt-2">
            <button onClick={handleExtract}
              disabled={!allDocsUploaded || isExtracting}
              className="nexus-btn flex items-center gap-2 text-sm font-semibold px-6 py-3"
              style={{
                background: allDocsUploaded ? 'linear-gradient(135deg,#3B6FD8,#8B5CF6)' : '#333',
                color: '#fff', borderRadius: '12px', border: 'none',
                opacity: allDocsUploaded && !isExtracting ? 1 : 0.5,
                cursor: allDocsUploaded && !isExtracting ? 'pointer' : 'not-allowed',
              }}>
              {isExtracting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing Documents...</>
              ) : (
                <><ScanSearch className="h-4 w-4" /> Extract & Analyze <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ═══ Step 2: Extracted Data (Auto-filled) ═══ */}
      {step === 'extracted' && (
        <div className="nexus-card p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <ScanSearch className="h-5 w-5" /> Extracted Information
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              The following data was automatically extracted from your uploaded documents. Review it before verification.
            </p>
          </div>

          {/* Extracted fields — read-only */}
          <div className="space-y-3">
            {[
              { label: 'Company Name', value: companyName, icon: Building2 },
              { label: 'CIN (Corporate Identity Number)', value: cin, icon: Hash },
              { label: 'GSTIN (GST Registration Number)', value: gst, icon: Hash },
              { label: 'PAN Number', value: pan, icon: Hash },
              { label: 'UDYAM Registration Number', value: udyam, icon: Hash },
            ].map((field, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl"
                style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: field.value ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
                  {field.value ?
                    <CheckCircle className="h-5 w-5" style={{ color: '#10B981' }} /> :
                    <XCircle className="h-5 w-5" style={{ color: '#EF4444' }} />}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-secondary)' }}>{field.label}</p>
                  <p className="text-sm font-mono font-semibold" style={{ color: field.value ? 'var(--text-primary)' : '#EF4444' }}>
                    {field.value || 'Not found in documents'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Per-document breakdown */}
          {extractedData?.perDocument && (
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Per-Document Extraction</h3>
              <div className="space-y-2">
                {Object.entries(extractedData.perDocument).map(([key, doc]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span style={{ color: 'var(--text-secondary)' }}>{doc.filename}</span>
                    <div className="flex items-center gap-2">
                      {doc.textExtracted ? (
                        <span className="flex items-center gap-1" style={{ color: '#10B981' }}>
                          <CheckCircle className="h-3 w-3" /> Text extracted
                        </span>
                      ) : (
                        <span className="flex items-center gap-1" style={{ color: '#EF4444' }}>
                          <XCircle className="h-3 w-3" /> Failed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button onClick={() => setStep('upload')} className="nexus-btn nexus-btn-outline flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Re-upload
            </button>
            <button onClick={handleVerify}
              disabled={isVerifying}
              className="nexus-btn flex items-center gap-2 text-sm font-semibold px-6 py-3"
              style={{
                background: 'linear-gradient(135deg,#10B981,#059669)',
                color: '#fff', borderRadius: '12px', border: 'none',
                opacity: isVerifying ? 0.6 : 1,
              }}>
              {isVerifying ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Verifying Against Registry...</>
              ) : (
                <><Shield className="h-4 w-4" /> Verify Documents <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ═══ Step 3: Verification Results ═══ */}
      {step === 'verify' && verifyResult && (
        <div className="nexus-card p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Shield className="h-5 w-5" /> Verification Results
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Each document was cross-checked against the official business registry.
            </p>
          </div>

          {/* Overall result */}
          <div className="p-5 rounded-xl text-center" style={{
            backgroundColor: verifyResult.verified ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
            border: `1px solid ${verifyResult.verified ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: verifyResult.verified ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
              {verifyResult.verified ?
                <BadgeCheck className="h-8 w-8" style={{ color: '#10B981' }} /> :
                <XCircle className="h-8 w-8" style={{ color: '#EF4444' }} />}
            </div>
            <p className="text-2xl font-bold mb-1" style={{ color: verifyResult.verified ? '#10B981' : '#EF4444' }}>
              {verifyResult.verified ? 'VERIFIED' : 'REJECTED'}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {verifyResult.passedDocuments}/{verifyResult.totalDocuments} documents matched
            </p>
          </div>

          {/* Per-document results */}
          <div className="space-y-3">
            {verifyResult.documents && Object.entries(verifyResult.documents).map(([key, doc]: [string, any]) => (
              <div key={key} className="flex items-center gap-4 p-4 rounded-xl"
                style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: doc.passed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
                  {doc.passed ?
                    <CheckCircle className="h-5 w-5" style={{ color: '#10B981' }} /> :
                    <XCircle className="h-5 w-5" style={{ color: '#EF4444' }} />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </p>
                  <p className="text-xs font-mono" style={{ color: doc.passed ? '#10B981' : '#EF4444' }}>
                    {doc.passed
                      ? `${doc.expectedType} ${doc.expectedNumber} ✓ Found`
                      : doc.textExtracted
                        ? `${doc.expectedType} ${doc.expectedNumber} ✗ NOT FOUND`
                        : 'Could not read document'}
                  </p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: doc.passed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    color: doc.passed ? '#10B981' : '#EF4444',
                  }}>
                  {doc.passed ? 'PASS' : 'FAIL'}
                </span>
              </div>
            ))}
          </div>

          {/* Claimant info */}
          <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Claimant</h3>
            <div className="flex items-center gap-3">
              {user?.faceImage ? (
                <img src={user.faceImage} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                  style={{ backgroundColor: 'var(--color-network)' }}>{user?.name?.charAt(0)}</div>
              )}
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
              </div>
              {faceVerified && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                  style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
                  <Shield className="h-3 w-3" /> Face Verified
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button onClick={() => setStep('extracted')} className="nexus-btn nexus-btn-outline flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button onClick={handleSubmit}
              className="nexus-btn flex items-center gap-2 text-base font-semibold px-6 py-3"
              style={{
                background: verifyResult.verified
                  ? 'linear-gradient(135deg,#10B981,#059669)'
                  : 'linear-gradient(135deg,#EF4444,#DC2626)',
                color: '#fff', borderRadius: '12px', border: 'none',
              }}>
              <BadgeCheck className="h-5 w-5" />
              {verifyResult.verified ? 'Confirm & Save Verification' : 'Save Rejection & Go to Dashboard'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CompanyClaimPage
