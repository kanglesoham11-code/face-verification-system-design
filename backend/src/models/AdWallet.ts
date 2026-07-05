import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction {
  type: 'credit' | 'debit' | 'bonus_credit' | 'bonus_expiry';
  amount: number;
  balanceType: 'real' | 'bonus';
  description: string;
  referenceId?: string; // Payment ID or campaign ID
  timestamp: Date;
}

export interface ICoupon {
  code: string;
  bonusAmount: number;
  bonusPercentage?: number;
  minSpend?: number;
  expiryDate: Date;
  appliedAt?: Date;
  status: 'available' | 'applied' | 'expired';
}

export interface IAdWallet extends Document {
  userId: mongoose.Types.ObjectId;
  realBalance: number;
  bonusBalance: number;
  bonusExpiry?: Date;
  totalSpent: number;
  totalCredits: number;
  transactions: ITransaction[];
  coupons: ICoupon[];
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  schemaVersion: number;
}

const transactionSchema = new Schema<ITransaction>(
  {
    type: {
      type: String,
      enum: ['credit', 'debit', 'bonus_credit', 'bonus_expiry'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    balanceType: {
      type: String,
      enum: ['real', 'bonus'],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    referenceId: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const couponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
    },
    bonusAmount: {
      type: Number,
      default: 0,
    },
    bonusPercentage: Number,
    minSpend: Number,
    expiryDate: {
      type: Date,
      required: true,
    },
    appliedAt: Date,
    status: {
      type: String,
      enum: ['available', 'applied', 'expired'],
      default: 'available',
    },
  },
  { _id: false }
);

const adWalletSchema = new Schema<IAdWallet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    realBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    bonusBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    bonusExpiry: Date,
    totalSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCredits: {
      type: Number,
      default: 0,
      min: 0,
    },
    transactions: [transactionSchema],
    coupons: [couponSchema],
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
adWalletSchema.index({ userId: 1 });

export const AdWallet = mongoose.model<IAdWallet>('AdWallet', adWalletSchema);
