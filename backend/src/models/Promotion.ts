import mongoose, { Schema, Document } from 'mongoose';

export interface IPromotion extends Document {
  ownerId: mongoose.Types.ObjectId;
  ownerType: 'user' | 'company';
  type: 'post' | 'profile' | 'event' | 'opportunity' | 'company';
  targetEntityId?: mongoose.Types.ObjectId; // ID of post/event/opportunity being promoted
  targetAudience: {
    industries?: string[];
    roles?: string[];
    locations?: string[];
    companySizes?: string[];
    experienceLevels?: string[];
    connectionDepth?: number[];
  };
  budget: number;
  spent: number;
  dailyBudget?: number;
  impressions: number;
  clicks: number;
  ctr: number; // Click-through rate
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  adWalletId: mongoose.Types.ObjectId;
  metadata: {
    title?: string;
    description?: string;
    imageUrl?: string;
    callToAction?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  schemaVersion: number;
}

const promotionSchema = new Schema<IPromotion>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'ownerType',
    },
    ownerType: {
      type: String,
      enum: ['user', 'company'],
      required: true,
    },
    type: {
      type: String,
      enum: ['post', 'profile', 'event', 'opportunity', 'company'],
      required: true,
    },
    targetEntityId: {
      type: Schema.Types.ObjectId,
    },
    targetAudience: {
      industries: [String],
      roles: [String],
      locations: [String],
      companySizes: [String],
      experienceLevels: [String],
      connectionDepth: [Number],
    },
    budget: {
      type: Number,
      required: true,
      min: 0,
    },
    spent: {
      type: Number,
      default: 0,
      min: 0,
    },
    dailyBudget: {
      type: Number,
      min: 0,
    },
    impressions: {
      type: Number,
      default: 0,
      min: 0,
    },
    clicks: {
      type: Number,
      default: 0,
      min: 0,
    },
    ctr: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
      default: 'draft',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: Date,
    adWalletId: {
      type: Schema.Types.ObjectId,
      ref: 'AdWallet',
      required: true,
    },
    metadata: {
      title: String,
      description: String,
      imageUrl: String,
      callToAction: String,
    },
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
promotionSchema.index({ ownerId: 1, status: 1 });
promotionSchema.index({ status: 1, startDate: 1 });
promotionSchema.index({ type: 1, status: 1 });
promotionSchema.index({ 'targetAudience.industries': 1 });
promotionSchema.index({ 'targetAudience.roles': 1 });
promotionSchema.index({ 'targetAudience.locations': 1 });

export const Promotion = mongoose.model<IPromotion>('Promotion', promotionSchema);
