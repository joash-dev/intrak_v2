import { createClient, RedisClientType } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Single, shared Redis client used across the app (rate limiting, etc).
// Kept as a module-level singleton so we don't open multiple connections.
export const redisClient: RedisClientType = createClient({
  url: REDIS_URL,
  socket: {
    // Reconnect with simple capped exponential backoff. We never want a
    // transient Redis blip to crash the API process.
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
  },
});

redisClient.on('error', (err) => {
  // node-redis emits 'error' both on connection failures and runtime issues.
  // Log and keep the process alive — limiters should fall back gracefully.
  console.error('[Redis] Client error:', err?.message || err);
});

redisClient.on('connect', () => {
  console.log('[Redis] Connecting...');
});

redisClient.on('ready', () => {
  console.log('[Redis] Connection ready');
});

redisClient.on('reconnecting', () => {
  console.warn('[Redis] Reconnecting...');
});

redisClient.on('end', () => {
  console.warn('[Redis] Connection closed');
});

/**
 * Establish the initial Redis connection.
 *
 * In development (or when DISABLE_RATE_LIMIT=true) we skip connecting
 * entirely so a missing local Redis doesn't block the dev server. The
 * limiter middleware falls back to its built-in in-memory store via
 * getStore() in rateLimiter.ts.
 *
 * In production, throws on failure so the caller (server bootstrap)
 * can abort startup. Subsequent drops are handled by reconnectStrategy.
 */
export const connectRedis = async (): Promise<void> => {
  if (process.env.NODE_ENV === 'development' || process.env.DISABLE_RATE_LIMIT === 'true') {
    console.warn(
      '[Redis] Skipping connection (development / DISABLE_RATE_LIMIT). ' +
        'Login rate limiting will use in-memory fallback.',
    );
    return;
  }

  if (redisClient.isOpen) return;
  try {
    await redisClient.connect();
    console.log(`[Redis] Connected to ${REDIS_URL}`);
  } catch (error: any) {
    console.error('[Redis] Initial connection failed:', error?.message || error);
    throw error;
  }
};

export default redisClient;
