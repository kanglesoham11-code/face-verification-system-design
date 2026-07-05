import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { aiService } from '../services/ai.service.js';
import { requireAuth, requireFaceVerification } from '../middleware/auth.middleware.js';

// Validation schemas
const optimizeProfileSchema = z.object({
  headline: z.string().optional(),
  about: z.string().optional(),
  experience: z.array(z.any()).optional(),
  education: z.array(z.any()).optional(),
  skills: z.array(z.string()).optional(),
});

const enhanceContentSchema = z.object({
  type: z.enum(['post', 'opportunity', 'job', 'event']),
  text: z.string().min(10),
  context: z.any().optional(),
});

const optimizeCampaignSchema = z.object({
  title: z.string(),
  description: z.string(),
  targetAudience: z.object({
    industries: z.array(z.string()).optional(),
    roles: z.array(z.string()).optional(),
    locations: z.array(z.string()).optional(),
    experienceLevels: z.array(z.string()).optional(),
  }),
  budget: z.number().positive(),
});

const enhanceJobSchema = z.object({
  title: z.string(),
  description: z.string(),
  requirements: z.object({
    minExperience: z.number(),
    maxExperience: z.number().optional(),
    skills: z.array(z.string()),
    education: z.string().optional(),
    location: z.string(),
  }),
});

const enhanceEventSchema = z.object({
  title: z.string(),
  description: z.string(),
  type: z.string(),
});

export async function aiRoutes(fastify: FastifyInstance) {
  // Optimize profile
  fastify.post(
    '/profile/optimize',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const profileData = optimizeProfileSchema.parse(request.body);
        const result = await aiService.optimizeProfile(profileData);

        return reply.send({
          success: true,
          data: result,
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'OPTIMIZE_PROFILE_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Enhance content
  fastify.post(
    '/content/enhance',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const contentData = enhanceContentSchema.parse(request.body);
        const result = await aiService.enhanceContent(contentData);

        return reply.send({
          success: true,
          data: result,
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'ENHANCE_CONTENT_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Get connection recommendations
  fastify.get(
    '/connections/recommend',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (
      request: FastifyRequest<{ Querystring: { limit?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = (request.user as any).userId;
        const limit = request.query.limit ? parseInt(request.query.limit) : 10;

        const result = await aiService.recommendConnections(userId, limit);

        return reply.send({
          success: true,
          data: result,
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: {
            code: 'RECOMMEND_CONNECTIONS_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Get opportunity matches
  fastify.get(
    '/opportunities/match',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (
      request: FastifyRequest<{ Querystring: { limit?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = (request.user as any).userId;
        const limit = request.query.limit ? parseInt(request.query.limit) : 10;

        const result = await aiService.matchOpportunities(userId, limit);

        return reply.send({
          success: true,
          data: result,
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: {
            code: 'MATCH_OPPORTUNITIES_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Optimize campaign
  fastify.post(
    '/campaign/optimize',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const campaignData = optimizeCampaignSchema.parse(request.body);
        const result = await aiService.optimizeCampaign(campaignData);

        return reply.send({
          success: true,
          data: result,
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'OPTIMIZE_CAMPAIGN_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Enhance job description
  fastify.post(
    '/job/enhance',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const jobData = enhanceJobSchema.parse(request.body);
        const result = await aiService.enhanceJobDescription(jobData);

        return reply.send({
          success: true,
          data: result,
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'ENHANCE_JOB_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Enhance event description
  fastify.post(
    '/event/enhance',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const eventData = enhanceEventSchema.parse(request.body);
        const result = await aiService.enhanceEventDescription(eventData);

        return reply.send({
          success: true,
          data: result,
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'ENHANCE_EVENT_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Get post topic suggestions
  fastify.get(
    '/posts/suggest-topics',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (
      request: FastifyRequest<{ Querystring: { limit?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = (request.user as any).userId;
        const limit = request.query.limit ? parseInt(request.query.limit) : 5;

        const result = await aiService.suggestPostTopics(userId, limit);

        return reply.send({
          success: true,
          data: result,
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: {
            code: 'SUGGEST_TOPICS_FAILED',
            message: error.message,
          },
        });
      }
    }
  );
}
