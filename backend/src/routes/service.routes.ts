import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { serviceService } from '../services/service.service.js';
import { requireAuth, requireFaceVerification } from '../middleware/auth.middleware.js';

// Validation schemas
const createServiceSchema = z.object({
  title: z.string().min(5).max(200),
  category: z.string(),
  description: z.string().min(20).max(3000),
  skills: z.array(z.string()).min(1),
  pricing: z.object({
    type: z.enum(['fixed', 'hourly', 'milestone']),
    amount: z.number().positive().optional(),
    currency: z.string().optional(),
  }),
  portfolio: z.array(z.object({
    title: z.string(),
    description: z.string(),
    imageUrl: z.string().url().optional(),
    projectUrl: z.string().url().optional(),
    completedAt: z.string().transform((val) => new Date(val)),
  })).optional(),
  deliveryTime: z.string().optional(),
  revisions: z.number().int().min(0).optional(),
});

const updateServiceSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  category: z.string().optional(),
  description: z.string().min(20).max(3000).optional(),
  skills: z.array(z.string()).min(1).optional(),
  pricing: z.object({
    type: z.enum(['fixed', 'hourly', 'milestone']),
    amount: z.number().positive().optional(),
    currency: z.string().optional(),
  }).optional(),
  deliveryTime: z.string().optional(),
  revisions: z.number().int().min(0).optional(),
});

const addPortfolioSchema = z.object({
  title: z.string(),
  description: z.string(),
  imageUrl: z.string().url().optional(),
  projectUrl: z.string().url().optional(),
  completedAt: z.string().transform((val) => new Date(val)),
});

export async function serviceRoutes(fastify: FastifyInstance) {
  // Create service
  fastify.post(
    '/',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = createServiceSchema.parse(request.body);
        const userId = (request.user as any).userId;

        const service = await serviceService.createService({
          ...data,
          companyId: userId,
        });

        return reply.status(201).send({
          success: true,
          data: { service },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'CREATE_SERVICE_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Get service by ID
  fastify.get(
    '/:id',
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const service = await serviceService.getServiceById(request.params.id);

        if (!service) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'SERVICE_NOT_FOUND',
              message: 'Service not found',
            },
          });
        }

        return reply.send({
          success: true,
          data: { service },
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: {
            code: 'GET_SERVICE_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Get my services
  fastify.get(
    '/my',
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest<{ Querystring: { status?: string } }>, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).userId;
        const { status } = request.query;

        const services = await serviceService.getServicesByCompany(userId, status);

        return reply.send({
          success: true,
          data: { services },
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: {
            code: 'GET_SERVICES_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Search services
  fastify.get(
    '/search',
    {
      preHandler: [requireAuth],
    },
    async (
      request: FastifyRequest<{
        Querystring: {
          category?: string;
          skills?: string;
          pricingType?: string;
          minRating?: string;
          sortBy?: 'rating' | 'views' | 'recent';
          page?: string;
          limit?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { category, skills, pricingType, minRating, sortBy, page, limit } = request.query;

        const result = await serviceService.searchServices({
          category,
          skills: skills ? skills.split(',') : undefined,
          pricingType,
          minRating: minRating ? parseFloat(minRating) : undefined,
          sortBy,
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
            code: 'SEARCH_SERVICES_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Update service
  fastify.patch(
    '/:id',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const updates = updateServiceSchema.parse(request.body);
        const userId = (request.user as any).userId;

        const service = await serviceService.updateService(
          request.params.id,
          userId,
          updates
        );

        if (!service) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'SERVICE_NOT_FOUND',
              message: 'Service not found or unauthorized',
            },
          });
        }

        return reply.send({
          success: true,
          data: { service },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'UPDATE_SERVICE_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Update service status
  fastify.patch(
    '/:id/status',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (request: FastifyRequest<{ Params: { id: string }; Body: { status: 'active' | 'paused' | 'inactive' } }>, reply: FastifyReply) => {
      try {
        const { status } = request.body;
        const userId = (request.user as any).userId;

        const service = await serviceService.updateServiceStatus(
          request.params.id,
          userId,
          status
        );

        if (!service) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'SERVICE_NOT_FOUND',
              message: 'Service not found or unauthorized',
            },
          });
        }

        return reply.send({
          success: true,
          data: { service },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'UPDATE_STATUS_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Delete service
  fastify.delete(
    '/:id',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).userId;
        const success = await serviceService.deleteService(request.params.id, userId);

        if (!success) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'SERVICE_NOT_FOUND',
              message: 'Service not found or unauthorized',
            },
          });
        }

        return reply.send({
          success: true,
          message: 'Service deleted successfully',
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'DELETE_SERVICE_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Add portfolio item
  fastify.post(
    '/:id/portfolio',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const portfolioItem = addPortfolioSchema.parse(request.body);
        const userId = (request.user as any).userId;

        const service = await serviceService.addPortfolioItem(
          request.params.id,
          userId,
          portfolioItem
        );

        if (!service) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'SERVICE_NOT_FOUND',
              message: 'Service not found or unauthorized',
            },
          });
        }

        return reply.send({
          success: true,
          data: { service },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'ADD_PORTFOLIO_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Remove portfolio item
  fastify.delete(
    '/:id/portfolio/:index',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (
      request: FastifyRequest<{ Params: { id: string; index: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = (request.user as any).userId;
        const service = await serviceService.removePortfolioItem(
          request.params.id,
          userId,
          parseInt(request.params.index)
        );

        if (!service) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'SERVICE_NOT_FOUND',
              message: 'Service not found or unauthorized',
            },
          });
        }

        return reply.send({
          success: true,
          data: { service },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'REMOVE_PORTFOLIO_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Save/unsave service
  fastify.post(
    '/:id/save',
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).userId;
        const service = await serviceService.toggleSaveService(request.params.id, userId);

        return reply.send({
          success: true,
          data: { service },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'SAVE_SERVICE_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Get saved services
  fastify.get(
    '/saved',
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).userId;
        const services = await serviceService.getSavedServices(userId);

        return reply.send({
          success: true,
          data: { services },
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: {
            code: 'GET_SAVED_SERVICES_FAILED',
            message: error.message,
          },
        });
      }
    }
  );
}
