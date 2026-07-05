import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { profileService } from '../services/profile.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware.js';

// Validation schemas
const updateProfileSchema = z.object({
  headline: z.string().max(120).optional(),
  bio: z.string().max(2000).optional(),
  location: z.string().optional(),
  industry: z.string().optional(),
  skills: z.array(z.string()).optional(),
  experience: z.array(z.any()).optional(),
  education: z.array(z.any()).optional(),
  socialLinks: z.object({
    linkedin: z.string().url().optional(),
    github: z.string().url().optional(),
    twitter: z.string().url().optional(),
    website: z.string().url().optional(),
    portfolio: z.string().url().optional(),
  }).optional(),
  avatar: z.string().url().optional(),
  coverImage: z.string().url().optional(),
});

const searchProfilesSchema = z.object({
  keyword: z.string().optional(),
  industry: z.string().optional(),
  location: z.string().optional(),
  skills: z.array(z.string()).optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

export async function profileRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/v1/profiles/:userId
   * Get public profile
   */
  fastify.get(
    '/:userId',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { userId } = request.params as { userId: string };
        const profile = await profileService.getProfile(userId, request.user!.userId);

        return reply.send({
          success: true,
          data: profile,
        });
      } catch (error: any) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'PROFILE_NOT_FOUND',
            message: error.message,
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/profiles/me
   * Get own profile
   */
  fastify.get(
    '/me',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const profile = await profileService.getProfile(request.user!.userId);

        return reply.send({
          success: true,
          data: profile,
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
   * PATCH /api/v1/profiles/me
   * Update own profile
   */
  fastify.patch(
    '/me',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const body = updateProfileSchema.parse(request.body);
        const profile = await profileService.updateProfile(request.user!.userId, body);

        return reply.send({
          success: true,
          data: profile,
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
   * GET /api/v1/profiles/me/analytics
   * Get profile analytics
   */
  fastify.get(
    '/me/analytics',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const analytics = await profileService.getProfileAnalytics(request.user!.userId);

        return reply.send({
          success: true,
          data: analytics,
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
   * GET /api/v1/profiles/search
   * Search profiles
   */
  fastify.get(
    '/search',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const query = searchProfilesSchema.parse(request.query);
        const profiles = await profileService.searchProfiles(query);

        return reply.send({
          success: true,
          data: profiles,
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
   * GET /api/v1/profiles/suggestions
   * Get connection suggestions
   */
  fastify.get(
    '/suggestions',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { limit } = request.query as { limit?: string };
        const suggestions = await profileService.getConnectionSuggestions(
          request.user!.userId,
          limit ? parseInt(limit) : 10
        );

        return reply.send({
          success: true,
          data: suggestions,
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
