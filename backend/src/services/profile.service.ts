// Demo mode: In-memory stub for profile service

const mockProfiles = new Map<string, any>();

// Pre-seed mock user profile
mockProfiles.set('mock-user-123', {
  userId: 'mock-user-123',
  headline: 'Software Engineer & Designer',
  bio: 'Passionate about building amazing products.',
  industry: 'Technology',
  location: 'San Francisco, CA',
  skills: ['React', 'TypeScript', 'Node.js', 'Python'],
  experience: [],
  education: [],
  connections: [],
  following: [],
  followers: [],
  profileComplete: 100,
  verifiedBadge: true,
});

export class ProfileService {
  async getProfile(userId: string) {
    return mockProfiles.get(userId) || { userId, headline: '', bio: '', skills: [], profileComplete: 20 };
  }
  async updateProfile(userId: string, data: any) {
    const existing = mockProfiles.get(userId) || { userId };
    const updated = { ...existing, ...data };
    mockProfiles.set(userId, updated);
    return updated;
  }
  async searchProfiles(params: any) { return []; }
  async getProfileStats(userId: string) { return { views: 342, connections: 1204, posts: 15 }; }
}

export const profileService = new ProfileService();
