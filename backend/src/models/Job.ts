import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
  companyId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  requirements: {
    minExperience: number; // MUST be >= 1 (no freshers)
    maxExperience?: number;
    skills: string[];
    education?: string;
    location: string;
  };
  compensation: {
    min?: number;
    max?: number;
    currency: string;
    type: 'annual' | 'monthly' | 'hourly';
  };
  workType: 'full_time' | 'part_time' | 'contract' | 'remote';
  benefits?: string[];
  applicationProcess: {
    type: 'internal' | 'external';
    externalUrl?: string;
  };
  applicants: mongoose.Types.ObjectId[];
  applicantCount: number;
  status: 'active' | 'paused' | 'closed';
  postedAt: Date;
  expiresAt?: Date;
  views: number;
  savedBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  schemaVersion: number;
}

const jobSchema = new Schema<IJob>(
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
    description: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    requirements: {
      minExperience: {
        type: Number,
        required: true,
        min: 1, // CRITICAL: No freshers allowed
      },
      maxExperience: Number,
      skills: {
        type: [String],
        required: true,
      },
      education: String,
      location: {
        type: String,
        required: true,
      },
    },
    compensation: {
      min: Number,
      max: Number,
      currency: {
        type: String,
        default: 'INR',
      },
      type: {
        type: String,
        enum: ['annual', 'monthly', 'hourly'],
        default: 'annual',
      },
    },
    workType: {
      type: String,
      enum: ['full_time', 'part_time', 'contract', 'remote'],
      required: true,
    },
    benefits: [String],
    applicationProcess: {
      type: {
        type: String,
        enum: ['internal', 'external'],
        default: 'internal',
      },
      externalUrl: String,
    },
    applicants: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    applicantCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'closed'],
      default: 'active',
    },
    postedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: Date,
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
jobSchema.index({ companyId: 1, status: 1 });
jobSchema.index({ status: 1, postedAt: -1 });
jobSchema.index({ 'requirements.skills': 1 });
jobSchema.index({ 'requirements.location': 1 });
jobSchema.index({ workType: 1 });

// Validation: Ensure minExperience is always >= 1
jobSchema.pre('save', function (next) {
  if (this.requirements.minExperience < 1) {
    return next(new Error('Minimum experience must be at least 1 year. Freshers are not allowed.'));
  }
  next();
});

export const Job = mongoose.model<IJob>('Job', jobSchema);
