import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { opportunityService } from '../services/opportunity.service.js';
import {
  authMiddleware,
  AuthenticatedRequest,
  requireFaceVerification,
  requireIdentityVerification,
} from '../middleware/auth.middleware.js';

// Validation schemas
const createOpportunitySchema = z.object({
  type: z.enum(['investment', 'partnership', 'acquisition', 'service_need', 'co_founder']),
  title: z.string().min(10).max(200),
  description: z.string().min(50).max(5000),
  industry: z.string(),
  stage: z.enum(['idea', 'mvp', 'early_revenue', 'growth', 'profitable']).optional(),
  fundingDetails: z.object({
    seekingAmount: z.number().optional(),
    minInvestment: z.number().optional(),
    maxInvestment: z.number().optional(),
    equityOffered: z.number().min(0).max(100).optional(),
    valuation: z.number().optional(),
    useOfFunds: z.string().optional(),
  }).optional(),
  partnershipDetails: z.object({
    partnershipType: z.enum(['strategic', 'technology', 'distribution', 'marketing']).optional(),
    lookingFor: z.string().optional(),
    offering: z.string().optional(),
  }).optional(),
  acquisitionDetails: z.object({
    askingPrice: z.number().optional(),
    revenue: z.number().optional(),
    profit: z.number().optional(),
    assets: z.string().optional(),
    reason: z.string().optional(),
  }).optional(),
  serviceDetails: z.object({
    budget: z.number().optional(),
    timeline: z.string().optional(),
    requirements: z.array(z.string()).optional(),
  }).optional(),
  location: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  visibility: z.enum(['public', 'verified_only', 'private']).optional(),
});

const expressInterestSchema = z.object({
  message: z.string().min(20).max(1000),
});

const respondInterestSchema = z.object({
  action: z.enum(['accept', 'decline']),
});

const scheduleMeetingSchema = z.object({
  scheduledAt: z.string().transform((val) => new Date(val)),
  location: z.string(),
  type: z.enum(['virtual', 'in_person']),
  meetingLink: z.string().url().optional(),
});

const shareDocumentSchema = z.object({
  name: z.string(),
  url: z.string().url(),
});

const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});

const updateDealStageSchema = z.object({
  stage: z.enum(['interest', 'discussion', 'due_diligence', 'negotiation', 'term_sheet', 'closing', 'completed']),
  dealValue: z.number().optional(),
});

export async function opportunityRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/v1/opportunities
   * Create opportunity
   */
  fastify.post(
    '/',
    { preHandler: [authMiddleware, requireFaceVerification] },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const body = createOpportunitySchema.parse(request.body);
        const opportunity = await opportunityService.createOpportunity({
          postedBy: request.user!.userId,
          ...body,
        });

        return reply.status(201).send({
          success: true,
          data: opportunity,
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'CREATION_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/opportunities/:id
   * Get opportunity by ID
   */
  fastify.get(
    '/:id',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const opportunity = await opportunityService.getOpportunity(id, request.user!.userId);

        return reply.send({
          success: true,
          data: opportunity,
        });
      } catch (error: any) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        });
      }
    }
  );

  /**
   * PATCH /api/v1/opportunities/:id
   * Update opportunity
   */
  fastify.patch(
    '/:id',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = createOpportunitySchema.partial().parse(request.body);
        const opportunity = await opportunityService.updateOpportunity(
          id,
          request.user!.userId,
          body
        );

        return reply.send({
          success: true,
          data: opportunity,
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'UPDATE_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  /**
   * DELETE /api/v1/opportunities/:id
   * Delete opportunity
   */
  fastify.delete(
    '/:id',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        await opportunityService.deleteOpportunity(id, request.user!.userId);

        return reply.send({
          success: true,
          data: { message: 'Opportunity deleted successfully' },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'DELETE_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  /**
   * POST /api/v1/opportunities/:id/interest
   * Express interest in opportunity
   */
  fastify.post(
    '/:id/interest',
    { preHandler: [authMiddleware, requireIdentityVerification] },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = expressInterestSchema.parse(request.body);
        const interest = await opportunityService.expressInterest({
          opportunityId: id,
          userId: request.user!.userId,
          message: body.message,
        });

        return reply.status(201).send({
          success: true,
          data: interest,
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'INTEREST_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  /**
   * PATCH /api/v1/opportunities/interests/:id/respond
   * Respond to interest
   */
  fastify.patch(
    '/interests/:id/respond',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = respondInterestSchema.parse(request.body);
        const interest = await opportunityService.respondToInterest(
          id,
          request.user!.userId,
          body.action
        );

        return reply.send({
          success: true,
          data: interest,
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'RESPOND_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  /**
   * POST /api/v1/opportunities/interests/:id/meeting
   * Schedule meeting
   */
  fastify.post(
    '/interests/:id/meeting',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = scheduleMeetingSchema.parse(request.body);
        const interest = await opportunityService.scheduleMeeting(
          id,
          request.user!.userId,
          body
        );

        return reply.send({
          success: true,
          data: interest,
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'MEETING_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  /**
   * POST /api/v1/opportunities/interests/:id/document
   * Share document
   */
  fastify.post(
    '/interests/:id/document',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = shareDocumentSchema.parse(request.body);
        const interest = await opportunityService.shareDocument(
          id,
          request.user!.userId,
          body
        );

        return reply.send({
          success: true,
          data: interest,
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'DOCUMENT_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  /**
   * POST /api/v1/opportunities/interests/:id/message
   * Send message
   */
  fastify.post(
    '/interests/:id/message',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = sendMessageSchema.parse(request.body);
        const interest = await opportunityService.sendMessage(
          id,
          request.user!.userId,
          body.content
        );

        return reply.send({
          success: true,
          data: interest,
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'MESSAGE_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  /**
   * PATCH /api/v1/opportunities/interests/:id/stage
   * Update deal stage
   */
  fastify.patch(
    '/interests/:id/stage',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = updateDealStageSchema.parse(request.body);
        const interest = await opportunityService.updateDealStage(
          id,
          request.user!.userId,
          body.stage,
          body.dealValue
        );

        return reply.send({
          success: true,
          data: interest,
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'STAGE_UPDATE_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/opportunities/search
   * Search opportunities
   */
  fastify.get(
    '/search',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const query = request.query as any;
        const opportunities = await opportunityService.searchOpportunities({
          type: query.type,
          industry: query.industry,
          stage: query.stage,
          minFunding: query.minFunding ? parseFloat(query.minFunding) : undefined,
          maxFunding: query.maxFunding ? parseFloat(query.maxFunding) : undefined,
          location: query.location,
          keyword: query.keyword,
          limit: query.limit ? parseInt(query.limit) : 20,
          offset: query.offset ? parseInt(query.offset) : 0,
        });

        return reply.send({
          success: true,
          data: opportunities,
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: {
            code: 'SEARCH_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/opportunities/my
   * Get user's opportunities
   */
  fastify.get(
    '/my',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const opportunities = await opportunityService.getUserOpportunities(
          request.user!.userId
        );

        return reply.send({
          success: true,
          data: opportunities,
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
   * GET /api/v1/opportunities/:id/interests
   * Get interests for opportunity
   */
  fastify.get(
    '/:id/interests',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const interests = await opportunityService.getOpportunityInterests(
          id,
          request.user!.userId
        );

        return reply.send({
          success: true,
          data: interests,
        });
      } catch (error: any) {
        return reply.status(403).send({
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
   * GET /api/v1/opportunities/interests/my
   * Get user's expressed interests
   */
  fastify.get(
    '/interests/my',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const interests = await opportunityService.getUserInterests(request.user!.userId);

        return reply.send({
          success: true,
          data: interests,
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
   * POST /api/v1/opportunities/:id/save
   * Save/unsave opportunity
   */
  fastify.post(
    '/:id/save',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const result = await opportunityService.toggleSave(id, request.user!.userId);

        return reply.send({
          success: true,
          data: result,
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'SAVE_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/opportunities/saved
   * Get saved opportunities
   */
  fastify.get(
    '/saved',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const opportunities = await opportunityService.getSavedOpportunities(
          request.user!.userId
        );

        return reply.send({
          success: true,
          data: opportunities,
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
