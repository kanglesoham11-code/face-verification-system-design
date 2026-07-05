import mongoose, { Schema, Document } from 'mongoose';

export interface IConnection extends Document {
  requesterId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'declined' | 'withdrawn';
  message?: string;
  requestedAt: Date;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  schemaVersion: number;
}

const connectionSchema = new Schema<IConnection>(
  {
    requesterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'withdrawn'],
      default: 'pending',
    },
    message: {
      type: String,
      maxlength: 300,
    },
    requestedAt: {
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
connectionSchema.index({ requesterId: 1, status: 1 });
connectionSchema.index({ recipientId: 1, status: 1 });
connectionSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });

export const Connection = mongoose.model<IConnection>('Connection', connectionSchema);
