import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  organizerId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  type: 'conference' | 'workshop' | 'meetup' | 'webinar' | 'networking' | 'other';
  category: string;
  venue: {
    type: 'physical' | 'virtual' | 'hybrid';
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    virtualLink?: string;
    capacity?: number;
  };
  date: Date;
  endDate?: Date;
  agenda?: {
    time: string;
    title: string;
    description?: string;
    speaker?: string;
  }[];
  speakers?: {
    name: string;
    title: string;
    bio?: string;
    imageUrl?: string;
  }[];
  tickets: {
    type: string; // e.g., 'Early Bird', 'Regular', 'VIP'
    price: number;
    currency: string;
    quantity: number;
    sold: number;
    description?: string;
    benefits?: string[];
  }[];
  totalRevenue: number;
  escrowAmount: number;
  escrowReleased: number;
  refundPolicy: {
    enabled: boolean;
    cutoffDays: number; // Days before event
    refundPercentage: number;
  };
  trustScore: number; // 0-100
  trustFactors: {
    organizerVerified: boolean;
    organizerHistory: number; // Past events count
    organizerRating: number;
    earlyBirdSales: number;
    refundRate: number;
    attendanceRate: number;
  };
  attendees: mongoose.Types.ObjectId[];
  attendeeCount: number;
  checkIns: {
    userId: mongoose.Types.ObjectId;
    ticketId: string;
    checkedInAt: Date;
    qrCode: string;
  }[];
  reviews: {
    userId: mongoose.Types.ObjectId;
    rating: number;
    comment?: string;
    createdAt: Date;
  }[];
  averageRating: number;
  reviewCount: number;
  images: string[];
  tags: string[];
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  visibility: 'public' | 'private' | 'invite_only';
  fraudReports: {
    reportedBy: mongoose.Types.ObjectId;
    reason: string;
    reportedAt: Date;
    status: 'pending' | 'reviewed' | 'resolved';
  }[];
  fraudScore: number; // 0-100, higher = more suspicious
  views: number;
  savedBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  schemaVersion: number;
}

const eventSchema = new Schema<IEvent>(
  {
    organizerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
    type: {
      type: String,
      enum: ['conference', 'workshop', 'meetup', 'webinar', 'networking', 'other'],
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    venue: {
      type: {
        type: String,
        enum: ['physical', 'virtual', 'hybrid'],
        required: true,
      },
      address: String,
      city: String,
      state: String,
      country: String,
      virtualLink: String,
      capacity: Number,
    },
    date: {
      type: Date,
      required: true,
    },
    endDate: Date,
    agenda: [{
      time: String,
      title: String,
      description: String,
      speaker: String,
    }],
    speakers: [{
      name: String,
      title: String,
      bio: String,
      imageUrl: String,
    }],
    tickets: [{
      type: {
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
      quantity: {
        type: Number,
        required: true,
        min: 0,
      },
      sold: {
        type: Number,
        default: 0,
      },
      description: String,
      benefits: [String],
    }],
    totalRevenue: {
      type: Number,
      default: 0,
    },
    escrowAmount: {
      type: Number,
      default: 0,
    },
    escrowReleased: {
      type: Number,
      default: 0,
    },
    refundPolicy: {
      enabled: {
        type: Boolean,
        default: true,
      },
      cutoffDays: {
        type: Number,
        default: 7,
      },
      refundPercentage: {
        type: Number,
        default: 80,
        min: 0,
        max: 100,
      },
    },
    trustScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    trustFactors: {
      organizerVerified: {
        type: Boolean,
        default: false,
      },
      organizerHistory: {
        type: Number,
        default: 0,
      },
      organizerRating: {
        type: Number,
        default: 0,
      },
      earlyBirdSales: {
        type: Number,
        default: 0,
      },
      refundRate: {
        type: Number,
        default: 0,
      },
      attendanceRate: {
        type: Number,
        default: 0,
      },
    },
    attendees: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    attendeeCount: {
      type: Number,
      default: 0,
    },
    checkIns: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      ticketId: String,
      checkedInAt: Date,
      qrCode: String,
    }],
    reviews: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    images: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'cancelled', 'completed'],
      default: 'draft',
    },
    visibility: {
      type: String,
      enum: ['public', 'private', 'invite_only'],
      default: 'public',
    },
    fraudReports: [{
      reportedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      reason: String,
      reportedAt: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved'],
        default: 'pending',
      },
    }],
    fraudScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    views: {
      type: Number,
      default: 0,
    },
    savedBy: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
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
eventSchema.index({ organizerId: 1, status: 1 });
eventSchema.index({ status: 1, date: 1 });
eventSchema.index({ type: 1, status: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ 'venue.city': 1 });
eventSchema.index({ date: 1 });
eventSchema.index({ trustScore: -1 });
eventSchema.index({ tags: 1 });

export const Event = mongoose.model<IEvent>('Event', eventSchema);
