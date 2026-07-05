import { nanoid } from 'nanoid';

/**
 * Generate a unique 8-character alphanumeric referral code
 */
export function generateReferralCode(): string {
  return nanoid(8).toUpperCase();
}

/**
 * Validate referral code format
 */
export function isValidReferralCode(code: string): boolean {
  return /^[A-Z0-9]{8}$/.test(code);
}
