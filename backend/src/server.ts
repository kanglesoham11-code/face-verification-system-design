import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import { env } from './config/env.js';
import { connectMongoDB, connectRedis } from './config/database.js';
import { authRoutes } from './routes/auth.routes.js';

const fastify = Fastify({
  logger: {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
  bodyLimit: 104857600, // 100MB for base64 image/video uploads
});

// Register plugins
async function registerPlugins() {
  // Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  });

  // CORS
  await fastify.register(cors, {
    origin: env.FRONTEND_URL,
    credentials: true,
  });

  // JWT
  await fastify.register(jwt, {
    secret: env.JWT_ACCESS_SECRET,
  });

  // Cookies
  await fastify.register(cookie, {
    secret: env.JWT_REFRESH_SECRET,
  });

  // Rate limiting (with optional Redis backing)
  const redisClient = await connectRedis();
  const rateLimitConfig: any = {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW,
  };
  if (redisClient) {
    rateLimitConfig.redis = redisClient;
  }
  await fastify.register(rateLimit, rateLimitConfig);

  // Multipart for file uploads
  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 1,
    },
  });
}

// Register routes
async function registerRoutes() {
  // Health check
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    };
  });

  // API v1 routes
  await fastify.register(authRoutes, { prefix: '/api/v1/auth' });
  
  // P1: Promotion & Ad Wallet routes
  const { promotionRoutes, adWalletRoutes } = await import('./routes/promotion.routes.js');
  await fastify.register(promotionRoutes, { prefix: '/api/v1/promotions' });
  await fastify.register(adWalletRoutes, { prefix: '/api/v1/ad-wallet' });
  
  // P2: Profile, Connection & Post routes
  const { profileRoutes } = await import('./routes/profile.routes.js');
  const { connectionRoutes } = await import('./routes/connection.routes.js');
  const { postRoutes } = await import('./routes/post.routes.js');
  await fastify.register(profileRoutes, { prefix: '/api/v1/profiles' });
  await fastify.register(connectionRoutes, { prefix: '/api/v1/connections' });
  await fastify.register(postRoutes, { prefix: '/api/v1/posts' });
  
  // P3: Opportunity routes
  const { opportunityRoutes } = await import('./routes/opportunity.routes.js');
  await fastify.register(opportunityRoutes, { prefix: '/api/v1/opportunities' });
  
  // P4: Project & Service routes
  const { projectRoutes } = await import('./routes/project.routes.js');
  const { serviceRoutes } = await import('./routes/service.routes.js');
  await fastify.register(projectRoutes, { prefix: '/api/v1/projects' });
  await fastify.register(serviceRoutes, { prefix: '/api/v1/services' });
  
  // P5: Job routes
  const { jobRoutes } = await import('./routes/job.routes.js');
  await fastify.register(jobRoutes, { prefix: '/api/v1/jobs' });
  
  // P6: Event routes
  const { eventRoutes } = await import('./routes/event.routes.js');
  await fastify.register(eventRoutes, { prefix: '/api/v1/events' });
  
  // P7: AI routes
  const { aiRoutes } = await import('./routes/ai.routes.js');
  await fastify.register(aiRoutes, { prefix: '/api/v1/ai' });
  
  // P8: Company routes
  const { companyRoutes } = await import('./routes/company.routes.js');
  await fastify.register(companyRoutes, { prefix: '/api/v1/companies' });
  
  // P9: Referral routes
  const { referralRoutes } = await import('./routes/referral.routes.js');
  await fastify.register(referralRoutes, { prefix: '/api/v1/referrals' });
}

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);

  // Validation errors
  if (error.validation) {
    return reply.status(422).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: error.validation,
      },
    });
  }

  // Rate limit errors
  if (error.statusCode === 429) {
    return reply.status(429).send({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
      },
    });
  }

  // Generic error
  return reply.status(error.statusCode || 500).send({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: env.NODE_ENV === 'production' 
        ? 'An error occurred' 
        : error.message,
    },
  });
});

// Start server
async function start() {
  try {
    // Connect to databases
    await connectMongoDB();
    
    // Register plugins and routes
    await registerPlugins();
    await registerRoutes();

    // Start listening
    await fastify.listen({
      port: env.PORT,
      host: '0.0.0.0',
    });

    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 SyncUp Platform Server                          ║
║                                                       ║
║   Environment: ${env.NODE_ENV.padEnd(37)}║
║   Port: ${env.PORT.toString().padEnd(43)}║
║   URL: http://localhost:${env.PORT.toString().padEnd(30)}║
║                                                       ║
║   Status: ✅ Running                                  ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
    `);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await fastify.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await fastify.close();
  process.exit(0);
});

// Start the server
start();
