import mongoose, { Schema, Document } from 'mongoose';

export interface IOpportunity extends Document {
  postedBy: mongoose.Types.ObjectId;
  postedByType: 'user' | 'company';
  type: 'investment' | 'partnership' | 'acquisition' | 'service_need' | 'co_founder';
  title: string;
  description: string;
  industry: string;
  stage?: 'idea' | 'mvp' | 'early_revenue' | 'growth' | 'profitable';
  
  // Investment specific
  fundingDetails?: {
    seekingAmount?: number;
    minInvestment?: number;
    maxInvestment?: number;
    equityOffered?: number;
    valuation?: number;
    useOfFunds?: string;
  };
  
  // Partnership specific
  partnershipDetails?: {
    partnershipType?: 'strategic' | 'technology' | 'distribution' | 'marketing';
    lookingFor?: string;
    offering?: string;
  };
  
  // Acquisition specific
  acquisitionDetails?: {
    askingPrice?: number;
    revenue?: number;
    profit?: number;
    assets?: string;
    reason?: string;
  };
  
  // Service need specific
  serviceDetails?: {
    budget?: number;
    timeline?: string;
    requirements?: string[];
  };
  
  location?: string;
  requirements: string[];
  benefits: string[];
  documents: {
    name: string;
    url: string;
    type: string;
    uploadedAt: Date;
    accessLevel: 'public' | 'interested' | 'verified';
  }[];
  
  visibility: 'public' | 'verified_only' | 'private';
  status: 'active' | 'paused' | 'closed' | 'draft';
  
  // Engagement
  views: number;
  interests: mongoose.Types.ObjectId[];
  interestCount: number;
  savedBy: mongoose.Types.ObjectId[];
  saveCount: number;
  
  // Sponsored
  sponsoredConfig?: {
    isSponsored: boolean;
    campaignId?: mongoose.Types.ObjectId;
  };
  
  // Verification checkpoints
  verificationCheckpoints: {
    identityVerified: boolean;
    companyVerified: boolean;
    documentsVerified: boolean;
  };
  
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  schemaVersion: number;
}

const opportunitySchema = new Schema<IOpportunity>(
  {
    postedBy: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'postedByType',
    },
    postedByType: {
      type: String,
      enum: ['user', 'company'],
      required: true,
    },
    type: {
      type: String,
      enum: ['investment', 'partnership', 'acquisition', 'service_need', 'co_founder'],
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
    industry: {
      type: String,
      required: true,
    },
    stage: {
      type: String,
      enum: ['idea', 'mvp', 'early_revenue', 'growth', 'profitable'],
    },
    fundingDetails: {
      seekingAmount: Number,
      minInvestment: Number,
      maxInvestment: Number,
      equityOffered: Number,
      valuation: Number,
      useOfFunds: String,
    },
    partnershipDetails: {
      partnershipType: {
        type: String,
        enum: ['strategic', 'technology', 'distribution', 'marketing'],
      },
      lookingFor: String,
      offering: String,
    },
    acquisitionDetails: {
      askingPrice: Number,
      revenue: Number,
      profit: Number,
      assets: String,
      reason: String,
    },
    serviceDetails: {
      budget: Number,
      timeline: String,
      requirements: [String],
    },
    location: String,
    requirements: {
      type: [String],
      default: [],
    },
    benefits: {
      type: [String],
      default: [],
    },
    documents: [{
      name: String,
      url: String,
      type: String,
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
      accessLevel: {
        type: String,
        enum: ['public', 'interested', 'verified'],
        default: 'interested',
      },
    }],
    visibility: {
      type: String,
      enum: ['public', 'verified_only', 'private'],
      default: 'public',
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'closed', 'draft'],
      default: 'active',
    },
    views: {
      type: Number,
      default: 0,
    },
    interests: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    interestCount: {
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
    sponsoredConfig: {
      isSponsored: {
        type: Boolean,
        default: false,
      },
      campaignId: {
        type: Schema.Types.ObjectId,
        ref: 'Promotion',
      },
    },
    verificationCheckpoints: {
      identityVerified: {
        type: Boolean,
        default: false,
      },
      companyVerified: {
        type: Boolean,
        default: false,
      },
      documentsVerified: {
        type: Boolean,
        default: false,
      },
    },
    expiresAt: Date,
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
opportunitySchema.index({ postedBy: 1, status: 1 });
opportunitySchema.index({ type: 1, status: 1 });
opportunitySchema.index({ industry: 1 });
opportunitySchema.index({ status: 1, createdAt: -1 });
opportunitySchema.index({ 'sponsoredConfig.isSponsored': 1 });
opportunitySchema.index({ visibility: 1 });

export const Opportunity = mongoose.model<IOpportunity>('Opportunity', opportunitySchema);
