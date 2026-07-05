import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from '../utils/jwt.js';
import { getUserVerificationStatus } from '../services/faceVerification.service.js';

export interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * Middleware to verify JWT token and attach user to request
 * DEMO MODE: Bypasses JWT verification and injects a mock user
 */
export async function authMiddleware(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authorization token is required',
        },
      });
    }

    const token = authHeader.substring(7);
    
    // DEMO MODE: Accept demo tokens that encode user identity
    // Format: demo-<base64 of userId:email:role>
    if (token.startsWith('demo-')) {
      try {
        const decoded = Buffer.from(token.substring(5), 'base64').toString('utf-8');
        const [userId, email, role] = decoded.split(':');
        request.user = {
          userId: userId || 'mock-user-123',
          email: email || 'explorer@example.com',
          role: role || 'user',
        };
      } catch {
        request.user = {
          userId: 'mock-user-123',
          email: 'explorer@example.com',
          role: 'user',
        };
      }
      return;
    }
    
    // Legacy: old mock token
    if (token === 'mock-access-token-demo-mode') {
      request.user = {
        userId: 'mock-user-123',
        email: 'explorer@example.com',
        role: 'user',
      };
      return;
    }

    // Production: Verify the JWT token
    const payload = verifyAccessToken(token);
    
    if (!payload) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
        },
      });
    }

    // Attach user info to request from JWT payload
    request.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };

  } catch (error) {
    console.error('Auth middleware error:', error);
    return reply.status(401).send({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
      },
    });
  }
}

/**
 * Middleware to check if user has face verification
 */
export async function requireFaceVerification(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.user) {
    return reply.status(401).send({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  }

  const faceStatus = getUserVerificationStatus(request.user.userId);
  
  if (!faceStatus.face) {
    return reply.status(403).send({
      success: false,
      error: {
        code: 'FACE_VERIFICATION_REQUIRED',
        message: 'Face verification is required for this action',
      },
    });
  }
}

/**
 * Middleware to check if user has identity verification
 */
export async function requireIdentityVerification(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.user) {
    return reply.status(401).send({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  }

  // In demo mode, skip identity verification
  // In production, this would check the database
}

// Alias for routes that import as requireAuth
export const requireAuth = authMiddleware;
