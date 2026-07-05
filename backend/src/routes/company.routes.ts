import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { companyService } from '../services/company.service.js';
import { requireAuth, requireFaceVerification } from '../middleware/auth.middleware.js';

// Validation schemas
const createCompanySchema = z.object({
  name: z.string().min(2).max(200),
  domain: z.string().optional(),
  industry: z.string(),
  size: z.enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']),
  description: z.string().max(2000).optional(),
  website: z.string().url().optional(),
  logo: z.string().url().optional(),
});

const updateCompanySchema = z.object({
  name: z.string().min(2).max(200).optional(),
  industry: z.string().optional(),
  size: z.enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']).optional(),
  description: z.string().max(2000).optional(),
  website: z.string().url().optional(),
  logo: z.string().url().optional(),
});

const uploadDocumentSchema = z.object({
  type: z.enum(['gst', 'mca', 'incorporation', 'other']),
  url: z.string().url(),
});

const requestVerificationSchema = z.object({
  method: z.enum(['email', 'file', 'dns']),
});

const reviewDocumentSchema = z.object({
  documentIndex: z.number().int().min(0),
  approved: z.boolean(),
  rejectionReason: z.string().optional(),
});

export async function companyRoutes(fastify: FastifyInstance) {
  // Create company
  fastify.post(
    '/',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = createCompanySchema.parse(request.body);
        const userId = (request.user as any).userId;

        const company = await companyService.createCompany({
          ...data,
          ownerId: userId,
        });

        return reply.status(201).send({
          success: true,
          data: { company },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'CREATE_COMPANY_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Get my company
  fastify.get(
    '/my',
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).userId;
        const company = await companyService.getCompanyByOwner(userId);

        if (!company) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'COMPANY_NOT_FOUND',
              message: 'Company not found',
            },
          });
        }

        return reply.send({
          success: true,
          data: { company },
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: {
            code: 'GET_COMPANY_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Get company by ID
  fastify.get(
    '/:id',
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const company = await companyService.getCompanyById(request.params.id);

        if (!company) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'COMPANY_NOT_FOUND',
              message: 'Company not found',
            },
          });
        }

        return reply.send({
          success: true,
          data: { company },
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: {
            code: 'GET_COMPANY_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Update company
  fastify.patch(
    '/:id',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const updates = updateCompanySchema.parse(request.body);
        const userId = (request.user as any).userId;

        const company = await companyService.updateCompany(
          request.params.id,
          userId,
          updates
        );

        if (!company) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'COMPANY_NOT_FOUND',
              message: 'Company not found or unauthorized',
            },
          });
        }

        return reply.send({
          success: true,
          data: { company },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'UPDATE_COMPANY_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Upload verification document
  fastify.post(
    '/:id/documents',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const document = uploadDocumentSchema.parse(request.body);
        const userId = (request.user as any).userId;

        const company = await companyService.uploadVerificationDocument(
          request.params.id,
          userId,
          document
        );

        if (!company) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'COMPANY_NOT_FOUND',
              message: 'Company not found or unauthorized',
            },
          });
        }

        return reply.send({
          success: true,
          data: { company },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'UPLOAD_DOCUMENT_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Request domain verification
  fastify.post(
    '/:id/verify/domain',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { method } = requestVerificationSchema.parse(request.body);
        const userId = (request.user as any).userId;

        const result = await companyService.requestDomainVerification(
          request.params.id,
          userId,
          method
        );

        return reply.send({
          success: true,
          data: result,
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'REQUEST_VERIFICATION_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Verify DNS
  fastify.post(
    '/:id/verify/dns',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).userId;
        const company = await companyService.verifyDNS(request.params.id, userId);

        return reply.send({
          success: true,
          data: { company },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'DNS_VERIFICATION_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Search companies
  fastify.get(
    '/search',
    {
      preHandler: [requireAuth],
    },
    async (
      request: FastifyRequest<{
        Querystring: {
          industry?: string;
          size?: string;
          verified?: string;
          page?: string;
          limit?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { industry, size, verified, page, limit } = request.query;

        const result = await companyService.searchCompanies({
          industry,
          size,
          verified: verified === 'true',
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
            code: 'SEARCH_COMPANIES_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Admin: Get pending verifications
  fastify.get(
    '/admin/pending',
    {
      preHandler: [requireAuth],
    },
    async (
      request: FastifyRequest<{ Querystring: { page?: string; limit?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { page, limit } = request.query;

        const result = await companyService.getPendingVerifications(
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
            code: 'GET_PENDING_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Admin: Review documents
  fastify.post(
    '/:id/admin/review',
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { documentIndex, approved, rejectionReason } = reviewDocumentSchema.parse(
          request.body
        );
        const adminId = (request.user as any).userId;

        const company = await companyService.reviewDocuments(
          request.params.id,
          adminId,
          documentIndex,
          approved,
          rejectionReason
        );

        return reply.send({
          success: true,
          data: { company },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'REVIEW_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Admin: Manual verification
  fastify.post(
    '/:id/admin/verify',
    {
      preHandler: [requireAuth],
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: { notes?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { notes } = request.body;
        const adminId = (request.user as any).userId;

        const company = await companyService.manualVerify(
          request.params.id,
          adminId,
          notes
        );

        return reply.send({
          success: true,
          data: { company },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'MANUAL_VERIFY_FAILED',
            message: error.message,
          },
        });
      }
    }
  );
}
