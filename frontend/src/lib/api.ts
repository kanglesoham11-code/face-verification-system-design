import axios, { AxiosError, AxiosResponse } from 'axios'
import toast from 'react-hot-toast'

// Create axios instance
const api = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const response = await axios.post('/api/v1/auth/refresh', {}, {
          withCredentials: true,
        })
        
        const { accessToken } = response.data.data
        localStorage.setItem('accessToken', accessToken)
        
        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    // Handle other errors
    const errorData = error.response?.data as any
    const errorMessage = errorData?.error?.message || 'An error occurred'
    
    if (error.response?.status !== 401) {
      toast.error(errorMessage)
    }

    return Promise.reject(error)
  }
)

// API response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

// Auth API
export const authApi = {
  register: (data: {
    email: string
    password: string
    name: string
    phone?: string
    referredBy?: string
  }) => api.post<ApiResponse>('/auth/register', data),

  verifyEmail: (data: { userId: string; otp: string }) =>
    api.post<ApiResponse>('/auth/verify-email', data),

  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse>('/auth/login', data),

  logout: () => api.post<ApiResponse>('/auth/logout'),

  refreshToken: () => api.post<ApiResponse>('/auth/refresh'),

  verifyFace: (data: {
    embedding: number[]
    livenessScore: number
    faceConfidence?: number
  }) => api.post<ApiResponse>('/auth/verify-face', data),

  verifyFaceLogin: (data: {
    embedding: number[]
    livenessScore: number
  }) => api.post<ApiResponse>('/auth/verify-face-login', data),

  getVerificationStatus: () =>
    api.get<ApiResponse>('/auth/verification-status'),
}

// Profile API
export const profileApi = {
  getProfile: (userId?: string) =>
    api.get<ApiResponse>(`/profiles${userId ? `/${userId}` : '/me'}`),

  updateProfile: (data: any) =>
    api.put<ApiResponse>('/profiles/me', data),

  uploadProfileImage: (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    return api.post<ApiResponse>('/profiles/me/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  searchProfiles: (params: {
    query?: string
    industry?: string
    location?: string
    skills?: string[]
    page?: number
    limit?: number
  }) => api.get<ApiResponse>('/profiles/search', { params }),

  getProfileStats: () => api.get<ApiResponse>('/profiles/me/stats'),
}

// Connection API
export const connectionApi = {
  sendRequest: (recipientId: string, message?: string) =>
    api.post<ApiResponse>('/connections/request', { recipientId, message }),

  respondToRequest: (requestId: string, action: 'accept' | 'decline') =>
    api.patch<ApiResponse>(`/connections/${requestId}/respond`, { action }),

  getConnections: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse>('/connections', { params }),

  getPendingRequests: () =>
    api.get<ApiResponse>('/connections/pending'),

  getSentRequests: () =>
    api.get<ApiResponse>('/connections/sent'),

  removeConnection: (userId: string) =>
    api.delete<ApiResponse>(`/connections/remove/${userId}`),

  followUser: (userId: string) =>
    api.post<ApiResponse>('/connections/follow', { userId }),

  unfollowUser: (userId: string) =>
    api.post<ApiResponse>('/connections/unfollow', { userId }),

  getFollowers: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse>('/connections/followers', { params }),

  getFollowing: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse>('/connections/following', { params }),

  getSuggestions: () =>
    api.get<ApiResponse>('/connections/suggestions'),

  getUsers: () =>
    api.get<ApiResponse>('/connections/users'),

  getConnectionStatus: (userId: string) =>
    api.get<ApiResponse>(`/connections/status/${userId}`),

  registerUser: (data: { id: string; name: string; email: string; role: string; faceImage?: string; verificationStatus?: any }) =>
    api.post<ApiResponse>('/connections/register-user', data),
}


// Post API
export const postApi = {
  createPost: (data: {
    content: string
    images?: string[]
    mediaUrls?: string[]
    tags?: string[]
    visibility?: 'public' | 'connections' | 'private'
  }) => api.post<ApiResponse>('/posts', data),

  getPosts: (params?: {
    userId?: string
    page?: number
    limit?: number
    type?: 'feed' | 'user' | 'saved'
  }) => {
    let endpoint = '/posts/feed';
    if (params?.type === 'user' && params?.userId) {
      endpoint = `/posts/user/${params.userId}`;
    } else if (params?.type === 'saved') {
      endpoint = '/posts/saved';
    }
    return api.get<ApiResponse>(endpoint, { params });
  },

  getPost: (postId: string) =>
    api.get<ApiResponse>(`/posts/${postId}`),

  updatePost: (postId: string, data: any) =>
    api.put<ApiResponse>(`/posts/${postId}`, data),

  deletePost: (postId: string) =>
    api.delete<ApiResponse>(`/posts/${postId}`),

  likePost: (postId: string) =>
    api.post<ApiResponse>(`/posts/${postId}/like`),

  unlikePost: (postId: string) =>
    api.delete<ApiResponse>(`/posts/${postId}/like`),

  savePost: (postId: string) =>
    api.post<ApiResponse>(`/posts/${postId}/save`),

  unsavePost: (postId: string) =>
    api.delete<ApiResponse>(`/posts/${postId}/save`),

  sharePost: (postId: string, message?: string) =>
    api.post<ApiResponse>(`/posts/${postId}/share`, { message }),

  addComment: (postId: string, content: string, parentId?: string) =>
    api.post<ApiResponse>(`/posts/${postId}/comments`, { content, parentId }),

  getComments: (postId: string, params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse>(`/posts/${postId}/comments`, { params }),

  updateComment: (postId: string, commentId: string, content: string) =>
    api.put<ApiResponse>(`/posts/${postId}/comments/${commentId}`, { content }),

  deleteComment: (postId: string, commentId: string) =>
    api.delete<ApiResponse>(`/posts/${postId}/comments/${commentId}`),

  uploadImage: (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    return api.post<ApiResponse>('/posts/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

// Job API
export const jobApi = {
  createJob: (data: any) => api.post<ApiResponse>('/jobs', data),
  
  getJobs: (params?: {
    page?: number
    limit?: number
    industry?: string
    location?: string
    experienceLevel?: string
    jobType?: string
    search?: string
  }) => api.get<ApiResponse>('/jobs', { params }),

  getJob: (jobId: string) => api.get<ApiResponse>(`/jobs/${jobId}`),

  updateJob: (jobId: string, data: any) =>
    api.put<ApiResponse>(`/jobs/${jobId}`, data),

  deleteJob: (jobId: string) => api.delete<ApiResponse>(`/jobs/${jobId}`),

  applyToJob: (jobId: string, data: {
    coverLetter?: string
    resumeUrl?: string
    expectedSalary?: number
  }) => api.post<ApiResponse>(`/jobs/${jobId}/apply`, data),

  getApplications: (jobId: string, params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse>(`/jobs/${jobId}/applications`, { params }),

  updateApplicationStatus: (jobId: string, applicationId: string, status: string) =>
    api.put<ApiResponse>(`/jobs/${jobId}/applications/${applicationId}`, { status }),

  getMyApplications: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse>('/jobs/my-applications', { params }),
}

// AI API
export const aiApi = {
  optimizeProfile: (profileData: any) =>
    api.post<ApiResponse>('/ai/optimize-profile', profileData),

  enhanceContent: (data: {
    type: 'post' | 'opportunity' | 'job' | 'event'
    text: string
    context?: any
  }) => api.post<ApiResponse>('/ai/enhance-content', data),

  getConnectionRecommendations: (limit?: number) =>
    api.get<ApiResponse>('/ai/recommend-connections', { params: { limit } }),

  getOpportunityMatches: (limit?: number) =>
    api.get<ApiResponse>('/ai/match-opportunities', { params: { limit } }),

  optimizeCampaign: (campaignData: any) =>
    api.post<ApiResponse>('/ai/optimize-campaign', campaignData),

  enhanceJobDescription: (jobData: any) =>
    api.post<ApiResponse>('/ai/enhance-job-description', jobData),

  enhanceEventDescription: (eventData: any) =>
    api.post<ApiResponse>('/ai/enhance-event-description', eventData),

  suggestPostTopics: (limit?: number) =>
    api.get<ApiResponse>('/ai/suggest-post-topics', { params: { limit } }),

  getStatus: () => api.get<ApiResponse>('/ai/status'),
}

// Event API
export const eventApi = {
  createEvent: (data: any) => api.post<ApiResponse>('/events', data),
  
  getEvents: (params?: {
    page?: number
    limit?: number
    type?: string
    location?: string
    startDate?: string
    endDate?: string
    search?: string
  }) => api.get<ApiResponse>('/events', { params }),

  getEvent: (eventId: string) => api.get<ApiResponse>(`/events/${eventId}`),

  updateEvent: (eventId: string, data: any) =>
    api.put<ApiResponse>(`/events/${eventId}`, data),

  deleteEvent: (eventId: string) => api.delete<ApiResponse>(`/events/${eventId}`),

  registerForEvent: (eventId: string, ticketType?: string) =>
    api.post<ApiResponse>(`/events/${eventId}/register`, { ticketType }),

  cancelRegistration: (eventId: string) =>
    api.delete<ApiResponse>(`/events/${eventId}/register`),

  getRegistrations: (eventId: string, params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse>(`/events/${eventId}/registrations`, { params }),

  checkIn: (eventId: string, qrCode: string) =>
    api.post<ApiResponse>(`/events/${eventId}/checkin`, { qrCode }),

  getMyEvents: (params?: { page?: number; limit?: number; type?: 'organized' | 'registered' }) =>
    api.get<ApiResponse>('/events/my-events', { params }),
}

export default api