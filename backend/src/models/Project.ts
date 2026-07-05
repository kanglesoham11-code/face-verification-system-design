import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  clientCompanyId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  timeline: string;
  skills: string[];
  requirements: string[];
  attachments: {
    name: string;
    url: string;
    uploadedAt: Date;
  }[];
  proposals: mongoose.Types.ObjectId[];
  proposalCount: number;
  selectedProviderId?: mongoose.Types.ObjectId;
  milestones: {
    title: string;
    description: string;
    amount: number;
    dueDate: Date;
    status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'paid';
    submittedAt?: Date;
    approvedAt?: Date;
    paidAt?: Date;
    deliverables?: string[];
  }[];
  status: 'open' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  contractSigned: boolean;
  escrowAmount: number;
  escrowReleased: number;
  startDate?: Date;
  completionDate?: Date;
  rating?: {
    clientRating: number;
    providerRating: number;
    clientReview?: string;
    providerReview?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  schemaVersion: number;
}

const projectSchema = new Schema<IProject>(
  {
    clientCompanyId: {
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
    category: {
      type: String,
      required: true,
    },
    budget: {
      min: {
        type: Number,
        required: true,
      },
      max: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        default: 'INR',
      },
    },
    timeline: {
      type: String,
      required: true,
    },
    skills: {
      type: [String],
      required: true,
    },
    requirements: {
      type: [String],
      default: [],
    },
    attachments: [{
      name: String,
      url: String,
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    proposals: {
      type: [Schema.Types.ObjectId],
      ref: 'Proposal',
      default: [],
    },
    proposalCount: {
      type: Number,
      default: 0,
    },
    selectedProviderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
      dueDate: Date,
      status: {
        type: String,
        enum: ['pending', 'in_progress', 'submitted', 'approved', 'paid'],
        default: 'pending',
      },
      submittedAt: Date,
      approvedAt: Date,
      paidAt: Date,
      deliverables: [String],
    }],
    status: {
      type: String,
      enum: ['open', 'in_progress', 'completed', 'cancelled', 'disputed'],
      default: 'open',
    },
    contractSigned: {
      type: Boolean,
      default: false,
    },
    escrowAmount: {
      type: Number,
      default: 0,
    },
    escrowReleased: {
      type: Number,
      default: 0,
    },
    startDate: Date,
    completionDate: Date,
    rating: {
      clientRating: {
        type: Number,
        min: 1,
        max: 5,
      },
      providerRating: {
        type: Number,
        min: 1,
        max: 5,
      },
      clientReview: String,
      providerReview: String,
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
projectSchema.index({ clientCompanyId: 1, status: 1 });
projectSchema.index({ status: 1, createdAt: -1 });
projectSchema.index({ category: 1, status: 1 });
projectSchema.index({ skills: 1 });

export const Project = mongoose.model<IProject>('Project', projectSchema);
