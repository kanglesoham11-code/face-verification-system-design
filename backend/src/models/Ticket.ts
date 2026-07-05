import mongoose, { Schema, Document } from 'mongoose';

export interface ITicket extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  ticketType: string;
  price: number;
  currency: string;
  qrCode: string; // Unique QR code for check-in
  purchasedAt: Date;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentId?: string;
  refundRequested: boolean;
  refundRequestedAt?: Date;
  refundStatus?: 'pending' | 'approved' | 'rejected' | 'completed';
  refundAmount?: number;
  refundReason?: string;
  checkedIn: boolean;
  checkedInAt?: Date;
  transferredTo?: mongoose.Types.ObjectId;
  transferredAt?: Date;
  status: 'active' | 'used' | 'cancelled' | 'refunded' | 'transferred';
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  schemaVersion: number;
}

const ticketSchema = new Schema<ITicket>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ticketType: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    qrCode: {
      type: String,
      required: true,
      unique: true,
    },
    purchasedAt: {
      type: Date,
      default: Date.now,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentId: String,
    refundRequested: {
      type: Boolean,
      default: false,
    },
    refundRequestedAt: Date,
    refundStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
    },
    refundAmount: Number,
    refundReason: String,
    checkedIn: {
      type: Boolean,
      default: false,
    },
    checkedInAt: Date,
    transferredTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    transferredAt: Date,
    status: {
      type: String,
      enum: ['active', 'used', 'cancelled', 'refunded', 'transferred'],
      default: 'active',
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
ticketSchema.index({ eventId: 1, userId: 1 });
ticketSchema.index({ userId: 1, status: 1 });
ticketSchema.index({ qrCode: 1 }, { unique: true });
ticketSchema.index({ paymentStatus: 1 });
ticketSchema.index({ refundStatus: 1 });

export const Ticket = mongoose.model<ITicket>('Ticket', ticketSchema);
