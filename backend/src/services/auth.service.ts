import bcrypt from 'bcrypt';
import { env } from '../config/env.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { generateReferralCode } from '../utils/referralCode.js';
import { generateOTP, OTP_EXPIRY_MS } from '../utils/otp.js';
import { getUserVerificationStatus } from './faceVerification.service.js';

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
  referredBy?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ==========================================
// DEMO MODE: IN-MEMORY USER STORE
// ==========================================

interface DemoUser {
  _id: string;
  email: string;
  passwordHash: string;
  name: string;
  phone?: string;
  role: string;
  referralCode: string;
  referredBy?: string;
  verificationStatus: {
    email: boolean;
    emailVerifiedAt?: Date;
    face: boolean;
    faceVerifiedAt?: Date;
    identity: boolean;
    identityVerifiedAt?: Date;
  };
  profileComplete: number;
  isActive: boolean;
  lastActive: Date;
}

const demoUsers = new Map<string, DemoUser>();

// Pre-seed the mock user so our bypass works
demoUsers.set('mock-user-123', {
  _id: 'mock-user-123',
  email: 'explorer@example.com',
  passwordHash: '',
  name: 'Jane Explorer',
  role: 'user',
  referralCode: 'EXPLORE1',
  verificationStatus: {
    email: true,
    face: false,
    identity: false,
  },
  profileComplete: 100,
  isActive: true,
  lastActive: new Date(),
});

export class AuthService {
  /**
   * Register a new user (demo mode)
   */
  async register(input: RegisterInput): Promise<{ userId: string; message: string }> {
    // Check if user already exists
    for (const user of demoUsers.values()) {
      if (user.email === input.email.toLowerCase()) {
        throw new Error('User with this email already exists');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);

    // Generate unique referral code
    const referralCode = generateReferralCode();
    const userId = `user_${Date.now()}`;

    // Create user
    const user: DemoUser = {
      _id: userId,
      email: input.email.toLowerCase(),
      passwordHash,
      name: input.name,
      phone: input.phone,
      referralCode,
      referredBy: input.referredBy?.toUpperCase(),
      role: 'individual',
      verificationStatus: {
        email: false,
        face: false,
        identity: false,
      },
      profileComplete: 20,
      isActive: true,
      lastActive: new Date(),
    };

    demoUsers.set(userId, user);

    // Generate and send OTP
    const otp = generateOTP();
    await this.storeOTP(userId, otp);

    // For development: Log OTP to console
    if (env.NODE_ENV === 'development') {
      console.log(`🔐 DEVELOPMENT OTP for ${user.email}: ${otp}`);
    }

    return {
      userId,
      message: 'Registration successful. Please verify your email with the OTP sent.',
    };
  }

  /**
   * Verify email with OTP
   */
  async verifyEmail(userId: string, otp: string): Promise<{ 
    success: boolean; 
    message: string; 
    user?: any; 
    tokens?: AuthTokens 
  }> {
    const user = demoUsers.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.verificationStatus.email) {
      const accessToken = generateAccessToken(user._id, user.email, user.role);
      const refreshToken = generateRefreshToken(user._id, user.email, user.role);
      
      return { 
        success: true, 
        message: 'Email already verified',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          verificationStatus: user.verificationStatus,
          profileComplete: user.profileComplete,
        },
        tokens: { accessToken, refreshToken },
      };
    }

    // Verify OTP
    const isValid = await this.verifyOTP(userId, otp);
    if (!isValid) {
      throw new Error('Invalid or expired OTP');
    }

    // Update user
    user.verificationStatus.email = true;
    user.verificationStatus.emailVerifiedAt = new Date();
    user.profileComplete = Math.max(user.profileComplete, 30);
    user.lastActive = new Date();

    await this.clearOTP(userId);

    const accessToken = generateAccessToken(user._id, user.email, user.role);
    const refreshToken = generateRefreshToken(user._id, user.email, user.role);

    return { 
      success: true, 
      message: 'Email verified successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        verificationStatus: user.verificationStatus,
        profileComplete: user.profileComplete,
      },
      tokens: { accessToken, refreshToken },
    };
  }

  /**
   * Login user
   */
  async login(input: LoginInput): Promise<{ user: any; tokens: AuthTokens }> {
    let foundUser: DemoUser | undefined;
    for (const user of demoUsers.values()) {
      if (user.email === input.email.toLowerCase()) {
        foundUser = user;
        break;
      }
    }

    if (!foundUser) {
      throw new Error('Invalid email or password');
    }

    if (!foundUser.isActive) {
      throw new Error('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(input.password, foundUser.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    foundUser.lastActive = new Date();

    const accessToken = generateAccessToken(foundUser._id, foundUser.email, foundUser.role);
    const refreshToken = generateRefreshToken(foundUser._id, foundUser.email, foundUser.role);

    return {
      user: {
        id: foundUser._id,
        email: foundUser.email,
        name: foundUser.name,
        role: foundUser.role,
        verificationStatus: foundUser.verificationStatus,
        profileComplete: foundUser.profileComplete,
      },
      tokens: { accessToken, refreshToken },
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    const { verifyRefreshToken } = await import('../utils/jwt.js');
    const payload = verifyRefreshToken(refreshToken);
    
    if (!payload) {
      throw new Error('Invalid refresh token');
    }

    const user = demoUsers.get(payload.userId);
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    const newAccessToken = generateAccessToken(user._id, user.email, user.role);
    const newRefreshToken = generateRefreshToken(user._id, user.email, user.role);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Get verification status – reads face status from the face verification service's store
   */
  async getVerificationStatus(userId: string) {
    const user = demoUsers.get(userId);
    const faceStatus = getUserVerificationStatus(userId);
    
    // Sync face verification status from face service into user record
    if (user && faceStatus.face) {
      user.verificationStatus.face = true;
      user.verificationStatus.faceVerifiedAt = faceStatus.faceVerifiedAt;
    }

    return {
      email: user?.verificationStatus.email ?? true,
      face: faceStatus.face,
      identity: user?.verificationStatus.identity ?? false,
      profileComplete: user?.profileComplete ?? 100,
      canPost: faceStatus.face,
      canCreateEvents: faceStatus.face,
      canInvest: faceStatus.face,
    };
  }

  // OTP management (in-memory for demo)
  private otpStore = new Map<string, { otp: string; expiresAt: number }>();

  private async storeOTP(userId: string, otp: string): Promise<void> {
    this.otpStore.set(userId, {
      otp,
      expiresAt: Date.now() + OTP_EXPIRY_MS,
    });
  }

  private async verifyOTP(userId: string, otp: string): Promise<boolean> {
    if (env.NODE_ENV === 'development' && otp === '123456') {
      console.log('🔓 Development OTP bypass used');
      return true;
    }

    const stored = this.otpStore.get(userId);
    if (!stored) return false;

    if (Date.now() > stored.expiresAt) {
      this.otpStore.delete(userId);
      return false;
    }

    return stored.otp === otp;
  }

  private async clearOTP(userId: string): Promise<void> {
    this.otpStore.delete(userId);
  }
}

export const authService = new AuthService();
