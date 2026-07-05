import React, { useState, useEffect } from 'react'
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  MoreHorizontal,
  Image as ImageIcon,
  Video,
  FileText,
  Send,
  Loader2,
  TrendingUp,
  UserPlus,
  Briefcase
} from 'lucide-react'
import { formatRelativeTime, generateAvatar } from '@/lib/utils'
import { postApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

interface PostAuthor {
  _id: string;
  name: string;
  headline: string;
  verificationStatus?: { face: boolean };
}

interface Post {
  _id: string;
  authorId: PostAuthor;
  content: string;
  mediaUrls: string[];
  createdAt: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isLiked: boolean;
  isSaved: boolean;
}

const FeedPage: React.FC = () => {
  const { user } = useAuthStore()
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newPostContent, setNewPostContent] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [showCreatePost, setShowCreatePost] = useState(false)

  // Media upload state
  const [mediaFiles, setMediaFiles] = useState<{ url: string; type: 'image' | 'video'; name: string }[]>([])
  const imageInputRef = React.useRef<HTMLInputElement>(null)
  const videoInputRef = React.useRef<HTMLInputElement>(null)

  // Fetch Feed
  useEffect(() => {
    fetchFeed()
  }, [])

  const fetchFeed = async () => {
    try {
      setIsLoading(true)
      const res = await postApi.getPosts({ type: 'feed', limit: 20 })
      if (res.data?.success) {
        setPosts(res.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch feed', error)
      toast.error('Failed to load feed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0]
    if (!file) return
    const maxSize = type === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error(`File too large. Max ${type === 'video' ? '50' : '10'}MB`)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setMediaFiles(prev => [...prev, { url: reader.result as string, type, name: file.name }])
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && mediaFiles.length === 0) return

    try {
      setIsPosting(true)
      await postApi.createPost({
        content: newPostContent,
        mediaUrls: mediaFiles.map(m => m.url),
        visibility: 'public'
      })
      
      toast.success('Post created successfully!')
      setNewPostContent('')
      setMediaFiles([])
      setShowCreatePost(false)
      fetchFeed()
    } catch (error) {
      toast.error('Failed to create post')
    } finally {
      setIsPosting(false)
    }
  }

  const handleLike = async (postId: string) => {
    setPosts(current => current.map(p => {
      if (p._id === postId) {
        return {
          ...p,
          isLiked: !p.isLiked,
          likeCount: p.isLiked ? Math.max(0, p.likeCount - 1) : p.likeCount + 1
        }
      }
      return p
    }))

    try {
      if (posts.find(p => p._id === postId)?.isLiked) {
        await postApi.unlikePost(postId)
      } else {
        await postApi.likePost(postId)
      }
    } catch (error) {
      toast.error('Action failed')
      fetchFeed()
    }
  }

  const handleSave = async (postId: string) => {
    setPosts(current => current.map(p => {
      if (p._id === postId) {
        return {
          ...p,
          isSaved: !p.isSaved
        }
      }
      return p
    }))

    try {
      if (posts.find(p => p._id === postId)?.isSaved) {
        await postApi.unsavePost(postId)
      } else {
        await postApi.savePost(postId)
      }
    } catch (error) {
      toast.error('Action failed')
      fetchFeed()
    }
  }

  const myAvatar = user ? generateAvatar(user.name) : { initials: 'U', colorClass: 'bg-primary-600' }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Profile Overview */}
        <div className="hidden lg:block lg:col-span-3 space-y-6">
          <div className="nexus-card overflow-hidden sticky top-24">
            {/* Banner */}
            <div 
              className="h-16"
              style={{ background: 'linear-gradient(135deg, var(--color-network), #6366F1)' }}
            />
            <div className="p-4 relative">
              {/* Avatar */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 p-1 rounded-full"
                style={{ backgroundColor: 'var(--bg-card)' }}>
                {user?.faceImage ? (
                  <img src={user.faceImage} alt={user.name} className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
                    style={{ backgroundColor: 'var(--color-network)' }}>
                    {myAvatar.initials}
                  </div>
                )}
              </div>
              <div className="mt-10 text-center">
                <h3 className="text-lg font-bold cursor-pointer"
                  style={{ color: 'var(--text-primary)' }}>
                  {user?.name || 'User'}
                </h3>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {user?.email}
                </p>
              </div>
              
              <div className="mt-6 pt-4 border-t flex justify-between text-sm"
                style={{ borderColor: 'var(--border-default)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Role</span>
                <span className="font-semibold capitalize" style={{ color: 'var(--color-network)' }}>{user?.role}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Status</span>
                <span className="font-semibold" style={{ color: user?.verificationStatus?.face ? '#10B981' : '#F59E0B' }}>
                  {user?.verificationStatus?.face ? 'Verified' : 'Pending'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Feed */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Create Post Wizard */}
          <div className="nexus-card">
            <div className="p-4 sm:p-5">
              {!showCreatePost ? (
                <div className="flex items-center space-x-4">
                   <div 
                     className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold"
                     style={{ backgroundColor: 'var(--color-network)' }}
                   >
                      {myAvatar.initials}
                    </div>
                  <button
                    onClick={() => setShowCreatePost(true)}
                    className="flex-grow text-left px-5 py-3 rounded-full nexus-input"
                  >
                    <span style={{ color: 'var(--text-muted)' }}>Start a post, share an idea...</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div 
                      className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-medium text-sm"
                      style={{ backgroundColor: 'var(--color-network)' }}
                    >
                      {myAvatar.initials}
                    </div>
                    <div className="flex-grow">
                      <h4 
                        className="text-sm font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {user?.name}
                      </h4>
                      <p 
                        className="text-xs"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Post to anyone
                      </p>
                    </div>
                  </div>

                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="What do you want to talk about?"
                    className="w-full min-h-[120px] p-0 border-none focus:ring-0 resize-none text-lg nexus-input"
                    style={{ 
                      backgroundColor: 'transparent',
                      color: 'var(--text-primary)'
                    }}
                    autoFocus
                  />

                  {/* Hidden file inputs */}
                  <input ref={imageInputRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => handleMediaUpload(e, 'image')} />
                  <input ref={videoInputRef} type="file" accept="video/*" className="hidden"
                    onChange={(e) => handleMediaUpload(e, 'video')} />

                  {/* Media Preview */}
                  {mediaFiles.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 my-3">
                      {mediaFiles.map((media, i) => (
                        <div key={i} className="relative rounded-lg overflow-hidden border"
                          style={{ borderColor: 'var(--border-default)' }}>
                          {media.type === 'image' ? (
                            <img src={media.url} alt="" className="w-full h-40 object-cover" />
                          ) : (
                            <video src={media.url} className="w-full h-40 object-cover" controls />
                          )}
                          <button onClick={() => removeMedia(i)}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>✕</button>
                          <div className="absolute bottom-1 left-1 px-2 py-0.5 rounded text-[10px] font-medium text-white"
                            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
                            {media.type === 'image' ? '📷 Image' : '🎥 Video'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div 
                    className="flex items-center justify-between pt-3 border-t"
                    style={{ borderColor: 'var(--border-default)' }}
                  >
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <button onClick={() => imageInputRef.current?.click()}
                        className="p-2 rounded-full transition-colors hover:bg-opacity-10 hover:bg-blue-500"
                        title="Add Image">
                        <ImageIcon className="h-5 w-5" style={{ color: '#3B82F6' }} />
                      </button>
                      <button onClick={() => videoInputRef.current?.click()}
                        className="p-2 rounded-full transition-colors hover:bg-opacity-10 hover:bg-blue-500"
                        title="Add Video">
                        <Video className="h-5 w-5" style={{ color: '#10B981' }} />
                      </button>
                      <button className="p-2 rounded-full transition-colors hover:bg-opacity-10 hover:bg-blue-500"
                        title="Add Document">
                        <FileText className="h-5 w-5" style={{ color: '#F59E0B' }} />
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          setShowCreatePost(false)
                          setNewPostContent('')
                          setMediaFiles([])
                        }}
                        className="nexus-btn nexus-btn-outline"
                        disabled={isPosting}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreatePost}
                        disabled={(!newPostContent.trim() && mediaFiles.length === 0) || isPosting}
                        className="nexus-btn nexus-btn-primary"
                      >
                        {isPosting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Posts Feed */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--color-network)' }} />
            </div>
          ) : posts.length === 0 ? (
            <div className="nexus-card p-12 text-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: 'var(--bg-input)' }}
              >
                <Send className="h-8 w-8" style={{ color: 'var(--text-muted)' }} />
              </div>
              <h3 
                className="text-lg font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                No posts yet
              </h3>
              <p 
                className="mt-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                Be the first to share something with your network!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => {
                const authorAvatar = generateAvatar(post.authorId.name)
                
                return (
                  <div key={post._id} className="nexus-card">
                    <div className="p-5">
                      {/* Post Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-3">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold cursor-pointer"
                            style={{ backgroundColor: 'var(--color-network)' }}
                          >
                            {authorAvatar.initials}
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <h3 
                                className="font-bold cursor-pointer transition-colors hover:text-blue-400"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {post.authorId.name}
                              </h3>
                              {post.authorId.verificationStatus?.face && (
                                <div 
                                  className="flex items-center justify-center w-4 h-4 rounded-full" 
                                  title="Verified Professional"
                                  style={{ backgroundColor: 'var(--color-network)' }}
                                >
                                  <span className="text-white text-[10px] pb-[1px]">✓</span>
                                </div>
                              )}
                              <span style={{ color: 'var(--text-muted)' }} className="text-xs mx-1">•</span>
                              <span 
                                className="text-xs font-medium cursor-pointer"
                                style={{ color: 'var(--text-secondary)' }}
                              >
                                1st
                              </span>
                            </div>
                            <p 
                              className="text-xs leading-snug truncate max-w-[250px] sm:max-w-xs cursor-pointer"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              {post.authorId.headline || 'Professional on Nexus'}
                            </p>
                            <div className="flex items-center space-x-1.5 mt-0.5">
                              <span 
                                className="text-[11px] font-medium"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                {formatRelativeTime(post.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <button className="p-2 rounded-full transition-colors hover:bg-gray-700">
                          <MoreHorizontal className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
                        </button>
                      </div>

                      {/* Post Content */}
                      <div className="mb-4">
                        <p 
                          className="text-[15px] whitespace-pre-wrap leading-relaxed"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {post.content}
                        </p>
                      </div>

                      {/* Post Images/Videos */}
                      {post.mediaUrls && post.mediaUrls.length > 0 && (
                        <div className="mb-4 -mx-5 px-0">
                          <div className="grid gap-1" style={{ backgroundColor: 'var(--bg-input)' }}>
                            {post.mediaUrls.map((media: string, index: number) => {
                              const isVideo = media.startsWith('data:video') || media.endsWith('.mp4') || media.endsWith('.webm')
                              return isVideo ? (
                                <video key={index} src={media} controls
                                  className="w-full max-h-[500px]" />
                              ) : (
                                <img key={index} src={media} alt="Post content"
                                  className="w-full object-cover max-h-[500px]" loading="lazy" />
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Post Stats */}
                      <div 
                        className="flex items-center justify-between py-2 border-b mb-2"
                        style={{ borderColor: 'var(--border-default)' }}
                      >
                        <div className="flex items-center space-x-1.5 cursor-pointer">
                          <div className="flex -space-x-1">
                            <div 
                              className="w-5 h-5 rounded-full flex items-center justify-center z-10 border"
                              style={{ 
                                backgroundColor: 'rgba(59, 111, 216, 0.1)',
                                borderColor: 'var(--bg-card)'
                              }}
                            >
                              <Heart className="w-3 h-3 fill-current" style={{ color: 'var(--color-network)' }} />
                            </div>
                          </div>
                          <span 
                            className="text-xs"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {post.likeCount > 0 ? post.likeCount : ''}
                          </span>
                        </div>
                        <div 
                          className="flex items-center space-x-3 text-xs"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <span className="cursor-pointer hover:text-blue-400 transition-colors">
                            {post.commentCount} comments
                          </span>
                          <span>•</span>
                          <span className="cursor-pointer hover:text-blue-400 transition-colors">
                            {post.shareCount} shares
                          </span>
                        </div>
                      </div>

                      {/* Post Actions */}
                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={() => handleLike(post._id)}
                          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg transition-all font-medium text-sm sm:text-base ${
                            post.isLiked
                              ? 'text-blue-400 bg-blue-500 bg-opacity-10'
                              : 'hover:bg-gray-700'
                          }`}
                          style={{ 
                            color: post.isLiked ? 'var(--color-network)' : 'var(--text-secondary)'
                          }}
                        >
                          <Heart className={`h-5 w-5 sm:h-5 sm:w-5 transition-transform duration-200 ${
                            post.isLiked ? 'fill-current scale-110' : ''
                          }`} />
                          <span className="hidden sm:inline">Like</span>
                        </button>

                        <button className="flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg transition-colors font-medium text-sm sm:text-base hover:bg-gray-700"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <MessageSquare className="h-5 w-5 sm:h-5 sm:w-5" />
                          <span className="hidden sm:inline">Comment</span>
                        </button>

                        <button className="flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg transition-colors font-medium text-sm sm:text-base hover:bg-gray-700"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <Share2 className="h-5 w-5 sm:h-5 sm:w-5" />
                          <span className="hidden sm:inline">Share</span>
                        </button>

                        <button
                          onClick={() => handleSave(post._id)}
                          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg transition-all font-medium text-sm sm:text-base ${
                            post.isSaved 
                              ? 'text-indigo-400 bg-indigo-500 bg-opacity-10' 
                              : 'hover:bg-gray-700'
                          }`}
                          style={{ 
                            color: post.isSaved ? '#6366F1' : 'var(--text-secondary)'
                          }}
                        >
                          <Bookmark className={`h-5 w-5 sm:h-5 sm:w-5 transition-transform duration-200 ${
                            post.isSaved ? 'fill-current scale-110' : ''
                          }`} />
                          <span className="hidden sm:inline">Save</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Trending / Suggestions */}
        <div className="hidden xl:block xl:col-span-3 space-y-6">
          {/* Trending Panel */}
          <div className="nexus-card sticky top-24">
            <div 
              className="p-4 border-b flex flex-row items-center justify-between"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <h3 
                className="font-bold flex items-center"
                style={{ color: 'var(--text-primary)' }}
              >
                Nexus News
                <div className="ml-2 w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              </h3>
              <TrendingUp className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="p-4 space-y-4">
              <div className="group cursor-pointer">
                <div className="flex items-center space-x-2 mb-1">
                  <span 
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: 'var(--color-network)' }}
                  />
                  <h4 
                    className="text-sm font-semibold group-hover:text-blue-400 transition-colors line-clamp-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    AI redefining job markets in 2026
                  </h4>
                </div>
                <p 
                  className="text-xs pl-3.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Top news • 10,432 readers
                </p>
              </div>

              <div className="group cursor-pointer">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <h4 
                    className="text-sm font-semibold group-hover:text-blue-400 transition-colors line-clamp-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Remote work policies stabilizing
                  </h4>
                </div>
                <p 
                  className="text-xs pl-3.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  1d ago • 5,892 readers
                </p>
              </div>

              <div className="group cursor-pointer">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <h4 
                    className="text-sm font-semibold group-hover:text-blue-400 transition-colors line-clamp-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Tech funding hits 2-year high
                  </h4>
                </div>
                <p 
                  className="text-xs pl-3.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  2d ago • 14,204 readers
                </p>
              </div>

              <button 
                className="w-full text-left py-2 text-sm font-semibold hover:underline transition-colors"
                style={{ color: 'var(--color-network)' }}
              >
                Show more
              </button>
            </div>
          </div>
          
          {/* Add to feed Panel */}
          <div className="nexus-card sticky top-[420px]">
             <div 
               className="p-4 border-b flex flex-row items-center justify-between"
               style={{ borderColor: 'var(--border-default)' }}
             >
              <h3 
                className="font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                Add to your feed
              </h3>
              <UserPlus className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="p-4 space-y-5">
              <div className="flex items-start space-x-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}
                >
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <h4 
                    className="text-sm font-bold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Nexus Business
                  </h4>
                  <p 
                    className="text-xs mb-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Company • B2B Marketplace
                  </p>
                  <button className="nexus-btn nexus-btn-outline text-xs px-4 py-1">
                    + Follow
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}

export default FeedPage