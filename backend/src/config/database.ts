import { createClient } from 'redis';
import { env } from './env.js';

// MongoDB is removed – we will use Supabase/Prisma in the future.
// For now, running in full demo mode with in-memory stores.

export async function connectDatabase() {
  console.log('⚠️  Running in demo mode — all data is stored in-memory');
  return true;
}

// Keep connectMongoDB alias for backward compat with server.ts
export const connectMongoDB = connectDatabase;

export async function connectRedis() {
  try {
    const redis = createClient({
      url: env.REDIS_URL,
      socket: {
        connectTimeoutMs: 3000,
        reconnectStrategy: false,
      },
    });

    redis.on('error', (err: any) => {
      if (err.code === 'ECONNREFUSED') {
        console.log('⚠️  Redis not available, using in-memory fallback');
      }
    });
    redis.on('connect', () => console.log('✅ Redis connected successfully'));

    await redis.connect();
    return redis;
  } catch (error) {
    console.log('⚠️  Redis not available - running without Redis cache');
    return null;
  }
}
