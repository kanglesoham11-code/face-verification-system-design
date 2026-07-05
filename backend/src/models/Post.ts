import mongoose, { Schema, Document } from 'mongoose';

export interface IPost extends Document {
  authorId: mongoose.Types.ObjectId;
  authorType: 'user' | 'company';
  content: string;
  mediaUrls: string[];
  type: 'update' | 'article' | 'opportunity' | 'event_promo' | 'service';
  tags: string[];
  mentions: mongoose.Types.ObjectId[];
  sponsoredConfig?: {
    isSponsored: boolean;
    campaignId?: mongoose.Types.ObjectId;
    targetAudience?: any;
  };
  likes: mongoose.Types.ObjectId[];
  likeCount: number;
  comments: mongoose.Types.ObjectId[];
  commentCount: number;
  shares: mongoose.Types.ObjectId[];
  shareCount: number;
  savedBy: mongoose.Types.ObjectId[];
  saveCount: number;
  views: number;
  engagement: number; // Calculated: likes + comments + shares
  visibility: 'public' | 'connections' | 'private';
  isPinned: boolean;
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  schemaVersion: number;
}

const postSchema = new Schema<IPost>(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'authorType',
    },
    authorType: {
      type: String,
      enum: ['user', 'company'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    mediaUrls: {
      type: [String],
      default: [],
    },
    type: {
      type: String,
      enum: ['update', 'article', 'opportunity', 'event_promo', 'service'],
      default: 'update',
    },
    tags: {
      type: [String],
      default: [],
    },
    mentions: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    sponsoredConfig: {
      isSponsored: {
        type: Boolean,
        default: false,
      },
      campaignId: {
        type: Schema.Types.ObjectId,
        ref: 'Promotion',
      },
      targetAudience: Schema.Types.Mixed,
    },
    likes: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    comments: {
      type: [Schema.Types.ObjectId],
      ref: 'Comment',
      default: [],
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    shares: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    shareCount: {
      type: Number,
      default: 0,
    },
    savedBy: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    saveCount: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    engagement: {
      type: Number,
      default: 0,
    },
    visibility: {
      type: String,
      enum: ['public', 'connections', 'private'],
      default: 'public',
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
    isDeleted: {
      type: Boolean,
      default: false,
    },
    schemaVersion: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
postSchema.index({ authorId: 1, createdAt: -1 });
postSchema.index({ 'sponsoredConfig.isSponsored': 1 });
postSchema.index({ tags: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ engagement: -1 });
postSchema.index({ visibility: 1 });

// Update engagement score before save
postSchema.pre('save', function (next) {
  this.engagement = this.likeCount + this.commentCount + this.shareCount;
  next();
});

export const Post = mongoose.model<IPost>('Post', postSchema);
