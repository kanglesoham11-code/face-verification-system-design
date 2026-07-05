import { create } from 'zustand'

interface UIState {
  // Sidebar
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  
  // Theme
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  
  // Modals
  modals: {
    createPost: boolean
    editProfile: boolean
    faceVerification: boolean
    imageViewer: boolean
  }
  openModal: (modal: keyof UIState['modals']) => void
  closeModal: (modal: keyof UIState['modals']) => void
  closeAllModals: () => void
  
  // Loading states
  loading: {
    global: boolean
    posts: boolean
    profile: boolean
    connections: boolean
  }
  setLoading: (key: keyof UIState['loading'], value: boolean) => void
  
  // Notifications
  notifications: Array<{
    id: string
    type: 'info' | 'success' | 'warning' | 'error'
    title: string
    message: string
    timestamp: Date
    read: boolean
  }>
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp' | 'read'>) => void
  markNotificationRead: (id: string) => void
  clearNotifications: () => void
  
  // Search
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchFilters: {
    type: 'all' | 'people' | 'posts' | 'jobs' | 'events'
    location?: string
    industry?: string
  }
  setSearchFilters: (filters: Partial<UIState['searchFilters']>) => void
}

export const useUIStore = create<UIState>((set, get) => ({
  // Sidebar
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  // Theme
  theme: 'light',
  setTheme: (theme) => set({ theme }),
  
  // Modals
  modals: {
    createPost: false,
    editProfile: false,
    faceVerification: false,
    imageViewer: false,
  },
  openModal: (modal) => set((state) => ({
    modals: { ...state.modals, [modal]: true }
  })),
  closeModal: (modal) => set((state) => ({
    modals: { ...state.modals, [modal]: false }
  })),
  closeAllModals: () => set({
    modals: {
      createPost: false,
      editProfile: false,
      faceVerification: false,
      imageViewer: false,
    }
  }),
  
  // Loading states
  loading: {
    global: false,
    posts: false,
    profile: false,
    connections: false,
  },
  setLoading: (key, value) => set((state) => ({
    loading: { ...state.loading, [key]: value }
  })),
  
  // Notifications
  notifications: [],
  addNotification: (notification) => {
    const newNotification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
    }
    set((state) => ({
      notifications: [newNotification, ...state.notifications].slice(0, 50) // Keep only last 50
    }))
  },
  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    )
  })),
  clearNotifications: () => set({ notifications: [] }),
  
  // Search
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  searchFilters: {
    type: 'all',
  },
  setSearchFilters: (filters) => set((state) => ({
    searchFilters: { ...state.searchFilters, ...filters }
  })),
}))