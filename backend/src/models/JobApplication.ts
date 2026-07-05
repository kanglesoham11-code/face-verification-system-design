import mongoose, { Schema, Document } from 'mongoose';

export interface IJobApplication extends Document {
  jobId: mongoose.Types.ObjectId;
  applicantId: mongoose.Types.ObjectId;
  resume: string; // URL
  coverLetter?: string;
  answers?: {
    question: string;
    answer: string;
  }[];
  status: 'applied' | 'screening' | 'interview_scheduled' | 'interviewed' | 'offer' | 'hired' | 'rejected';
  matchScore?: number; // AI-driven match score (0-100)
  appliedAt: Date;
  lastStatusUpdate: Date;
  notes?: string; // Internal notes by recruiter
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  schemaVersion: number;
}

const jobApplicationSchema = new Schema<IJobApplication>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    applicantId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    resume: {
      type: String,
      required: true,
    },
    coverLetter: {
      type: String,
      maxlength: 2000,
    },
    answers: [{
      question: String,
      answer: String,
    }],
    status: {
      type: String,
      enum: ['applied', 'screening', 'interview_scheduled', 'interviewed', 'offer', 'hired', 'rejected'],
      default: 'applied',
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    lastStatusUpdate: {
      type: Date,
      default: Date.now,
    },
    notes: String,
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
jobApplicationSchema.index({ jobId: 1, status: 1 });
jobApplicationSchema.index({ applicantId: 1, status: 1 });
jobApplicationSchema.index({ jobId: 1, applicantId: 1 }, { unique: true });
jobApplicationSchema.index({ matchScore: -1 });

export const JobApplication = mongoose.model<IJobApplication>(
  'JobApplication',
  jobApplicationSchema
);
