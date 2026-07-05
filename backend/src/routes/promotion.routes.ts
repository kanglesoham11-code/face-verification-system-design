import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { promotionService } from '../services/promotion.service.js';
import { adWalletService } from '../services/adWallet.service.js';
import { authMiddleware, AuthenticatedRequest, requireFaceVerification } from '../middleware/auth.middleware.js';

// Validation schemas
const createCampaignSchema = z.object({
  type: z.enum(['post', 'profile', 'event', 'opportunity', 'company']),
  targetEntityId: z.string().optional(),
  targetAudience: z.object({
    industries: z.array(z.string()).optional(),
    roles: z.array(z.string()).optional(),
    locations: z.array(z.string()).optional(),
    companySizes: z.array(z.string()).optional(),
    experienceLevels: z.array(z.string()).optional(),
    connectionDepth: z.array(z.number()).optional(),
  }),
  budget: z.number().min(100),
  dailyBudget: z.number().min(10).optional(),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)).optional(),
  metadata: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    imageUrl: z.string().url().optional(),
    callToAction: z.string().optional(),
  }).optional(),
});

const topUpSchema = z.object({
  amount: z.number().min(100),
  paymentId: z.string(),
  paymentMethod: z.enum(['stripe', 'razorpay', 'card', 'upi']),
});

const applyCouponSchema = z.object({
  couponCode: z.string().min(3).max(20),
});

export async function promotionRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/v1/promotions
   * Create a new promotion campaign
   */
  fastify.post(
    '/',
    { preHandler: [authMiddleware, requireFaceVerification] },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const body = createCampaignSchema.parse(request.body);

        const campaign = await promotionService.createCampaign({
          ownerId: request.user!.userId,
          ownerType: 'user',
          ...body,
        });

        return reply.status(201).send({
          success: true,
          data: campaign,
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'CAMPAIGN_CREATION_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/promotions
   * Get user's campaigns
   */
  fastify.get(
    '/',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const campaigns = await promotionService.getUserCampaigns(request.user!.userId);

        return reply.send({
          success: true,
          data: campaigns,
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: {
            code: 'FETCH_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/promotions/:id/analytics
   * Get campaign analytics
   */
  fastify.get(
    '/:id/analytics',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const analytics = await promotionService.getCampaignAnalytics(id);

        return reply.send({
          success: true,
          data: analytics,
        });
      } catch (error: any) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'CAMPAIGN_NOT_FOUND',
            message: error.message,
          },
        });
      }
    }
  );

  /**
   * PATCH /api/v1/promotions/:id/pause
   * Pause a campaign
   */
  fastify.patch(
    '/:id/pause',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        await promotionService.pauseCampaign(id, request.user!.userId);

        return reply.send({
          success: true,
          data: { message: 'Campaign paused successfully' },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'PAUSE_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  /**
   * PATCH /api/v1/promotions/:id/resume
   * Resume a paused campaign
   */
  fastify.patch(
    '/:id/resume',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        await promotionService.resumeCampaign(id, request.user!.userId);

        return reply.send({
          success: true,
          data: { message: 'Campaign resumed successfully' },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'RESUME_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/promotions/feed
   * Get sponsored content for feed injection
   */
  fastify.get(
    '/feed',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { industry, role, location, experienceLevel } = request.query as any;

        const sponsoredContent = await promotionService.getSponsoredContent(
          {
            industry,
            role,
            location,
            experienceLevel,
          },
          5
        );

        return reply.send({
          success: true,
          data: sponsoredContent,
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: {
            code: 'FETCH_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  /**
   * POST /api/v1/promotions/:id/impression
   * Record impression (internal use)
   */
  fastify.post(
    '/:id/impression',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        await promotionService.recordImpression(id);

        return reply.send({
          success: true,
          data: { message: 'Impression recorded' },
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: {
            code: 'RECORD_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  /**
   * POST /api/v1/promotions/:id/click
   * Record click (internal use)
   */
  fastify.post(
    '/:id/click',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        await promotionService.recordClick(id);

        return reply.send({
          success: true,
          data: { message: 'Click recorded' },
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: {
            code: 'RECORD_FAILED',
            message: error.message,
          },
        });
      }
    }
  );
}

export async function adWalletRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/v1/ad-wallet/balance
   * Get wallet balance
   */
  fastify.get(
    '/balance',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const balance = await adWalletService.getBalance(request.user!.userId);

        return reply.send({
          success: true,
          data: balance,
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: {
            code: 'FETCH_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  /**
   * POST /api/v1/ad-wallet/topup
   * Top up wallet
   */
  fastify.post(
    '/topup',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const body = topUpSchema.parse(request.body);

        const wallet = await adWalletService.topUp({
          userId: request.user!.userId,
          ...body,
        });

        return reply.send({
          success: true,
          data: {
            realBalance: wallet.realBalance,
            bonusBalance: wallet.bonusBalance,
            totalBalance: wallet.realBalance + wallet.bonusBalance,
            message: 'Wallet topped up successfully',
          },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'TOPUP_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  /**
   * POST /api/v1/ad-wallet/apply-coupon
   * Apply coupon code
   */
  fastify.post(
    '/apply-coupon',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const body = applyCouponSchema.parse(request.body);

        const wallet = await adWalletService.applyCoupon({
          userId: request.user!.userId,
          couponCode: body.couponCode,
        });

        return reply.send({
          success: true,
          data: {
            realBalance: wallet.realBalance,
            bonusBalance: wallet.bonusBalance,
            totalBalance: wallet.realBalance + wallet.bonusBalance,
            message: 'Coupon applied successfully',
          },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'COUPON_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/ad-wallet/transactions
   * Get transaction history
   */
  fastify.get(
    '/transactions',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { limit } = request.query as { limit?: string };
        const transactions = await adWalletService.getTransactions(
          request.user!.userId,
          limit ? parseInt(limit) : 50
        );

        return reply.send({
          success: true,
          data: transactions,
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: {
            code: 'FETCH_FAILED',
            message: error.message,
          },
        });
      }
    }
  );
}
