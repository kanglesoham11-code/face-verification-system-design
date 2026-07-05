import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { postService } from '../services/post.service.js';
import { authMiddleware, AuthenticatedRequest, requireFaceVerification } from '../middleware/auth.middleware.js';

// Validation schemas
const createPostSchema = z.object({
  content: z.string().max(5000).default(''),
  mediaUrls: z.array(z.string()).optional(),
  type: z.enum(['update', 'article', 'opportunity', 'event_promo', 'service']).optional(),
  tags: z.array(z.string()).optional(),
  visibility: z.enum(['public', 'connections', 'private']).optional(),
});

const updatePostSchema = z.object({
  content: z.string().min(1).max(5000),
});

const createCommentSchema = z.object({
  content: z.string().min(1).max(1000),
  parentCommentId: z.string().optional(),
});

export async function postRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/v1/posts
   * Create a post
   */
  fastify.post(
    '/',
    { preHandler: [authMiddleware] },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const body = createPostSchema.parse(request.body);
        const post = await postService.createPost({
          authorId: request.user!.userId,
          ...body,
        });

        return reply.status(201).send({
          success: true,
          data: post,
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'POST_CREATION_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/posts/:id
   * Get post by ID
   */
  fastify.get(
    '/:id',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const post = await postService.getPost(id, request.user!.userId);

        return reply.send({
          success: true,
          data: post,
        });
      } catch (error: any) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'POST_NOT_FOUND',
            message: error.message,
          },
        });
      }
    }
  );

  /**
   * PATCH /api/v1/posts/:id
   * Update post
   */
  fastify.patch(
    '/:id',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = updatePostSchema.parse(request.body);
        const post = await postService.updatePost(id, request.user!.userId, body.content);

        return reply.send({
          success: true,
          data: post,
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
   * DELETE /api/v1/posts/:id
   * Delete post
   */
  fastify.delete(
    '/:id',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        await postService.deletePost(id, request.user!.userId);

        return reply.send({
          success: true,
          data: { message: 'Post deleted successfully' },
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
   * POST /api/v1/posts/:id/like
   * Like/unlike post
   */
  fastify.post(
    '/:id/like',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const result = await postService.toggleLike(id, request.user!.userId);

        return reply.send({
          success: true,
          data: result,
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'LIKE_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  /**
   * POST /api/v1/posts/:id/comment
   * Add comment to post
   */
  fastify.post(
    '/:id/comment',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = createCommentSchema.parse(request.body);
        const comment = await postService.addComment({
          postId: id,
          authorId: request.user!.userId,
          content: body.content,
          parentCommentId: body.parentCommentId,
        });

        return reply.status(201).send({
          success: true,
          data: comment,
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'COMMENT_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/posts/:id/comments
   * Get comments for post
   */
  fastify.get(
    '/:id/comments',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { limit, offset } = request.query as { limit?: string; offset?: string };
        const comments = await postService.getComments(
          id,
          limit ? parseInt(limit) : 20,
          offset ? parseInt(offset) : 0
        );

        return reply.send({
          success: true,
          data: comments,
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
   * GET /api/v1/posts/feed
   * Get personalized feed
   */
  fastify.get(
    '/feed',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { limit, offset } = request.query as { limit?: string; offset?: string };
        const feed = await postService.getFeed(
          request.user!.userId,
          limit ? parseInt(limit) : 20,
          offset ? parseInt(offset) : 0
        );

        return reply.send({
          success: true,
          data: feed,
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
   * GET /api/v1/posts/user/:userId
   * Get user's posts
   */
  fastify.get(
    '/user/:userId',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { userId } = request.params as { userId: string };
        const { limit, offset } = request.query as { limit?: string; offset?: string };
        const posts = await postService.getUserPosts(
          userId,
          limit ? parseInt(limit) : 20,
          offset ? parseInt(offset) : 0
        );

        return reply.send({
          success: true,
          data: posts,
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
   * POST /api/v1/posts/:id/save
   * Save/unsave post
   */
  fastify.post(
    '/:id/save',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const result = await postService.toggleSave(id, request.user!.userId);

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
   * POST /api/v1/posts/:id/share
   * Share post
   */
  fastify.post(
    '/:id/share',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        await postService.sharePost(id, request.user!.userId);

        return reply.send({
          success: true,
          data: { message: 'Post shared successfully' },
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'SHARE_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/posts/saved
   * Get saved posts
   */
  fastify.get(
    '/saved',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { limit, offset } = request.query as { limit?: string; offset?: string };
        const posts = await postService.getSavedPosts(
          request.user!.userId,
          limit ? parseInt(limit) : 20,
          offset ? parseInt(offset) : 0
        );

        return reply.send({
          success: true,
          data: posts,
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
