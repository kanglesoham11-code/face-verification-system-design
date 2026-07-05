import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';
import { faceVerificationService } from '../services/faceVerification.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware.js';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(100),
  phone: z.string().optional(),
  referredBy: z.string().optional().refine(
    (val) => !val || val.length === 8,
    { message: 'Referral code must be exactly 8 characters' }
  ),
});

const verifyEmailSchema = z.object({
  userId: z.string(),
  otp: z.string().length(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const verifyFaceSchema = z.object({
  embedding: z.array(z.number()).min(128).max(128),
  livenessScore: z.number().min(0).max(1),
  faceConfidence: z.number().min(0).max(100).optional(),
});

const verifyFaceLoginSchema = z.object({
  embedding: z.array(z.number()).min(128).max(128),
  livenessScore: z.number().min(0).max(1),
});

export async function authRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/v1/auth/register
   * Register a new user
   */
  fastify.post('/register', async (request, reply) => {
    try {
      const body = registerSchema.parse(request.body);
      const result = await authService.register(body);

      return reply.status(201).send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'REGISTRATION_FAILED',
          message: error.message,
        },
      });
    }
  });

  /**
   * POST /api/v1/auth/verify-email
   * Verify email with OTP
   */
  fastify.post('/verify-email', async (request, reply) => {
    try {
      const body = verifyEmailSchema.parse(request.body);
      const result = await authService.verifyEmail(body.userId, body.otp);

      // If tokens are returned, set refresh token cookie
      if (result.tokens) {
        reply.setCookie('refreshToken', result.tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 30 * 24 * 60 * 60, // 30 days
          path: '/',
        });
      }

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VERIFICATION_FAILED',
          message: error.message,
        },
      });
    }
  });

  /**
   * POST /api/v1/auth/login
   * Login user
   */
  fastify.post('/login', async (request, reply) => {
    try {
      const body = loginSchema.parse(request.body);
      const result = await authService.login(body);

      // Set refresh token in HTTP-only cookie
      reply.setCookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      });

      return reply.send({
        success: true,
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken,
        },
      });
    } catch (error: any) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: error.message,
        },
      });
    }
  });

  /**
   * POST /api/v1/auth/refresh
   * Refresh access token
   */
  fastify.post('/refresh', async (request, reply) => {
    try {
      const refreshToken = request.cookies.refreshToken || (request.body as any)?.refreshToken;
      
      if (!refreshToken) {
        return reply.status(401).send({
          success: false,
          error: {
            code: 'MISSING_REFRESH_TOKEN',
            message: 'Refresh token not provided',
          },
        });
      }

      const tokens = await authService.refreshAccessToken(refreshToken);

      // Set new refresh token in cookie
      reply.setCookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
      });

      return reply.send({
        success: true,
        data: {
          accessToken: tokens.accessToken,
        },
      });
    } catch (error: any) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'REFRESH_FAILED',
          message: error.message,
        },
      });
    }
  });

  /**
   * POST /api/v1/auth/logout
   * Logout user
   */
  fastify.post('/logout', async (request, reply) => {
    reply.clearCookie('refreshToken');
    return reply.send({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  });

  /**
   * POST /api/v1/auth/verify-face
   * Submit face embedding for verification
   * Protected route - requires authentication
   */
  fastify.post(
    '/verify-face',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const body = verifyFaceSchema.parse(request.body);

        // Verify face using embedding
        const result = await faceVerificationService.verifyFace(
          request.user!.userId,
          body.embedding,
          body.livenessScore,
          body.faceConfidence || 95
        );

        if (!result.success) {
          return reply.status(400).send({
            success: false,
            error: result.error,
          });
        }

        return reply.send({
          success: true,
          data: {
            verified: result.verified,
            ...result.data,
          },
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: {
            code: 'VERIFICATION_ERROR',
            message: error.message,
          },
        });
      }
    }
  );

  /**
   * POST /api/v1/auth/verify-face-login
   * Verify face for login (additional security)
   * Protected route - requires authentication
   */
  fastify.post(
    '/verify-face-login',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const body = verifyFaceLoginSchema.parse(request.body);

        // Verify face for login
        const result = await faceVerificationService.verifyFaceForLogin(
          request.user!.userId,
          body.embedding,
          body.livenessScore
        );

        if (!result.success) {
          return reply.status(400).send({
            success: false,
            error: result.error,
          });
        }

        return reply.send({
          success: true,
          data: {
            verified: result.verified,
            ...result.data,
          },
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: {
            code: 'FACE_LOGIN_ERROR',
            message: error.message,
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/auth/verification-status
   * Get current user's verification status
   * Protected route
   */
  fastify.get(
    '/verification-status',
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const status = await authService.getVerificationStatus(request.user!.userId);

        return reply.send({
          success: true,
          data: status,
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: {
            code: 'STATUS_ERROR',
            message: error.message,
          },
        });
      }
    }
  );
}
