import mongoose, { Schema, Document } from 'mongoose';

export interface ICompany extends Document {
  ownerId: mongoose.Types.ObjectId;
  name: string;
  domain?: string;
  industry: string;
  size: string;
  description?: string;
  website?: string;
  logo?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationMethod?: 'domain' | 'document' | 'dns' | 'manual';
  verificationDocuments: {
    type: 'gst' | 'mca' | 'incorporation' | 'other';
    url: string;
    uploadedAt: Date;
    status: 'pending' | 'verified' | 'rejected';
    rejectionReason?: string;
  }[];
  dnsVerification?: {
    txtRecord: string;
    verified: boolean;
    verifiedAt?: Date;
  };
  domainVerification?: {
    verified: boolean;
    verifiedAt?: Date;
    method: 'email' | 'file' | 'dns';
  };
  adminNotes?: string;
  verifiedAt?: Date;
  verifiedBy?: mongoose.Types.ObjectId;
  employees: mongoose.Types.ObjectId[];
  employeeCount: number;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  schemaVersion: number;
}

const companySchema = new Schema<ICompany>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      maxlength: 200,
    },
    domain: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
    },
    industry: {
      type: String,
      required: true,
    },
    size: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
      required: true,
    },
    description: {
      type: String,
      maxlength: 2000,
    },
    website: {
      type: String,
    },
    logo: {
      type: String,
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    verificationMethod: {
      type: String,
      enum: ['domain', 'document', 'dns', 'manual'],
    },
    verificationDocuments: [{
      type: {
        type: String,
        enum: ['gst', 'mca', 'incorporation', 'other'],
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending',
      },
      rejectionReason: String,
    }],
    dnsVerification: {
      txtRecord: String,
      verified: {
        type: Boolean,
        default: false,
      },
      verifiedAt: Date,
    },
    domainVerification: {
      verified: {
        type: Boolean,
        default: false,
      },
      verifiedAt: Date,
      method: {
        type: String,
        enum: ['email', 'file', 'dns'],
      },
    },
    adminNotes: String,
    verifiedAt: Date,
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    employees: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    employeeCount: {
      type: Number,
      default: 0,
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
companySchema.index({ ownerId: 1 });
companySchema.index({ domain: 1 }, { unique: true, sparse: true });
companySchema.index({ verificationStatus: 1 });
companySchema.index({ industry: 1 });

export const Company = mongoose.model<ICompany>('Company', companySchema);
