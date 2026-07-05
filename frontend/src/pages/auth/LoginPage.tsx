import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Mail, Lock, Loader2, Shield } from 'lucide-react'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import FaceVerification from '@/components/FaceVerification'
import toast from 'react-hot-toast'

interface LoginForm {
  email: string
  password: string
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loginStep, setLoginStep] = useState<'credentials' | 'face-verification'>('credentials')
  const [tempUserData, setTempUserData] = useState<any>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    try {
      setIsLoading(true)
      const response = await authApi.login(data)
      
      if (response.data.success) {
        const { user, accessToken } = response.data.data
        
        // Check if user has face verification enabled
        if (user.verificationStatus.face) {
          // Store temp data and proceed to face verification
          setTempUserData({ user, accessToken })
          setLoginStep('face-verification')
          toast.success('Credentials verified! Please complete face verification.')
        } else {
          // Login directly if no face verification
          login(user, accessToken)
          toast.success('Welcome back!')
          navigate('/dashboard')
        }
      }
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error(error.response?.data?.error?.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFaceVerificationComplete = async (result: {
    success: boolean
    embedding?: number[]
    livenessScore?: number
    faceConfidence?: number
    error?: string
  }) => {
    if (result.success && result.embedding && tempUserData) {
      try {
        setIsLoading(true)
        
        // Set temporary token to make the face verification API call
        localStorage.setItem('accessToken', tempUserData.accessToken)
        
        const response = await authApi.verifyFaceLogin({
          embedding: result.embedding,
          livenessScore: result.livenessScore || 0,
        })

        if (response.data.success) {
          // Face verification successful, complete login
          login(tempUserData.user, tempUserData.accessToken)
          toast.success('Face verification successful! Welcome back!')
          navigate('/dashboard')
        }
      } catch (error: any) {
        console.error('Face verification error:', error)
        toast.error(error.response?.data?.error?.message || 'Face verification failed')
        // Clear temp token on failure
        localStorage.removeItem('accessToken')
        setLoginStep('credentials')
        setTempUserData(null)
      } finally {
        setIsLoading(false)
      }
    } else {
      toast.error(result.error || 'Face verification failed')
      setLoginStep('credentials')
      setTempUserData(null)
    }
  }

  const skipFaceVerification = () => {
    if (tempUserData) {
      // Allow login without face verification (with warning)
      login(tempUserData.user, tempUserData.accessToken)
      toast.success('Logged in successfully!')
      navigate('/dashboard')
    }
  }

  if (loginStep === 'face-verification') {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'rgba(59, 111, 216, 0.1)' }}
          >
            <Shield className="h-8 w-8" style={{ color: 'var(--color-network)' }} />
          </div>
          <h2 
            className="text-3xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Verify Your Identity
          </h2>
          <p 
            className="mt-2 max-w-md mx-auto"
            style={{ color: 'var(--text-secondary)' }}
          >
            Complete face verification to securely access your account
          </p>
        </div>

        {/* Face Verification Component */}
        <div className="nexus-card p-8">
          <div className="text-center mb-6">
            <p 
              className="text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Position your face in the camera frame and follow the instructions
            </p>
          </div>
          
          <FaceVerification
            mode="login"
            onVerificationComplete={handleFaceVerificationComplete}
            className="w-full"
          />

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            <button
              onClick={skipFaceVerification}
              className="nexus-btn nexus-btn-outline w-full"
              disabled={isLoading}
            >
              Skip Face Verification
            </button>
            
            <button
              onClick={() => {
                setLoginStep('credentials')
                setTempUserData(null)
              }}
              className="text-sm transition-colors w-full text-center block hover:opacity-80"
              style={{ 
                color: 'var(--text-secondary)'
              }}
            >
              Back to Login
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div 
          className="nexus-card p-4"
          style={{ backgroundColor: 'rgba(59, 111, 216, 0.05)' }}
        >
          <h4 
            className="text-sm font-medium mb-2"
            style={{ color: 'var(--color-network)' }}
          >
            Enhanced Security
          </h4>
          <p 
            className="text-sm"
            style={{ color: '#2563EB' }}
          >
            Face verification adds an extra layer of security to protect your account from unauthorized access.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 
          className="text-3xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          Welcome back
        </h2>
        <p 
          className="mt-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          Sign in to your account to continue
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Email */}
        <div>
          <label 
            htmlFor="email" 
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Email address
          </label>
          <div className="relative">
            <Mail 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Please enter a valid email address',
                },
              })}
              type="email"
              className="nexus-input pl-10 w-full"
              placeholder="Enter your email"
              style={{
                borderColor: errors.email ? '#EF4444' : undefined
              }}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm" style={{ color: '#EF4444' }}>
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label 
            htmlFor="password" 
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Password
          </label>
          <div className="relative">
            <Lock 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              {...register('password', {
                required: 'Password is required',
              })}
              type={showPassword ? 'text' : 'password'}
              className="nexus-input pl-10 pr-10 w-full"
              placeholder="Enter your password"
              style={{
                borderColor: errors.password ? '#EF4444' : undefined
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors hover:opacity-80"
              style={{ 
                color: 'var(--text-muted)'
              }}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm" style={{ color: '#EF4444' }}>
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="nexus-btn nexus-btn-primary w-full text-lg py-3"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      {/* Links */}
      <div className="text-center space-y-4">
        <p 
          className="text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-medium transition-colors hover:opacity-80"
            style={{ 
              color: 'var(--color-network)'
            }}
          >
            Sign up
          </Link>
        </p>
      </div>

      {/* Security Notice */}
      <div 
        className="nexus-card p-4"
        style={{ backgroundColor: 'rgba(59, 111, 216, 0.05)' }}
      >
        <div className="flex items-start space-x-3">
          <div 
            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ backgroundColor: 'var(--color-network)' }}
          >
            <Lock className="h-3 w-3 text-white" />
          </div>
          <div>
            <h4 
              className="text-sm font-medium mb-1"
              style={{ color: 'var(--color-network)' }}
            >
              Secure Authentication
            </h4>
            <p 
              className="text-sm"
              style={{ color: '#2563EB' }}
            >
              Your account is protected with advanced biometric verification and encrypted data storage.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage