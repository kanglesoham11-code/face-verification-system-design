import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Mail, Lock, User, Phone, Loader2, Gift } from 'lucide-react'
import { authApi } from '@/lib/api'
import { validatePassword } from '@/lib/utils'
import toast from 'react-hot-toast'

interface RegisterForm {
  name: string
  email: string
  password: string
  confirmPassword: string
  phone?: string
  referredBy?: string
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>()

  const password = watch('password')
  const passwordValidation = password ? validatePassword(password) : null

  const onSubmit = async (data: RegisterForm) => {
    try {
      setIsLoading(true)
      
      const { confirmPassword, ...registerData } = data
      
      // Clean up empty referral code
      if (!registerData.referredBy || registerData.referredBy.trim() === '') {
        delete registerData.referredBy
      } else {
        // Ensure referral code is uppercase
        registerData.referredBy = registerData.referredBy.toUpperCase().trim()
      }
      
      console.log('Sending registration data:', registerData)
      console.log('Sending registration data:', registerData)
      const response = await authApi.register(registerData)
      
      if (response.data.success) {
        toast.success('Registration successful! Please check your email for verification.')
        navigate('/verify-email', { 
          state: { 
            userId: response.data.data.userId,
            email: data.email 
          } 
        })
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      toast.error(error.response?.data?.error?.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 
          className="text-3xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          Create your account
        </h2>
        <p 
          className="mt-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          Join the trusted professional ecosystem
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Name */}
        <div>
          <label 
            htmlFor="name" 
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Full name
          </label>
          <div className="relative">
            <User 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              {...register('name', {
                required: 'Full name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters',
                },
                maxLength: {
                  value: 100,
                  message: 'Name must be less than 100 characters',
                },
              })}
              type="text"
              className="nexus-input pl-10 w-full"
              placeholder="Enter your full name"
              style={{
                borderColor: errors.name ? '#EF4444' : undefined
              }}
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-sm" style={{ color: '#EF4444' }}>
              {errors.name.message}
            </p>
          )}
        </div>

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

        {/* Phone (Optional) */}
        <div>
          <label 
            htmlFor="phone" 
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Phone number <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
          </label>
          <div className="relative">
            <Phone 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              {...register('phone')}
              type="tel"
              className="nexus-input pl-10 w-full"
              placeholder="Enter your phone number"
            />
          </div>
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
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
                validate: (value) => {
                  const validation = validatePassword(value)
                  if (!validation.isValid) {
                    return 'Password must be at least 8 characters long'
                  }
                  return true
                },
              })}
              type={showPassword ? 'text' : 'password'}
              className="nexus-input pl-10 pr-10 w-full"
              placeholder="Create a strong password"
              style={{
                borderColor: errors.password ? '#EF4444' : undefined
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors"
              style={{ 
                color: 'var(--text-muted)',
                ':hover': { color: 'var(--text-secondary)' }
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
          
          {/* Password Strength Indicator */}
          {password && passwordValidation && (
            <div className="mt-2 space-y-1">
              <div className="flex space-x-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className="h-1 flex-1 rounded-full"
                    style={{
                      backgroundColor: level <= (passwordValidation.hasUppercase ? 1 : 0) +
                        (passwordValidation.hasLowercase ? 1 : 0) +
                        (passwordValidation.hasNumber ? 1 : 0) +
                        (passwordValidation.hasSpecialChar ? 1 : 0)
                        ? '#22C55E' : 'var(--border-default)'
                    }}
                  />
                ))}
              </div>
              <div className="text-xs space-y-0.5" style={{ color: 'var(--text-secondary)' }}>
                <div style={{
                  color: passwordValidation.hasUppercase ? '#22C55E' : 'var(--text-muted)'
                }}>
                  ✓ Uppercase letter
                </div>
                <div style={{
                  color: passwordValidation.hasLowercase ? '#22C55E' : 'var(--text-muted)'
                }}>
                  ✓ Lowercase letter
                </div>
                <div style={{
                  color: passwordValidation.hasNumber ? '#22C55E' : 'var(--text-muted)'
                }}>
                  ✓ Number
                </div>
                <div style={{
                  color: passwordValidation.hasSpecialChar ? '#22C55E' : 'var(--text-muted)'
                }}>
                  ✓ Special character
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label 
            htmlFor="confirmPassword" 
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Confirm password
          </label>
          <div className="relative">
            <Lock 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) =>
                  value === password || 'Passwords do not match',
              })}
              type={showConfirmPassword ? 'text' : 'password'}
              className="nexus-input pl-10 pr-10 w-full"
              placeholder="Confirm your password"
              style={{
                borderColor: errors.confirmPassword ? '#EF4444' : undefined
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors"
              style={{ 
                color: 'var(--text-muted)',
                ':hover': { color: 'var(--text-secondary)' }
              }}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm" style={{ color: '#EF4444' }}>
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Referral Code (Optional) */}
        <div>
          <label 
            htmlFor="referredBy" 
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Referral code <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
          </label>
          <div className="relative">
            <Gift 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              {...register('referredBy', {
                validate: (value) => {
                  if (!value || value.trim() === '') return true; // Allow empty
                  if (value.length !== 8) return 'Referral code must be exactly 8 characters';
                  return true;
                },
              })}
              type="text"
              className="nexus-input pl-10 w-full uppercase"
              placeholder="Enter referral code"
              style={{ 
                textTransform: 'uppercase',
                borderColor: errors.referredBy ? '#EF4444' : undefined
              }}
            />
          </div>
          {errors.referredBy && (
            <p className="mt-1 text-sm" style={{ color: '#EF4444' }}>
              {errors.referredBy.message}
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
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </button>
      </form>

      {/* Links */}
      <div className="text-center space-y-4">
        <p 
          className="text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium transition-colors"
            style={{ 
              color: 'var(--color-network)',
              ':hover': { color: '#2E5BC6' }
            }}
          >
            Sign in
          </Link>
        </p>
      </div>

      {/* Terms */}
      <div className="text-center">
        <p 
          className="text-xs"
          style={{ color: 'var(--text-muted)' }}
        >
          By creating an account, you agree to our{' '}
          <a 
            href="#" 
            className="transition-colors"
            style={{ 
              color: 'var(--color-network)',
              ':hover': { color: '#2E5BC6' }
            }}
          >
            Terms of Service
          </a>{' '}
          and{' '}
          <a 
            href="#" 
            className="transition-colors"
            style={{ 
              color: 'var(--color-network)',
              ':hover': { color: '#2E5BC6' }
            }}
          >
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage