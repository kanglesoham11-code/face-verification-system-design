import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { projectService } from '../services/project.service.js';
import { requireAuth, requireFaceVerification } from '../middleware/auth.middleware.js';

// Validation schemas
const createProjectSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  category: z.string(),
  budget: z.object({
    min: z.number().positive(),
    max: z.number().positive(),
    currency: z.string().optional(),
  }),
  timeline: z.string(),
  skills: z.array(z.string()).min(1),
  requirements: z.array(z.string()).optional(),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
  })).optional(),
});

const updateProjectSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(20).max(5000).optional(),
  category: z.string().optional(),
  budget: z.object({
    min: z.number().positive(),
    max: z.number().positive(),
    currency: z.string().optional(),
  }).optional(),
  timeline: z.string().optional(),
  skills: z.array(z.string()).min(1).optional(),
  requirements: z.array(z.string()).optional(),
});

const submitProposalSchema = z.object({
  coverLetter: z.string().min(50).max(2000),
  proposedBudget: z.number().positive(),
  proposedTimeline: z.string(),
  milestones: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
    amount: z.number().positive(),
    duration: z.string().optional(),
  })).optional(),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
  })).optional(),
});

const submitMilestoneSchema = z.object({
  milestoneIndex: z.number().int().min(0),
  deliverables: z.array(z.string().url()),
});

const rateProjectSchema = z.object({
  rating: z.number().int().min(1).max(5),
  review: z.string().max(1000).optional(),
});

export async function projectRoutes(fastify: FastifyInstance) {
  // Create project
  fastify.post(
    '/',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = createProjectSchema.parse(request.body);
        const userId = (request.user as any).userId;

        const project = await projectService.createProject({
          ...data,
          clientCompanyId: userId,
        });

        return reply.status(201).send({
          success: true,
          data: { project },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'CREATE_PROJECT_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Get project by ID
  fastify.get(
    '/:id',
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const project = await projectService.getProjectById(request.params.id);

        if (!project) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'PROJECT_NOT_FOUND',
              message: 'Project not found',
            },
          });
        }

        return reply.send({
          success: true,
          data: { project },
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: {
            code: 'GET_PROJECT_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Get my projects
  fastify.get(
    '/my',
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest<{ Querystring: { status?: string; page?: string; limit?: string } }>, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).userId;
        const { status, page, limit } = request.query;

        const result = await projectService.getProjectsByClient(
          userId,
          status,
          page ? parseInt(page) : 1,
          limit ? parseInt(limit) : 20
        );

        return reply.send({
          success: true,
          data: result,
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: {
            code: 'GET_PROJECTS_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Search projects
  fastify.get(
    '/search',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (
      request: FastifyRequest<{
        Querystring: {
          category?: string;
          skills?: string;
          minBudget?: string;
          maxBudget?: string;
          status?: string;
          page?: string;
          limit?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { category, skills, minBudget, maxBudget, status, page, limit } = request.query;

        const result = await projectService.searchProjects({
          category,
          skills: skills ? skills.split(',') : undefined,
          minBudget: minBudget ? parseFloat(minBudget) : undefined,
          maxBudget: maxBudget ? parseFloat(maxBudget) : undefined,
          status,
          page: page ? parseInt(page) : 1,
          limit: limit ? parseInt(limit) : 20,
        });

        return reply.send({
          success: true,
          data: result,
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: {
            code: 'SEARCH_PROJECTS_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Update project
  fastify.patch(
    '/:id',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const updates = updateProjectSchema.parse(request.body);
        const userId = (request.user as any).userId;

        const project = await projectService.updateProject(
          request.params.id,
          userId,
          updates
        );

        if (!project) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'PROJECT_NOT_FOUND',
              message: 'Project not found or unauthorized',
            },
          });
        }

        return reply.send({
          success: true,
          data: { project },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'UPDATE_PROJECT_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Cancel project
  fastify.delete(
    '/:id',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).userId;
        const project = await projectService.cancelProject(request.params.id, userId);

        if (!project) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'PROJECT_NOT_FOUND',
              message: 'Project not found or unauthorized',
            },
          });
        }

        return reply.send({
          success: true,
          data: { project },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'CANCEL_PROJECT_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Submit proposal
  fastify.post(
    '/:id/proposals',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const data = submitProposalSchema.parse(request.body);
        const userId = (request.user as any).userId;

        const proposal = await projectService.submitProposal({
          ...data,
          projectId: request.params.id,
          providerId: userId,
        });

        return reply.status(201).send({
          success: true,
          data: { proposal },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'SUBMIT_PROPOSAL_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Get project proposals (client only)
  fastify.get(
    '/:id/proposals',
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).userId;
        const proposals = await projectService.getProjectProposals(
          request.params.id,
          userId
        );

        return reply.send({
          success: true,
          data: { proposals },
        });
      } catch (error: any) {
        return reply.status(403).send({
          success: false,
          error: {
            code: 'GET_PROPOSALS_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Get my proposals (provider)
  fastify.get(
    '/proposals/my',
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest<{ Querystring: { status?: string } }>, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).userId;
        const { status } = request.query;

        const proposals = await projectService.getProviderProposals(userId, status);

        return reply.send({
          success: true,
          data: { proposals },
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: {
            code: 'GET_PROPOSALS_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Accept proposal
  fastify.patch(
    '/proposals/:id/accept',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).userId;
        const result = await projectService.acceptProposal(request.params.id, userId);

        return reply.send({
          success: true,
          data: result,
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'ACCEPT_PROPOSAL_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Reject proposal
  fastify.patch(
    '/proposals/:id/reject',
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).userId;
        const proposal = await projectService.rejectProposal(request.params.id, userId);

        return reply.send({
          success: true,
          data: { proposal },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'REJECT_PROPOSAL_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Withdraw proposal
  fastify.delete(
    '/proposals/:id',
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).userId;
        const proposal = await projectService.withdrawProposal(request.params.id, userId);

        return reply.send({
          success: true,
          data: { proposal },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'WITHDRAW_PROPOSAL_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Submit milestone
  fastify.post(
    '/:id/milestones/submit',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { milestoneIndex, deliverables } = submitMilestoneSchema.parse(request.body);
        const userId = (request.user as any).userId;

        const project = await projectService.submitMilestone(
          request.params.id,
          milestoneIndex,
          userId,
          deliverables
        );

        return reply.send({
          success: true,
          data: { project },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'SUBMIT_MILESTONE_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Approve milestone
  fastify.patch(
    '/:id/milestones/:index/approve',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (
      request: FastifyRequest<{ Params: { id: string; index: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = (request.user as any).userId;
        const project = await projectService.approveMilestone(
          request.params.id,
          parseInt(request.params.index),
          userId
        );

        return reply.send({
          success: true,
          data: { project },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'APPROVE_MILESTONE_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Release milestone payment
  fastify.post(
    '/:id/milestones/:index/pay',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (
      request: FastifyRequest<{ Params: { id: string; index: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = (request.user as any).userId;
        const project = await projectService.releaseMilestonePayment(
          request.params.id,
          parseInt(request.params.index),
          userId
        );

        return reply.send({
          success: true,
          data: { project },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'RELEASE_PAYMENT_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Rate project
  fastify.post(
    '/:id/rate',
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { rating, review } = rateProjectSchema.parse(request.body);
        const userId = (request.user as any).userId;

        const project = await projectService.rateProject(
          request.params.id,
          userId,
          rating,
          review
        );

        return reply.send({
          success: true,
          data: { project },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'RATE_PROJECT_FAILED',
            message: error.message,
          },
        });
      }
    }
  );
}
