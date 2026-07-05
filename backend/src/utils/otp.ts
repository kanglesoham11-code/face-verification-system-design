import crypto from 'crypto';

/**
 * Generate a 6-digit OTP
 */
export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * OTP expiry time in milliseconds (10 minutes)
 */
export const OTP_EXPIRY_MS = 10 * 60 * 1000;
