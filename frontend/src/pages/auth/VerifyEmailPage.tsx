import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Mail, Loader2, CheckCircle, ArrowLeft } from 'lucide-react'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

interface VerifyEmailForm {
  otp: string
}

const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  
  const { userId, email } = location.state || {}

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<VerifyEmailForm>()

  const otp = watch('otp')

  // Redirect if no userId
  useEffect(() => {
    if (!userId) {
      navigate('/register')
    }
  }, [userId, navigate])

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const onSubmit = async (data: VerifyEmailForm) => {
    try {
      setIsLoading(true)
      const response = await authApi.verifyEmail({
        userId,
        otp: data.otp,
      })
      
      if (response.data.success) {
        const result = response.data.data
        
        // If user and tokens are returned, log them in automatically
        if (result.user && result.tokens) {
          login(result.user, result.tokens.accessToken)
          toast.success('Email verified! Welcome to SyncUp!')
          navigate('/face-verification')
        } else {
          toast.success('Email verified successfully!')
          navigate('/login')
        }
      }
    } catch (error: any) {
      console.error('Email verification error:', error)
      toast.error(error.response?.data?.error?.message || 'Verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  const resendOTP = async () => {
    try {
      // In a real app, you'd have a resend OTP endpoint
      toast.success('New OTP sent to your email')
      setTimeLeft(300) // Reset timer
    } catch (error) {
      toast.error('Failed to resend OTP')
    }
  }

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/register')}
        className="flex items-center text-sm text-secondary-600 hover:text-secondary-900"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to registration
      </button>

      {/* Header */}
      <div className="text-center">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: 'rgba(59, 111, 216, 0.1)' }}
        >
          <Mail 
            className="h-8 w-8"
            style={{ color: 'var(--color-network)' }}
          />
        </div>
        <h2 
          className="text-3xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          Verify your email
        </h2>
        <p 
          className="mt-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          We've sent a 6-digit code to
        </p>
        <p 
          className="font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          {email}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* OTP Input */}
        <div>
          <label 
            htmlFor="otp" 
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Verification code
          </label>
          <input
            {...register('otp', {
              required: 'Verification code is required',
              pattern: {
                value: /^\d{6}$/,
                message: 'Please enter a valid 6-digit code',
              },
            })}
            type="text"
            maxLength={6}
            className="nexus-input text-center text-2xl font-mono tracking-widest w-full"
            placeholder="000000"
            autoComplete="one-time-code"
            style={{
              borderColor: errors.otp ? '#EF4444' : undefined
            }}
          />
          {errors.otp && (
            <p className="mt-1 text-sm" style={{ color: '#EF4444' }}>
              {errors.otp.message}
            </p>
          )}
        </div>

        {/* Timer */}
        <div className="text-center">
          <p className="text-sm text-secondary-600">
            Code expires in{' '}
            <span className={cn(
              "font-mono font-medium",
              timeLeft < 60 ? "text-error-600" : "text-secondary-900"
            )}>
              {formatTime(timeLeft)}
            </span>
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !otp || otp.length !== 6}
          className="nexus-btn nexus-btn-primary w-full text-lg py-3"
          style={{
            opacity: isLoading || !otp || otp.length !== 6 ? 0.5 : 1,
            cursor: isLoading || !otp || otp.length !== 6 ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Verifying...
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5 mr-2" />
              Verify email
            </>
          )}
        </button>
      </form>

      {/* Resend */}
      <div className="text-center">
        <p className="text-sm text-secondary-600 mb-2">
          Didn't receive the code?
        </p>
        <button
          onClick={resendOTP}
          disabled={timeLeft > 0}
          className={cn(
            "text-sm font-medium",
            timeLeft > 0
              ? "text-secondary-400 cursor-not-allowed"
              : "text-primary-600 hover:text-primary-500"
          )}
        >
          {timeLeft > 0 ? `Resend in ${formatTime(timeLeft)}` : 'Resend code'}
        </button>
      </div>

      {/* Help */}
      <div 
        className="nexus-card p-4"
        style={{ backgroundColor: 'rgba(59, 111, 216, 0.05)' }}
      >
        <h4 
          className="text-sm font-medium mb-2"
          style={{ color: 'var(--color-network)' }}
        >
          Development Mode Instructions
        </h4>
        <div 
          className="text-sm space-y-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          <p><strong>For testing, use OTP:</strong> <code style={{ 
            backgroundColor: 'var(--bg-input)', 
            padding: '2px 6px', 
            borderRadius: '4px',
            color: 'var(--color-network)',
            fontWeight: 'bold'
          }}>123456</code></p>
          <p>Or check the backend console for the actual OTP sent to your email.</p>
        </div>
      </div>

      <div 
        className="nexus-card p-4"
        style={{ backgroundColor: 'rgba(139, 69, 19, 0.05)' }}
      >
        <h4 
          className="text-sm font-medium mb-2"
          style={{ color: 'var(--color-services)' }}
        >
          Having trouble?
        </h4>
        <ul 
          className="text-sm space-y-1"
          style={{ color: 'var(--text-secondary)' }}
        >
          <li>• Check your spam/junk folder</li>
          <li>• Make sure you entered the correct email address</li>
          <li>• The code is valid for 5 minutes</li>
          <li>• Use development OTP: 123456</li>
        </ul>
      </div>
    </div>
  )
}

export default VerifyEmailPage