import mongoose, { Schema, Document } from 'mongoose';

export interface ILeaderboard extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'referrals' | 'posts' | 'connections' | 'engagement';
  score: number;
  rank?: number;
  period: 'all_time' | 'monthly' | 'weekly';
  metadata: {
    referralCount?: number;
    postCount?: number;
    connectionCount?: number;
    engagementCount?: number;
  };
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const leaderboardSchema = new Schema<ILeaderboard>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['referrals', 'posts', 'connections', 'engagement'],
      required: true,
    },
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    rank: Number,
    period: {
      type: String,
      enum: ['all_time', 'monthly', 'weekly'],
      required: true,
    },
    metadata: {
      referralCount: Number,
      postCount: Number,
      connectionCount: Number,
      engagementCount: Number,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
leaderboardSchema.index({ type: 1, period: 1, score: -1 });
leaderboardSchema.index({ userId: 1, type: 1, period: 1 }, { unique: true });

export const Leaderboard = mongoose.model<ILeaderboard>('Leaderboard', leaderboardSchema);
