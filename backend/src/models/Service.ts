import mongoose, { Schema, Document } from 'mongoose';

export interface IService extends Document {
  companyId: mongoose.Types.ObjectId;
  title: string;
  category: string;
  description: string;
  skills: string[];
  pricing: {
    type: 'fixed' | 'hourly' | 'milestone';
    amount?: number;
    currency: string;
  };
  portfolio: {
    title: string;
    description: string;
    imageUrl?: string;
    projectUrl?: string;
    completedAt: Date;
  }[];
  deliveryTime?: string;
  revisions?: number;
  rating: number;
  reviewCount: number;
  completedProjects: number;
  status: 'active' | 'paused' | 'inactive';
  views: number;
  savedBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  schemaVersion: number;
}

const serviceSchema = new Schema<IService>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 3000,
    },
    skills: {
      type: [String],
      required: true,
    },
    pricing: {
      type: {
        type: String,
        enum: ['fixed', 'hourly', 'milestone'],
        required: true,
      },
      amount: Number,
      currency: {
        type: String,
        default: 'INR',
      },
    },
    portfolio: [{
      title: String,
      description: String,
      imageUrl: String,
      projectUrl: String,
      completedAt: Date,
    }],
    deliveryTime: String,
    revisions: Number,
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    completedProjects: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'inactive'],
      default: 'active',
    },
    views: {
      type: Number,
      default: 0,
    },
    savedBy: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
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
serviceSchema.index({ companyId: 1, status: 1 });
serviceSchema.index({ category: 1, status: 1 });
serviceSchema.index({ skills: 1 });
serviceSchema.index({ rating: -1 });

export const Service = mongoose.model<IService>('Service', serviceSchema);
