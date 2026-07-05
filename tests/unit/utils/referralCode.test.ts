import { describe, it, expect } from 'vitest';
import { generateReferralCode, isValidReferralCode } from '../../../backend/src/utils/referralCode.js';

describe('Referral Code Utils', () => {
  describe('generateReferralCode', () => {
    it('should generate an 8-character code', () => {
      const code = generateReferralCode();
      expect(code).toHaveLength(8);
    });

    it('should generate uppercase alphanumeric code', () => {
      const code = generateReferralCode();
      expect(code).toMatch(/^[A-Z0-9]{8}$/);
    });

    it('should generate unique codes', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateReferralCode());
      }
      // Should have close to 100 unique codes (allowing for rare collisions)
      expect(codes.size).toBeGreaterThan(95);
    });
  });

  describe('isValidReferralCode', () => {
    it('should validate correct format', () => {
      expect(isValidReferralCode('ABC12345')).toBe(true);
      expect(isValidReferralCode('ZYXW9876')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(isValidReferralCode('abc12345')).toBe(false); // lowercase
      expect(isValidReferralCode('ABC123')).toBe(false); // too short
      expect(isValidReferralCode('ABC123456')).toBe(false); // too long
      expect(isValidReferralCode('ABC-1234')).toBe(false); // special char
      expect(isValidReferralCode('')).toBe(false); // empty
    });
  });
});
