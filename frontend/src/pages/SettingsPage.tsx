import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Settings as SettingsIcon, User, Shield, Bell, Lock,
  LogOut, Trash2, AlertTriangle, Camera, CheckCircle, XCircle
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { removeUser } from '@/pages/auth/FaceVerificationPage'
import toast from 'react-hot-toast'

const PYTHON_API = 'http://localhost:8000'

const SettingsPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const handleLogout = () => {
    logout()
    localStorage.removeItem('auth-storage')
    navigate('/face-verification')
    toast.success('Signed out successfully')
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Type DELETE to confirm')
      return
    }
    try {
      setIsDeleting(true)
      if (user?.id) {
        try { await fetch(`${PYTHON_API}/faces/${encodeURIComponent(user.id)}`, { method: 'DELETE' }) } catch {}
      }
      if (user?.email) removeUser(user.email)
      logout()
      localStorage.removeItem('auth-storage')
      localStorage.removeItem('hirepath-userdb')
      toast.success('Account deleted')
      navigate('/face-verification')
    } catch {
      toast.error('Failed to delete account')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="nexus-card p-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Manage your account settings and preferences
        </p>
      </div>

      {/* Account Info */}
      <div className="nexus-card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <User className="h-5 w-5" /> Account Information
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Name</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Email</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>User ID</p>
              <p className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{user?.id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="nexus-card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Shield className="h-5 w-5" /> Security
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex items-center gap-3">
              <Camera className="h-5 w-5" style={{ color: user?.verificationStatus?.face ? '#10B981' : '#666' }} />
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Face Verification</span>
            </div>
            {user?.verificationStatus?.face ? (
              <span className="flex items-center gap-1 text-xs" style={{ color: '#10B981' }}>
                <CheckCircle className="h-4 w-4" /> Verified
              </span>
            ) : (
              <button onClick={() => navigate('/face-verification')}
                className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                Verify Now
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sign Out */}
      <div className="nexus-card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <LogOut className="h-5 w-5" /> Session
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Sign out of your account on this device.
        </p>
        <button onClick={handleLogout}
          className="nexus-btn w-full h-12 flex items-center justify-center gap-2 text-sm font-semibold"
          style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px' }}>
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </div>

      {/* Danger Zone */}
      <div className="nexus-card p-6" style={{ border: '1px solid rgba(239,68,68,0.3)' }}>
        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: '#EF4444' }}>
          <AlertTriangle className="h-5 w-5" /> Danger Zone
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Permanently delete your account and all associated data including face verification. This action is irreversible.
        </p>
        <button onClick={() => setShowDeleteModal(true)}
          className="nexus-btn w-full h-12 flex items-center justify-center gap-2 text-sm font-semibold"
          style={{ backgroundColor: '#EF4444', color: '#fff', border: 'none', borderRadius: '12px' }}>
          <Trash2 className="h-4 w-4" /> Delete Account
        </button>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl"
            style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-primary)' }}>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
                <AlertTriangle className="h-8 w-8" style={{ color: '#EF4444' }} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Delete Account?</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                This permanently deletes your account, face data, and all information.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Type <strong>DELETE</strong> to confirm
              </label>
              <input type="text" value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)} placeholder="Type DELETE"
                className="w-full px-4 py-3 rounded-lg border text-sm"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)', outline: 'none' }} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setDeleteConfirmText('') }}
                className="flex-1 py-3 rounded-lg border text-sm font-medium"
                style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
                Cancel
              </button>
              <button onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                className="flex-1 py-3 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2"
                style={{ backgroundColor: deleteConfirmText === 'DELETE' ? '#EF4444' : '#666', border: 'none' }}>
                {isDeleting ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsPage