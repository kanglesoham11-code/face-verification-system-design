import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { connectionService, getAllRegisteredUsers, registerUser } from '../services/connection.service.js';
import { authMiddleware, AuthenticatedRequest, requireFaceVerification } from '../middleware/auth.middleware.js';

// Validation schemas
const sendRequestSchema = z.object({
  recipientId: z.string(),
  message: z.string().max(300).optional(),
});

const respondRequestSchema = z.object({
  action: z.enum(['accept', 'decline']),
});

const followSchema = z.object({
  userId: z.string(),
});

export async function connectionRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/v1/connections/request
   * Send connection request
   */
  fastify.post(
    '/request',
    { preHandler: [authMiddleware] },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const body = sendRequestSchema.parse(request.body);
        const connection = await connectionService.sendRequest({
          requesterId: request.user!.userId,
          recipientId: body.recipientId,
          message: body.message,
        });

        return reply.status(201).send({
          success: true,
          data: connection,
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'REQUEST_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  /**
   * PATCH /api/v1/connections/:id/respond
   * Accept or decline connection request
   */
  fastify.patch(
    '/:id/respond',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = respondRequestSchema.parse(request.body);

        const connection = await connectionService.respondToRequest(
          id,
          request.user!.userId,
          body.action
        );

        return reply.send({
          success: true,
          data: connection,
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
   * DELETE /api/v1/connections/:id
   * Withdraw connection request
   */
  fastify.delete(
    '/:id',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        await connectionService.withdrawRequest(id, request.user!.userId);

        return reply.send({
          success: true,
          data: { message: 'Connection request withdrawn' },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'WITHDRAW_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  /**
   * DELETE /api/v1/connections/remove/:userId
   * Remove connection
   */
  fastify.delete(
    '/remove/:userId',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { userId } = request.params as { userId: string };
        await connectionService.removeConnection(request.user!.userId, userId);

        return reply.send({
          success: true,
          data: { message: 'Connection removed' },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'REMOVE_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/connections
   * Get user's connections
   */
  fastify.get(
    '/',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { limit } = request.query as { limit?: string };
        const connections = await connectionService.getConnections(
          request.user!.userId,
          limit ? parseInt(limit) : 50
        );

        return reply.send({
          success: true,
          data: connections,
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
   * GET /api/v1/connections/pending
   * Get pending connection requests
   */
  fastify.get(
    '/pending',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const requests = await connectionService.getPendingRequests(request.user!.userId);

        return reply.send({
          success: true,
          data: requests,
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
   * GET /api/v1/connections/sent
   * Get sent connection requests
   */
  fastify.get(
    '/sent',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const requests = await connectionService.getSentRequests(request.user!.userId);

        return reply.send({
          success: true,
          data: requests,
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
   * POST /api/v1/connections/follow
   * Follow a user
   */
  fastify.post(
    '/follow',
    { preHandler: [authMiddleware] },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const body = followSchema.parse(request.body);
        await connectionService.followUser(request.user!.userId, body.userId);

        return reply.send({
          success: true,
          data: { message: 'User followed successfully' },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'FOLLOW_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  /**
   * POST /api/v1/connections/unfollow
   * Unfollow a user
   */
  fastify.post(
    '/unfollow',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const body = followSchema.parse(request.body);
        await connectionService.unfollowUser(request.user!.userId, body.userId);

        return reply.send({
          success: true,
          data: { message: 'User unfollowed successfully' },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'UNFOLLOW_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/connections/status/:userId
   * Get connection status with another user
   */
  fastify.get(
    '/status/:userId',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { userId } = request.params as { userId: string };
        const status = await connectionService.getConnectionStatus(
          request.user!.userId,
          userId
        );

        return reply.send({
          success: true,
          data: status,
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
   * GET /api/v1/connections/suggestions
   * Get user suggestions (people not yet connected)
   */
  fastify.get(
    '/suggestions',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const suggestions = await connectionService.getSuggestions(request.user!.userId);
        return reply.send({ success: true, data: suggestions });
      } catch (error: any) {
        return reply.status(500).send({ success: false, error: { code: 'FETCH_FAILED', message: error.message } });
      }
    }
  );

  /**
   * GET /api/v1/connections/users
   * Get ALL registered users for the Network page
   */
  fastify.get(
    '/users',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const users = getAllRegisteredUsers().filter(u => u.id !== request.user!.userId);
        // Add connection status for each user
        const usersWithStatus = await Promise.all(
          users.map(async (u: any) => {
            const status = await connectionService.getConnectionStatus(request.user!.userId, u.id);
            return { ...u, connectionStatus: status };
          })
        );
        return reply.send({ success: true, data: usersWithStatus });
      } catch (error: any) {
        return reply.status(500).send({ success: false, error: { code: 'FETCH_FAILED', message: error.message } });
      }
    }
  );

  /**
   * POST /api/v1/connections/register-user
   * Register a user in the network registry (called on login/signup)
   */
  fastify.post(
    '/register-user',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const body = request.body as any;
        registerUser({
          id: body.id || request.user!.userId,
          name: body.name || 'Unknown',
          email: body.email || request.user!.email,
          role: body.role || 'user',
          faceImage: body.faceImage,
          verificationStatus: body.verificationStatus,
        });
        return reply.send({ success: true });
      } catch (error: any) {
        return reply.status(400).send({ success: false, error: { code: 'REGISTER_FAILED', message: error.message } });
      }
    }
  );
}
