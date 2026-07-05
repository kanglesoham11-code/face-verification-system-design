import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  phone?: string;
  role: 'individual' | 'company_admin' | 'organizer' | 'admin';
  verificationStatus: {
    email: boolean;
    emailVerifiedAt?: Date;
    face: boolean;
    faceVerifiedAt?: Date;
    identity: boolean;
    identityVerifiedAt?: Date;
  };
  faceEmbedding?: number[]; // Face embedding for verification
  referralCode: string;
  referredBy?: string;
  profileComplete: number; // 0-100
  isActive: boolean;
  lastActive: Date;
  verificationAttempts: {
    count: number;
    lastAttempt?: Date;
    cooldownUntil?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  schemaVersion: number;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['individual', 'company_admin', 'organizer', 'admin'],
      default: 'individual',
    },
    verificationStatus: {
      email: {
        type: Boolean,
        default: false,
      },
      emailVerifiedAt: Date,
      face: {
        type: Boolean,
        default: false,
      },
      faceVerifiedAt: Date,
      identity: {
        type: Boolean,
        default: false,
      },
      identityVerifiedAt: Date,
    },
    faceEmbedding: {
      type: [Number],
      select: false, // Don't include in queries by default for security
    },
    referralCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    referredBy: {
      type: String,
      uppercase: true,
    },
    profileComplete: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    verificationAttempts: {
      count: {
        type: Number,
        default: 0,
      },
      lastAttempt: Date,
      cooldownUntil: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    schemaVersion: {
      type: Number,
      default: 2, // Updated for embedding support
    },
  },
  {
    timestamps: true,
  }
);

// Indexes are created in database.ts

export const User = mongoose.model<IUser>('User', userSchema);
