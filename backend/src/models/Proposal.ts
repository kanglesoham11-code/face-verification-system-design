import mongoose, { Schema, Document } from 'mongoose';

export interface IProposal extends Document {
  projectId: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId;
  coverLetter: string;
  proposedBudget: number;
  proposedTimeline: string;
  milestones: {
    title: string;
    description: string;
    amount: number;
    duration: string;
  }[];
  attachments: {
    name: string;
    url: string;
  }[];
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  submittedAt: Date;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  schemaVersion: number;
}

const proposalSchema = new Schema<IProposal>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    coverLetter: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    proposedBudget: {
      type: Number,
      required: true,
    },
    proposedTimeline: {
      type: String,
      required: true,
    },
    milestones: [{
      title: {
        type: String,
        required: true,
      },
      description: String,
      amount: {
        type: Number,
        required: true,
      },
      duration: String,
    }],
    attachments: [{
      name: String,
      url: String,
    }],
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
      default: 'pending',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    respondedAt: Date,
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
proposalSchema.index({ projectId: 1, status: 1 });
proposalSchema.index({ providerId: 1, status: 1 });
proposalSchema.index({ projectId: 1, providerId: 1 }, { unique: true });

export const Proposal = mongoose.model<IProposal>('Proposal', proposalSchema);
