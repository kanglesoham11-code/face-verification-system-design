import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { jobService } from '../services/job.service.js';
import { requireAuth, requireFaceVerification } from '../middleware/auth.middleware.js';

// Validation schemas
const createJobSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  requirements: z.object({
    minExperience: z.number().int().min(1, 'Minimum experience must be at least 1 year. Freshers are not allowed.'),
    maxExperience: z.number().int().positive().optional(),
    skills: z.array(z.string()).min(1),
    education: z.string().optional(),
    location: z.string(),
  }),
  compensation: z.object({
    min: z.number().positive().optional(),
    max: z.number().positive().optional(),
    currency: z.string().optional(),
    type: z.enum(['annual', 'monthly', 'hourly']).optional(),
  }),
  workType: z.enum(['full_time', 'part_time', 'contract', 'remote']),
  benefits: z.array(z.string()).optional(),
  applicationProcess: z.object({
    type: z.enum(['internal', 'external']),
    externalUrl: z.string().url().optional(),
  }).optional(),
  expiresAt: z.string().transform((val) => new Date(val)).optional(),
});

const updateJobSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(20).max(5000).optional(),
  requirements: z.object({
    minExperience: z.number().int().min(1, 'Minimum experience must be at least 1 year. Freshers are not allowed.').optional(),
    maxExperience: z.number().int().positive().optional(),
    skills: z.array(z.string()).min(1).optional(),
    education: z.string().optional(),
    location: z.string().optional(),
  }).optional(),
  compensation: z.object({
    min: z.number().positive().optional(),
    max: z.number().positive().optional(),
    currency: z.string().optional(),
    type: z.enum(['annual', 'monthly', 'hourly']).optional(),
  }).optional(),
  workType: z.enum(['full_time', 'part_time', 'contract', 'remote']).optional(),
  benefits: z.array(z.string()).optional(),
  expiresAt: z.string().transform((val) => new Date(val)).optional(),
});

const applyJobSchema = z.object({
  resume: z.string().url(),
  coverLetter: z.string().max(2000).optional(),
  answers: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).optional(),
});

const updateApplicationStatusSchema = z.object({
  status: z.enum(['applied', 'screening', 'interview_scheduled', 'interviewed', 'offer', 'hired', 'rejected']),
  notes: z.string().optional(),
});

export async function jobRoutes(fastify: FastifyInstance) {
  // Create job
  fastify.post(
    '/',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = createJobSchema.parse(request.body);
        const userId = (request.user as any).userId;

        const job = await jobService.createJob({
          ...data,
          companyId: userId,
        });

        return reply.status(201).send({
          success: true,
          data: { job },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'CREATE_JOB_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Get job by ID
  fastify.get(
    '/:id',
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const job = await jobService.getJobById(request.params.id);

        if (!job) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'JOB_NOT_FOUND',
              message: 'Job not found',
            },
          });
        }

        return reply.send({
          success: true,
          data: { job },
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: {
            code: 'GET_JOB_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Get my jobs (company)
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

        const result = await jobService.getJobsByCompany(
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
            code: 'GET_JOBS_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Search jobs
  fastify.get(
    '/search',
    {
      preHandler: [requireAuth],
    },
    async (
      request: FastifyRequest<{
        Querystring: {
          skills?: string;
          location?: string;
          workType?: string;
          minExperience?: string;
          maxExperience?: string;
          minCompensation?: string;
          page?: string;
          limit?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const {
          skills,
          location,
          workType,
          minExperience,
          maxExperience,
          minCompensation,
          page,
          limit,
        } = request.query;

        const result = await jobService.searchJobs({
          skills: skills ? skills.split(',') : undefined,
          location,
          workType,
          minExperience: minExperience ? parseInt(minExperience) : undefined,
          maxExperience: maxExperience ? parseInt(maxExperience) : undefined,
          minCompensation: minCompensation ? parseFloat(minCompensation) : undefined,
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
            code: 'SEARCH_JOBS_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Get recommended jobs
  fastify.get(
    '/recommended',
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest<{ Querystring: { limit?: string } }>, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).userId;
        const { limit } = request.query;

        const jobs = await jobService.getRecommendedJobs(
          userId,
          limit ? parseInt(limit) : 10
        );

        return reply.send({
          success: true,
          data: { jobs },
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: {
            code: 'GET_RECOMMENDED_JOBS_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Update job
  fastify.patch(
    '/:id',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const updates = updateJobSchema.parse(request.body);
        const userId = (request.user as any).userId;

        const job = await jobService.updateJob(request.params.id, userId, updates);

        if (!job) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'JOB_NOT_FOUND',
              message: 'Job not found or unauthorized',
            },
          });
        }

        return reply.send({
          success: true,
          data: { job },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'UPDATE_JOB_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Update job status
  fastify.patch(
    '/:id/status',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: { status: 'active' | 'paused' | 'closed' } }>,
      reply: FastifyReply
    ) => {
      try {
        const { status } = request.body;
        const userId = (request.user as any).userId;

        const job = await jobService.updateJobStatus(request.params.id, userId, status);

        if (!job) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'JOB_NOT_FOUND',
              message: 'Job not found or unauthorized',
            },
          });
        }

        return reply.send({
          success: true,
          data: { job },
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

  // Delete job
  fastify.delete(
    '/:id',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).userId;
        const success = await jobService.deleteJob(request.params.id, userId);

        if (!success) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'JOB_NOT_FOUND',
              message: 'Job not found or unauthorized',
            },
          });
        }

        return reply.send({
          success: true,
          message: 'Job deleted successfully',
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'DELETE_JOB_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Apply for job
  fastify.post(
    '/:id/apply',
    {
      preHandler: [requireAuth, requireFaceVerification],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const data = applyJobSchema.parse(request.body);
        const userId = (request.user as any).userId;

        const application = await jobService.applyForJob({
          ...data,
          jobId: request.params.id,
          applicantId: userId,
        });

        return reply.status(201).send({
          success: true,
          data: { application },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'APPLY_JOB_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Get job applications (company)
  fastify.get(
    '/:id/applications',
    {
      preHandler: [requireAuth],
    },
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Querystring: { status?: string; sortBy?: 'recent' | 'match_score' };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = (request.user as any).userId;
        const { status, sortBy } = request.query;

        const applications = await jobService.getJobApplications(
          request.params.id,
          userId,
          status,
          sortBy
        );

        return reply.send({
          success: true,
          data: { applications },
        });
      } catch (error: any) {
        return reply.status(403).send({
          success: false,
          error: {
            code: 'GET_APPLICATIONS_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Get my applications (applicant)
  fastify.get(
    '/applications/my',
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest<{ Querystring: { status?: string } }>, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).userId;
        const { status } = request.query;

        const applications = await jobService.getApplicantApplications(userId, status);

        return reply.send({
          success: true,
          data: { applications },
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: {
            code: 'GET_APPLICATIONS_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Update application status (company)
  fastify.patch(
    '/applications/:id/status',
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { status, notes } = updateApplicationStatusSchema.parse(request.body);
        const userId = (request.user as any).userId;

        const application = await jobService.updateApplicationStatus(
          request.params.id,
          userId,
          status,
          notes
        );

        return reply.send({
          success: true,
          data: { application },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'UPDATE_APPLICATION_STATUS_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Withdraw application (applicant)
  fastify.delete(
    '/applications/:id',
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).userId;
        const application = await jobService.withdrawApplication(
          request.params.id,
          userId
        );

        return reply.send({
          success: true,
          data: { application },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'WITHDRAW_APPLICATION_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Save/unsave job
  fastify.post(
    '/:id/save',
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).userId;
        const job = await jobService.toggleSaveJob(request.params.id, userId);

        return reply.send({
          success: true,
          data: { job },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'SAVE_JOB_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Get saved jobs
  fastify.get(
    '/saved',
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).userId;
        const jobs = await jobService.getSavedJobs(userId);

        return reply.send({
          success: true,
          data: { jobs },
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: {
            code: 'GET_SAVED_JOBS_FAILED',
            message: error.message,
          },
        });
      }
    }
  );
}
