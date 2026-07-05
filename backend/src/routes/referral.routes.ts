import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { referralService } from '../services/referral.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export async function referralRoutes(fastify: FastifyInstance) {
  // Get my referrals
  fastify.get(
    '/my',
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest<{ Querystring: { status?: string } }>, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).userId;
        const { status } = request.query;

        const referrals = await referralService.getUserReferrals(userId, status);

        return reply.send({
          success: true,
          data: { referrals },
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: {
            code: 'GET_REFERRALS_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Get referral stats
  fastify.get(
    '/stats',
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).userId;
        const stats = await referralService.getReferralStats(userId);

        return reply.send({
          success: true,
          data: stats,
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: {
            code: 'GET_STATS_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Get leaderboard
  fastify.get(
    '/leaderboard/:type',
    {
      preHandler: [requireAuth],
    },
    async (
      request: FastifyRequest<{
        Params: { type: 'referrals' | 'posts' | 'connections' | 'engagement' };
        Querystring: { period?: 'all_time' | 'monthly' | 'weekly'; limit?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { type } = request.params;
        const { period = 'all_time', limit } = request.query;

        const leaderboard = await referralService.getLeaderboard(
          type,
          period,
          limit ? parseInt(limit) : 100
        );

        return reply.send({
          success: true,
          data: { leaderboard },
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: {
            code: 'GET_LEADERBOARD_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Get my rank
  fastify.get(
    '/rank/:type',
    {
      preHandler: [requireAuth],
    },
    async (
      request: FastifyRequest<{
        Params: { type: 'referrals' | 'posts' | 'connections' | 'engagement' };
        Querystring: { period?: 'all_time' | 'monthly' | 'weekly' };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = (request.user as any).userId;
        const { type } = request.params;
        const { period = 'all_time' } = request.query;

        const rank = await referralService.getUserRank(userId, type, period);

        if (!rank) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'RANK_NOT_FOUND',
              message: 'User not ranked yet',
            },
          });
        }

        return reply.send({
          success: true,
          data: rank,
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: {
            code: 'GET_RANK_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Detect fraud
  fastify.get(
    '/fraud-check',
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).userId;
        const result = await referralService.detectFraud(userId);

        return reply.send({
          success: true,
          data: result,
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: {
            code: 'FRAUD_CHECK_FAILED',
            message: error.message,
          },
        });
      }
    }
  );
}
