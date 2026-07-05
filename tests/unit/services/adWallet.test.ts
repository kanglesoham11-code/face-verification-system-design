import { describe, it, expect, beforeEach } from 'vitest';
import { AdWallet } from '../../../backend/src/models/AdWallet.js';
import { User } from '../../../backend/src/models/User.js';
import { adWalletService } from '../../../backend/src/services/adWallet.service.js';

describe('AdWallet Service', () => {
  let testUserId: string;

  beforeEach(async () => {
    // Create a test user
    const user = await User.create({
      email: 'wallet@test.com',
      passwordHash: 'hashed',
      name: 'Wallet Test',
      referralCode: 'WALLET01',
      role: 'individual',
      verificationStatus: {
        email: true,
        face: true,
        identity: false,
      },
    });
    testUserId = user._id.toString();
  });

  describe('getOrCreateWallet', () => {
    it('should create a new wallet if none exists', async () => {
      const wallet = await adWalletService.getOrCreateWallet(testUserId);

      expect(wallet).toBeDefined();
      expect(wallet.userId.toString()).toBe(testUserId);
      expect(wallet.realBalance).toBe(0);
      expect(wallet.bonusBalance).toBe(0);
    });

    it('should return existing wallet', async () => {
      const wallet1 = await adWalletService.getOrCreateWallet(testUserId);
      const wallet2 = await adWalletService.getOrCreateWallet(testUserId);

      expect(wallet1._id.toString()).toBe(wallet2._id.toString());
    });
  });

  describe('topUp', () => {
    it('should add funds to real balance', async () => {
      const wallet = await adWalletService.topUp({
        userId: testUserId,
        amount: 1000,
        paymentId: 'pay_123',
        paymentMethod: 'stripe',
      });

      expect(wallet.realBalance).toBe(1000);
      expect(wallet.transactions.length).toBeGreaterThan(0);
    });

    it('should apply bonus for amounts >= 5000', async () => {
      const wallet = await adWalletService.topUp({
        userId: testUserId,
        amount: 5000,
        paymentId: 'pay_456',
        paymentMethod: 'stripe',
      });

      expect(wallet.realBalance).toBe(5000);
      expect(wallet.bonusBalance).toBeGreaterThan(0);
      expect(wallet.bonusExpiry).toBeDefined();
    });

    it('should apply 100% bonus for amounts >= 60000', async () => {
      const wallet = await adWalletService.topUp({
        userId: testUserId,
        amount: 60000,
        paymentId: 'pay_789',
        paymentMethod: 'stripe',
      });

      expect(wallet.realBalance).toBe(60000);
      expect(wallet.bonusBalance).toBe(60000); // 100% bonus
    });
  });

  describe('applyCoupon', () => {
    it('should apply valid coupon', async () => {
      // First top up
      await adWalletService.topUp({
        userId: testUserId,
        amount: 1000,
        paymentId: 'pay_123',
        paymentMethod: 'stripe',
      });

      const wallet = await adWalletService.applyCoupon({
        userId: testUserId,
        couponCode: 'WELCOME100',
      });

      expect(wallet.bonusBalance).toBeGreaterThan(0);
      expect(wallet.coupons.length).toBeGreaterThan(0);
    });

    it('should reject already applied coupon', async () => {
      await adWalletService.topUp({
        userId: testUserId,
        amount: 1000,
        paymentId: 'pay_123',
        paymentMethod: 'stripe',
      });

      await adWalletService.applyCoupon({
        userId: testUserId,
        couponCode: 'WELCOME100',
      });

      await expect(
        adWalletService.applyCoupon({
          userId: testUserId,
          couponCode: 'WELCOME100',
        })
      ).rejects.toThrow('already applied');
    });

    it('should reject invalid coupon', async () => {
      await expect(
        adWalletService.applyCoupon({
          userId: testUserId,
          couponCode: 'INVALID',
        })
      ).rejects.toThrow('Invalid coupon');
    });
  });

  describe('getBalance', () => {
    it('should return correct balance', async () => {
      await adWalletService.topUp({
        userId: testUserId,
        amount: 1000,
        paymentId: 'pay_123',
        paymentMethod: 'stripe',
      });

      const balance = await adWalletService.getBalance(testUserId);

      expect(balance.realBalance).toBe(1000);
      expect(balance.totalBalance).toBeGreaterThanOrEqual(1000);
    });

    it('should expire bonus balance', async () => {
      const wallet = await adWalletService.getOrCreateWallet(testUserId);
      wallet.bonusBalance = 500;
      wallet.bonusExpiry = new Date(Date.now() - 1000); // Expired
      await wallet.save();

      const balance = await adWalletService.getBalance(testUserId);

      expect(balance.bonusBalance).toBe(0);
    });
  });
});
