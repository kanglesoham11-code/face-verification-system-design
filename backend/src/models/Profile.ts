import mongoose, { Schema, Document } from 'mongoose';

export interface IExperience {
  company: string;
  role: string;
  startDate: Date;
  endDate?: Date;
  current: boolean;
  description?: string;
  location?: string;
  verified: boolean;
}

export interface IEducation {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: number;
  endYear?: number;
  current: boolean;
  grade?: string;
}

export interface ISocialLinks {
  linkedin?: string;
  github?: string;
  twitter?: string;
  website?: string;
  portfolio?: string;
}

export interface IProfile extends Document {
  userId: mongoose.Types.ObjectId;
  headline: string;
  bio: string;
  location: string;
  avatar?: string;
  coverImage?: string;
  industry: string;
  skills: string[];
  experience: IExperience[];
  education: IEducation[];
  socialLinks: ISocialLinks;
  connections: mongoose.Types.ObjectId[];
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  followerCount: number;
  followingCount: number;
  connectionCount: number;
  verifiedBadge: boolean;
  profileViews: number;
  searchAppearances: number;
  profileComplete: number; // 0-100
  lastProfileUpdate: Date;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  schemaVersion: number;
}

const experienceSchema = new Schema<IExperience>(
  {
    company: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: Date,
    current: {
      type: Boolean,
      default: false,
    },
    description: String,
    location: String,
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const educationSchema = new Schema<IEducation>(
  {
    institution: {
      type: String,
      required: true,
    },
    degree: {
      type: String,
      required: true,
    },
    fieldOfStudy: {
      type: String,
      required: true,
    },
    startYear: {
      type: Number,
      required: true,
    },
    endYear: Number,
    current: {
      type: Boolean,
      default: false,
    },
    grade: String,
  },
  { _id: false }
);

const socialLinksSchema = new Schema<ISocialLinks>(
  {
    linkedin: String,
    github: String,
    twitter: String,
    website: String,
    portfolio: String,
  },
  { _id: false }
);

const profileSchema = new Schema<IProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    headline: {
      type: String,
      maxlength: 120,
      default: '',
    },
    bio: {
      type: String,
      maxlength: 2000,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    avatar: String,
    coverImage: String,
    industry: {
      type: String,
      default: '',
    },
    skills: {
      type: [String],
      default: [],
    },
    experience: {
      type: [experienceSchema],
      default: [],
    },
    education: {
      type: [educationSchema],
      default: [],
    },
    socialLinks: {
      type: socialLinksSchema,
      default: {},
    },
    connections: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    followers: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    following: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    followerCount: {
      type: Number,
      default: 0,
    },
    followingCount: {
      type: Number,
      default: 0,
    },
    connectionCount: {
      type: Number,
      default: 0,
    },
    verifiedBadge: {
      type: Boolean,
      default: false,
    },
    profileViews: {
      type: Number,
      default: 0,
    },
    searchAppearances: {
      type: Number,
      default: 0,
    },
    profileComplete: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lastProfileUpdate: {
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
profileSchema.index({ userId: 1 });
profileSchema.index({ industry: 1 });
profileSchema.index({ location: 1 });
profileSchema.index({ skills: 1 });
profileSchema.index({ verifiedBadge: 1 });
profileSchema.index({ profileComplete: -1 });

export const Profile = mongoose.model<IProfile>('Profile', profileSchema);
