import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { eventService } from '../services/event.service.js';
import { requireAuth, requireFaceVerification } from '../middleware/auth.middleware.js';

// Validation schemas
const createEventSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  type: z.enum(['conference', 'workshop', 'meetup', 'webinar', 'networking', 'other']),
  category: z.string(),
  venue: z.object({
    type: z.enum(['physical', 'virtual', 'hybrid']),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    virtualLink: z.string().url().optional(),
    capacity: z.number().int().positive().optional(),
  }),
  date: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)).optional(),
  agenda: z.array(z.object({
    time: z.string(),
    title: z.string(),
    description: z.string().optional(),
    speaker: z.string().optional(),
  })).optional(),
  speakers: z.array(z.object({
    name: z.string(),
    title: z.string(),
    bio: z.string().optional(),
    imageUrl: z.string().url().optional(),
  })).optional(),
  tickets: z.array(z.object({
    type: z.string(),
    price: z.number().min(0),
    currency: z.string().optional(),
    quantity: z.number().int().positive(),
    description: z.string().optional(),
    benefits: z.array(z.string()).optional(),
  })).min(1),
  refundPolicy: z.object({
    enabled: z.boolean(),
    cutoffDays: z.number().int().min(0),
    refundPercentage: z.number().min(0).max(100),
  }).optional(),
  images: z.array(z.string().url()).optional(),
  tags: z.array(z.string()).optional(),
  visibility: z.enum(['public', 'private', 'invite_only']).optional(),
});

const updateEventSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(20).max(5000).optional(),
  venue: z.object({
    type: z.enum(['physical', 'virtual', 'hybrid']),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    virtualLink: z.string().url().optional(),
    capacity: z.number().int().positive().optional(),
  }).optional(),
  date: z.string().transform((val) => new Date(val)).optional(),
  endDate: z.string().transform((val) => new Date(val)).optional(),
  agenda: z.array(z.object({
    time: z.string(),
    title: z.string(),
    description: z.string().optional(),
    speaker: z.string().optional(),
  })).optional(),
  speakers: z.array(z.object({
    name: z.string(),
    title: z.string(),
    bio: z.string().optional(),
    imageUrl: z.string().url().optional(),
  })).optional(),
  tickets: z.array(z.object({
    type: z.string(),
    price: z.number().min(0),
    currency: z.string().optional(),
    quantity: z.number().int().positive(),
    description: z.string().optional(),
    benefits: z.array(z.string()).optional(),
  })).optional(),
  refundPolicy: z.object({
    enabled: z.boolean(),
    cutoffDays: z.number().int().min(0),
    refundPercentage: z.number().min(0).max(100),
  }).optional(),
  images: z.array(z.string().url()).optional(),
  tags: z.array(z.string()).optional(),
  visibility: z.enum(['public', 'private', 'invite_only']).optional(),
});

const purchaseTicketSchema = z.object({
  ticketType: z.string(),
  paymentId: z.string().optional(),
});

const requestRefundSchema = z.object({
  reason: z.string().min(10).max(500),
});

const addReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

const reportFraudSchema = z.object({
  reason: z.string().min(10).max(500),
});

export async function eventRoutes(fastify: FastifyInstance) {
  // Create event
  fastify.post(
    '/',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = createEventSchema.parse(request.body);
        const userId = (request.user as any).userId;

        const event = await eventService.createEvent({
          ...data,
          organizerId: userId,
        });

        return reply.status(201).send({
          success: true,
          data: { event },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'CREATE_EVENT_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Get event by ID
  fastify.get(
    '/:id',
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const event = await eventService.getEventById(request.params.id);

        if (!event) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'EVENT_NOT_FOUND',
              message: 'Event not found',
            },
          });
        }

        return reply.send({
          success: true,
          data: { event },
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: {
            code: 'GET_EVENT_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Get my events
  fastify.get(
    '/my',
    {
      preHandler: [requireAuth],
    },
    async (
      request: FastifyRequest<{ Querystring: { status?: string; page?: string; limit?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = (request.user as any).userId;
        const { status, page, limit } = request.query;

        const result = await eventService.getEventsByOrganizer(
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
            code: 'GET_EVENTS_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Search events
  fastify.get(
    '/search',
    {
      preHandler: [requireAuth],
    },
    async (
      request: FastifyRequest<{
        Querystring: {
          type?: string;
          category?: string;
          city?: string;
          startDate?: string;
          endDate?: string;
          minTrustScore?: string;
          tags?: string;
          venueType?: string;
          page?: string;
          limit?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const {
          type,
          category,
          city,
          startDate,
          endDate,
          minTrustScore,
          tags,
          venueType,
          page,
          limit,
        } = request.query;

        const result = await eventService.searchEvents({
          type,
          category,
          city,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          minTrustScore: minTrustScore ? parseFloat(minTrustScore) : undefined,
          tags: tags ? tags.split(',') : undefined,
          venueType,
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
            code: 'SEARCH_EVENTS_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Update event
  fastify.patch(
    '/:id',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const updates = updateEventSchema.parse(request.body);
        const userId = (request.user as any).userId;

        const event = await eventService.updateEvent(request.params.id, userId, updates);

        if (!event) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'EVENT_NOT_FOUND',
              message: 'Event not found or unauthorized',
            },
          });
        }

        return reply.send({
          success: true,
          data: { event },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'UPDATE_EVENT_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Publish event
  fastify.patch(
    '/:id/publish',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).userId;
        const event = await eventService.publishEvent(request.params.id, userId);

        if (!event) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'EVENT_NOT_FOUND',
              message: 'Event not found or unauthorized',
            },
          });
        }

        return reply.send({
          success: true,
          data: { event },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'PUBLISH_EVENT_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Cancel event
  fastify.delete(
    '/:id',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).userId;
        const event = await eventService.cancelEvent(request.params.id, userId);

        if (!event) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'EVENT_NOT_FOUND',
              message: 'Event not found or unauthorized',
            },
          });
        }

        return reply.send({
          success: true,
          data: { event },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'CANCEL_EVENT_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Purchase ticket
  fastify.post(
    '/:id/tickets',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { ticketType, paymentId } = purchaseTicketSchema.parse(request.body);
        const userId = (request.user as any).userId;

        const ticket = await eventService.purchaseTicket({
          eventId: request.params.id,
          userId,
          ticketType,
          paymentId,
        });

        return reply.status(201).send({
          success: true,
          data: { ticket },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'PURCHASE_TICKET_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Get my tickets
  fastify.get(
    '/tickets/my',
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest<{ Querystring: { status?: string } }>, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).userId;
        const { status } = request.query;

        const tickets = await eventService.getUserTickets(userId, status);

        return reply.send({
          success: true,
          data: { tickets },
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: {
            code: 'GET_TICKETS_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Request refund
  fastify.post(
    '/tickets/:id/refund',
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { reason } = requestRefundSchema.parse(request.body);
        const userId = (request.user as any).userId;

        const ticket = await eventService.requestRefund(request.params.id, userId, reason);

        return reply.send({
          success: true,
          data: { ticket },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'REQUEST_REFUND_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Process refund (organizer)
  fastify.patch(
    '/tickets/:id/refund',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: { approved: boolean } }>,
      reply: FastifyReply
    ) => {
      try {
        const { approved } = request.body;
        const userId = (request.user as any).userId;

        const ticket = await eventService.processRefund(request.params.id, userId, approved);

        return reply.send({
          success: true,
          data: { ticket },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'PROCESS_REFUND_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Check-in with QR code
  fastify.post(
    '/checkin',
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest<{ Body: { qrCode: string } }>, reply: FastifyReply) => {
      try {
        const { qrCode } = request.body;
        const result = await eventService.checkIn(qrCode);

        return reply.send({
          success: true,
          data: result,
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'CHECKIN_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Add review
  fastify.post(
    '/:id/reviews',
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { rating, comment } = addReviewSchema.parse(request.body);
        const userId = (request.user as any).userId;

        const event = await eventService.addReview(request.params.id, userId, rating, comment);

        return reply.send({
          success: true,
          data: { event },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'ADD_REVIEW_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Report fraud
  fastify.post(
    '/:id/report',
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { reason } = reportFraudSchema.parse(request.body);
        const userId = (request.user as any).userId;

        const event = await eventService.reportFraud(request.params.id, userId, reason);

        return reply.send({
          success: true,
          data: { event },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'REPORT_FRAUD_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Save/unsave event
  fastify.post(
    '/:id/save',
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).userId;
        const event = await eventService.toggleSaveEvent(request.params.id, userId);

        return reply.send({
          success: true,
          data: { event },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'SAVE_EVENT_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Get saved events
  fastify.get(
    '/saved',
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).userId;
        const events = await eventService.getSavedEvents(userId);

        return reply.send({
          success: true,
          data: { events },
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: {
            code: 'GET_SAVED_EVENTS_FAILED',
            message: error.message,
          },
        });
      }
    }
  );
}
