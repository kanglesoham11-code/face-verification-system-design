import mongoose, { Schema, Document } from 'mongoose';

export interface IOpportunityInterest extends Document {
  opportunityId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  message: string;
  status: 'pending' | 'accepted' | 'declined' | 'meeting_scheduled' | 'documents_shared' | 'term_sheet' | 'closed';
  
  // Communication
  messages: {
    senderId: mongoose.Types.ObjectId;
    content: string;
    timestamp: Date;
    read: boolean;
  }[];
  
  // Documents shared
  sharedDocuments: {
    name: string;
    url: string;
    sharedBy: mongoose.Types.ObjectId;
    sharedAt: Date;
    accessGranted: boolean;
  }[];
  
  // Meeting details
  meeting?: {
    scheduledAt: Date;
    location: string;
    type: 'virtual' | 'in_person';
    meetingLink?: string;
    status: 'scheduled' | 'completed' | 'cancelled';
  };
  
  // Verification checkpoint
  verificationCheckpoint: {
    requesterVerified: boolean;
    ownerVerified: boolean;
    documentsExchanged: boolean;
    checkpointPassed: boolean;
    checkpointDate?: Date;
  };
  
  // Deal tracking
  dealStage?: 'interest' | 'discussion' | 'due_diligence' | 'negotiation' | 'term_sheet' | 'closing' | 'completed';
  dealValue?: number;
  
  expressedAt: Date;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  schemaVersion: number;
}

const opportunityInterestSchema = new Schema<IOpportunityInterest>(
  {
    opportunityId: {
      type: Schema.Types.ObjectId,
      ref: 'Opportunity',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'meeting_scheduled', 'documents_shared', 'term_sheet', 'closed'],
      default: 'pending',
    },
    messages: [{
      senderId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      content: {
        type: String,
        required: true,
        maxlength: 2000,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      read: {
        type: Boolean,
        default: false,
      },
    }],
    sharedDocuments: [{
      name: String,
      url: String,
      sharedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      sharedAt: {
        type: Date,
        default: Date.now,
      },
      accessGranted: {
        type: Boolean,
        default: false,
      },
    }],
    meeting: {
      scheduledAt: Date,
      location: String,
      type: {
        type: String,
        enum: ['virtual', 'in_person'],
      },
      meetingLink: String,
      status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled'],
      },
    },
    verificationCheckpoint: {
      requesterVerified: {
        type: Boolean,
        default: false,
      },
      ownerVerified: {
        type: Boolean,
        default: false,
      },
      documentsExchanged: {
        type: Boolean,
        default: false,
      },
      checkpointPassed: {
        type: Boolean,
        default: false,
      },
      checkpointDate: Date,
    },
    dealStage: {
      type: String,
      enum: ['interest', 'discussion', 'due_diligence', 'negotiation', 'term_sheet', 'closing', 'completed'],
    },
    dealValue: Number,
    expressedAt: {
      type: Date,
      default: Date.now,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
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
opportunityInterestSchema.index({ opportunityId: 1, status: 1 });
opportunityInterestSchema.index({ userId: 1, status: 1 });
opportunityInterestSchema.index({ opportunityId: 1, userId: 1 }, { unique: true });
opportunityInterestSchema.index({ dealStage: 1 });

export const OpportunityInterest = mongoose.model<IOpportunityInterest>(
  'OpportunityInterest',
  opportunityInterestSchema
);
