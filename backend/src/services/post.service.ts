// Demo mode: No database models — all in-memory
import { getAllRegisteredUsers } from './connection.service.js';

export interface CreatePostInput {
  authorId: string;
  content: string;
  mediaUrls?: string[];
  type?: 'update' | 'article' | 'opportunity' | 'event_promo' | 'service';
  tags?: string[];
  visibility?: 'public' | 'connections' | 'private';
}

export interface CreateCommentInput {
  postId: string;
  authorId: string;
  content: string;
  parentCommentId?: string;
}

// ==========================================
// DEMO MODE: IN-MEMORY MOCK DATABASE
// ==========================================

let mockPosts: any[] = [
  {
    _id: 'post_1',
    authorId: {
      _id: 'user_1',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      verificationStatus: { face: true, identity: true },
      headline: 'Senior Software Engineer at TechCorp'
    },
    authorType: 'user',
    content: `Just shipped a major feature that reduces our API response time by 40%! 🚀\n\nThe key was implementing smart caching strategies and optimizing our database queries. It's amazing how small optimizations can have such a big impact on user experience.\n\nWhat's your favorite performance optimization technique? Would love to hear your thoughts!\n\n#WebDevelopment #Performance #TechTips`,
    mediaUrls: [],
    type: 'update',
    tags: ['WebDevelopment', 'Performance', 'TechTips'],
    visibility: 'public',
    likes: [],
    likeCount: 42,
    comments: [],
    commentCount: 8,
    shares: [],
    shareCount: 3,
    savedBy: [],
    saveCount: 5,
    views: 1200,
    isEdited: false,
    isDeleted: false,
    sponsoredConfig: { isSponsored: false },
    createdAt: new Date(Date.now() - 3600000), // 1 hour ago
    updatedAt: new Date(Date.now() - 3600000)
  },
  {
    _id: 'post_2',
    authorId: {
      _id: 'user_2',
      name: 'Michael Chen',
      email: 'michael@example.com',
      verificationStatus: { face: true, identity: false },
      headline: 'Product Manager | AI & Machine Learning'
    },
    authorType: 'user',
    content: `Excited to announce that our AI-powered recommendation system is now live! 🎉\n\nAfter 6 months of development and testing, we've successfully deployed a system that:\n• Increases user engagement by 35%\n• Reduces bounce rate by 28%\n• Improves conversion rates by 22%\n\nHuge thanks to the amazing engineering team who made this possible. This is what happens when great minds collaborate!\n\n#AI #MachineLearning #ProductLaunch #TeamWork`,
    mediaUrls: ['https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop'],
    type: 'update',
    tags: ['AI', 'MachineLearning', 'ProductLaunch'],
    visibility: 'public',
    likes: [],
    likeCount: 156,
    comments: [],
    commentCount: 23,
    shares: [],
    shareCount: 12,
    savedBy: [],
    saveCount: 40,
    views: 5000,
    isEdited: false,
    isDeleted: false,
    sponsoredConfig: { isSponsored: false },
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    updatedAt: new Date(Date.now() - 86400000)
  }
];

let mockComments: any[] = [];

export class PostService {
  async createPost(input: CreatePostInput): Promise<any> {
    // Look up real user data from the registry
    const registeredUser = getAllRegisteredUsers().find(u => u.id === input.authorId);
    
    const newPost = {
      _id: `post_${Date.now()}`,
      authorId: {
        _id: input.authorId,
        name: registeredUser?.name || 'Unknown User',
        email: registeredUser?.email || '',
        verificationStatus: registeredUser?.verificationStatus || { face: false },
        headline: registeredUser?.role || 'Member',
        faceImage: registeredUser?.faceImage || null,
      },
      authorType: 'user',
      content: input.content,
      mediaUrls: input.mediaUrls || [],
      type: input.type || 'update',
      tags: input.tags || [],
      visibility: input.visibility || 'public',
      likes: [],
      likeCount: 0,
      comments: [],
      commentCount: 0,
      shares: [],
      shareCount: 0,
      savedBy: [],
      saveCount: 0,
      views: 0,
      isEdited: false,
      isDeleted: false,
      sponsoredConfig: { isSponsored: false },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockPosts.unshift(newPost);
    return newPost;
  }

  async getPost(postId: string, viewerId?: string): Promise<any> {
    const post = mockPosts.find(p => p._id === postId && !p.isDeleted);
    if (!post) throw new Error('Post not found');
    if (viewerId && post.authorId._id !== viewerId) {
      post.views++;
    }
    return post;
  }

  async updatePost(postId: string, userId: string, content: string): Promise<any> {
    const post = mockPosts.find(p => p._id === postId && !p.isDeleted);
    if (!post) throw new Error('Post not found');
    post.content = content;
    post.isEdited = true;
    post.updatedAt = new Date();
    return post;
  }

  async deletePost(postId: string, userId: string): Promise<void> {
    const post = mockPosts.find(p => p._id === postId);
    if (!post) throw new Error('Post not found');
    post.isDeleted = true;
  }

  async toggleLike(postId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
    const post = mockPosts.find(p => p._id === postId && !p.isDeleted);
    if (!post) throw new Error('Post not found');

    const index = post.likes.indexOf(userId);
    let liked = false;

    if (index > -1) {
      post.likes.splice(index, 1);
      post.likeCount = Math.max(0, post.likeCount - 1);
    } else {
      post.likes.push(userId);
      post.likeCount += 1;
      liked = true;
    }

    return { liked, likeCount: post.likeCount };
  }

  async addComment(input: CreateCommentInput): Promise<any> {
    const post = mockPosts.find(p => p._id === input.postId && !p.isDeleted);
    if (!post) throw new Error('Post not found');

    const newComment = {
      _id: `comment_${Date.now()}`,
      postId: input.postId,
      authorId: {
        _id: input.authorId,
        name: 'Jane Explorer',
        email: 'explorer@example.com'
      },
      content: input.content,
      parentCommentId: input.parentCommentId,
      createdAt: new Date()
    };

    mockComments.push(newComment);
    post.commentCount++;
    
    return newComment;
  }

  async getComments(postId: string, limit: number = 20, offset: number = 0): Promise<any[]> {
    return mockComments
      .filter(c => c.postId === postId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }

  async getFeed(userId: string, limit: number = 20, offset: number = 0): Promise<any[]> {
    // In demo mode, we just return the global feed
    return mockPosts
      .filter(p => !p.isDeleted)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(p => ({
        ...p,
        isLiked: p.likes.includes(userId),
        isSaved: p.savedBy.includes(userId)
      }))
      .slice(offset, offset + limit);
  }

  async getUserPosts(userId: string, limit: number = 20, offset: number = 0): Promise<any[]> {
    return mockPosts
      .filter(p => p.authorId._id === userId && !p.isDeleted)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }

  async toggleSave(postId: string, userId: string): Promise<{ saved: boolean }> {
    const post = mockPosts.find(p => p._id === postId && !p.isDeleted);
    if (!post) throw new Error('Post not found');

    const index = post.savedBy.indexOf(userId);
    let saved = false;

    if (index > -1) {
      post.savedBy.splice(index, 1);
      post.saveCount = Math.max(0, post.saveCount - 1);
    } else {
      post.savedBy.push(userId);
      post.saveCount += 1;
      saved = true;
    }

    return { saved };
  }

  async sharePost(postId: string, userId: string): Promise<void> {
    const post = mockPosts.find(p => p._id === postId && !p.isDeleted);
    if (!post) throw new Error('Post not found');
    
    if (!post.shares.includes(userId)) {
      post.shares.push(userId);
      post.shareCount += 1;
    }
  }

  async getSavedPosts(userId: string, limit: number = 20, offset: number = 0): Promise<any[]> {
    return mockPosts
      .filter(p => p.savedBy.includes(userId) && !p.isDeleted)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }
}

export const postService = new PostService();
