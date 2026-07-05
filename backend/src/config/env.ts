import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  
  // Database (optional – running in demo mode without DB)
  MONGODB_URI: z.string().optional().default(''),
  REDIS_URL: z.string().optional().default('redis://localhost:6379'),
  
  // JWT
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  
  // Cloudinary (Free Storage Alternative)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  
  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().default('noreply@syncup.app'),
  
  // AI (Free Alternative - Groq)
  GROQ_API_KEY: z.string().optional(),
  
  // Feature Flags
  ENABLE_FACE_VERIFICATION: z.string().default('true'),
  ENABLE_AI_ASSISTANT: z.string().default('true'),
  ENABLE_PAYMENTS: z.string().default('false'),
  
  // Security
  BCRYPT_ROUNDS: z.string().default('12'),
  RATE_LIMIT_MAX: z.string().default('100'),
  RATE_LIMIT_WINDOW: z.string().default('60000'),
  
  // Face Verification
  FACE_SIMILARITY_THRESHOLD: z.string().default('0.85'),
  LIVENESS_SCORE_THRESHOLD: z.string().default('0.8'),
  MAX_VERIFICATION_ATTEMPTS: z.string().default('3'),
  VERIFICATION_COOLDOWN_HOURS: z.string().default('24'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = {
  ...parsed.data,
  PORT: parseInt(parsed.data.PORT),
  BCRYPT_ROUNDS: parseInt(parsed.data.BCRYPT_ROUNDS),
  RATE_LIMIT_MAX: parseInt(parsed.data.RATE_LIMIT_MAX),
  RATE_LIMIT_WINDOW: parseInt(parsed.data.RATE_LIMIT_WINDOW),
  FACE_SIMILARITY_THRESHOLD: parseFloat(parsed.data.FACE_SIMILARITY_THRESHOLD),
  LIVENESS_SCORE_THRESHOLD: parseFloat(parsed.data.LIVENESS_SCORE_THRESHOLD),
  MAX_VERIFICATION_ATTEMPTS: parseInt(parsed.data.MAX_VERIFICATION_ATTEMPTS),
  VERIFICATION_COOLDOWN_HOURS: parseInt(parsed.data.VERIFICATION_COOLDOWN_HOURS),
  ENABLE_FACE_VERIFICATION: parsed.data.ENABLE_FACE_VERIFICATION === 'true',
  ENABLE_AI_ASSISTANT: parsed.data.ENABLE_AI_ASSISTANT === 'true',
  ENABLE_PAYMENTS: parsed.data.ENABLE_PAYMENTS === 'true',
};
