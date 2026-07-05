import mongoose, { Schema, Document } from 'mongoose';

export interface IVerificationClaim extends Document {
  userId: mongoose.Types.ObjectId;
  claimType: 'identity' | 'company_ownership' | 'event_organizer';
  evidence: {
    documentType?: string;
    documentUrl?: string;
    documentNumber?: string;
    companyDomain?: string;
    companyRegistrationNumber?: string;
    dnsVerificationToken?: string;
    additionalInfo?: Record<string, any>;
  };
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  schemaVersion: number;
}

const verificationClaimSchema = new Schema<IVerificationClaim>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    claimType: {
      type: String,
      enum: ['identity', 'company_ownership', 'event_organizer'],
      required: true,
    },
    evidence: {
      documentType: String,
      documentUrl: String,
      documentNumber: String,
      companyDomain: String,
      companyRegistrationNumber: String,
      dnsVerificationToken: String,
      additionalInfo: Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: Date,
    rejectionReason: String,
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

export const VerificationClaim = mongoose.model<IVerificationClaim>(
  'VerificationClaim',
  verificationClaimSchema
);
