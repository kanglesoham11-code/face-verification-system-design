import mongoose, { Schema, Document } from 'mongoose';

export interface IReferral extends Document {
  referrerId: mongoose.Types.ObjectId;
  refereeId: mongoose.Types.ObjectId;
  code: string;
  status: 'pending' | 'completed' | 'rewarded';
  milestones: {
    emailVerified: boolean;
    faceVerified: boolean;
    profileCompleted: boolean;
    firstConnection: boolean;
    firstPost: boolean;
  };
  rewards: {
    referrer: {
      amount: number;
      currency: string;
      type: 'bonus_credits' | 'cash' | 'premium';
      awarded: boolean;
      awardedAt?: Date;
    };
    referee: {
      amount: number;
      currency: string;
      type: 'bonus_credits' | 'cash' | 'premium';
      awarded: boolean;
      awardedAt?: Date;
    };
  };
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  schemaVersion: number;
}

const referralSchema = new Schema<IReferral>(
  {
    referrerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    refereeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    code: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'rewarded'],
      default: 'pending',
    },
    milestones: {
      emailVerified: {
        type: Boolean,
        default: false,
      },
      faceVerified: {
        type: Boolean,
        default: false,
      },
      profileCompleted: {
        type: Boolean,
        default: false,
      },
      firstConnection: {
        type: Boolean,
        default: false,
      },
      firstPost: {
        type: Boolean,
        default: false,
      },
    },
    rewards: {
      referrer: {
        amount: {
          type: Number,
          default: 500,
        },
        currency: {
          type: String,
          default: 'INR',
        },
        type: {
          type: String,
          enum: ['bonus_credits', 'cash', 'premium'],
          default: 'bonus_credits',
        },
        awarded: {
          type: Boolean,
          default: false,
        },
        awardedAt: Date,
      },
      referee: {
        amount: {
          type: Number,
          default: 250,
        },
        currency: {
          type: String,
          default: 'INR',
        },
        type: {
          type: String,
          enum: ['bonus_credits', 'cash', 'premium'],
          default: 'bonus_credits',
        },
        awarded: {
          type: Boolean,
          default: false,
        },
        awardedAt: Date,
      },
    },
    completedAt: Date,
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
referralSchema.index({ referrerId: 1 });
referralSchema.index({ refereeId: 1 }, { unique: true });
referralSchema.index({ code: 1 });
referralSchema.index({ status: 1 });

export const Referral = mongoose.model<IReferral>('Referral', referralSchema);
