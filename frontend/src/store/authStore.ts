import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Generate a per-user demo token that encodes userId:email:role
// Backend decodes this to know which user is making the request
export function generateDemoToken(userId: string, email: string, role: string = 'user'): string {
  return `demo-${btoa(`${userId}:${email}:${role}`)}`
}

export interface User {
  id: string
  email: string
  name: string
  role: string
  verificationStatus: {
    email: boolean
    emailVerifiedAt?: Date
    face: boolean
    faceVerifiedAt?: Date
    identity: boolean
    identityVerifiedAt?: Date
  }
  profileComplete: number
  faceImage?: string  // Base64 data URL of the captured face snapshot
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Actions
  setUser: (user: User) => void
  setAccessToken: (token: string) => void
  login: (user: User, token: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  updateUser: (updates: Partial<User>) => void
  setFaceImage: (dataUrl: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: localStorage.getItem('accessToken'),
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => {
        set({ user, isAuthenticated: true })
      },

      setAccessToken: (token) => {
        localStorage.setItem('accessToken', token)
        set({ accessToken: token })
      },

      login: (user, token) => {
        localStorage.setItem('accessToken', token)
        set({
          user,
          accessToken: token,
          isAuthenticated: true,
          isLoading: false,
        })
      },

      logout: () => {
        localStorage.removeItem('accessToken')
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      updateUser: (updates) => {
        const currentUser = get().user
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } })
        }
      },

      setFaceImage: (dataUrl: string) => {
        const currentUser = get().user
        if (currentUser) {
          set({ user: { ...currentUser, faceImage: dataUrl } })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)