import mongoose, { Schema, Document } from 'mongoose';

/**
 * ISOLATED COLLECTION FOR SECURITY
 * Face embeddings are stored as arrays of numbers for similarity comparison
 * Never store raw face images
 */
export interface IFace extends Document {
  userId: mongoose.Types.ObjectId;
  embedding: number[]; // Face embedding vector for comparison
  embeddingHash: string; // SHA-256 hash of face embedding for duplicate detection
  provider: 'face-api' | 'mediapipe';
  livenessScore: number;
  capturedAt: Date;
  isDuplicate: boolean;
  metadata: {
    imageQuality?: number;
    faceConfidence?: number;
    detectionMethod?: string;
    embeddingVersion?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  schemaVersion: number;
}

const faceSchema = new Schema<IFace>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    embedding: {
      type: [Number],
      required: true,
      select: false, // Don't include in queries by default for security
    },
    embeddingHash: {
      type: String,
      required: true,
      unique: true, // Prevent duplicate faces across users
    },
    provider: {
      type: String,
      enum: ['face-api', 'mediapipe'],
      required: true,
    },
    livenessScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    capturedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    isDuplicate: {
      type: Boolean,
      default: false,
    },
    metadata: {
      imageQuality: Number,
      faceConfidence: Number,
      detectionMethod: String,
      embeddingVersion: String,
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

export const Face = mongoose.model<IFace>('Face', faceSchema);
