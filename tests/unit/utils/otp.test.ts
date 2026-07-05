import { describe, it, expect } from 'vitest';
import { generateOTP, OTP_EXPIRY_MS } from '../../../backend/src/utils/otp.js';

describe('OTP Utils', () => {
  describe('generateOTP', () => {
    it('should generate a 6-digit OTP', () => {
      const otp = generateOTP();
      expect(otp).toHaveLength(6);
      expect(otp).toMatch(/^\d{6}$/);
    });

    it('should generate numeric OTP', () => {
      const otp = generateOTP();
      const num = parseInt(otp, 10);
      expect(num).toBeGreaterThanOrEqual(100000);
      expect(num).toBeLessThanOrEqual(999999);
    });

    it('should generate different OTPs', () => {
      const otps = new Set();
      for (let i = 0; i < 50; i++) {
        otps.add(generateOTP());
      }
      // Should have many unique OTPs
      expect(otps.size).toBeGreaterThan(45);
    });
  });

  describe('OTP_EXPIRY_MS', () => {
    it('should be 10 minutes in milliseconds', () => {
      expect(OTP_EXPIRY_MS).toBe(10 * 60 * 1000);
    });
  });
});
