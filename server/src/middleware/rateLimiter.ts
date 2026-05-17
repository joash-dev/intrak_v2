import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { RequestHandler } from 'express';
import { redisClient } from '../config/redis';

const shouldSkipRateLimit = () =>
  process.env.NODE_ENV === 'development' || process.env.DISABLE_RATE_LIMIT === 'true';

// Factory so each limiter gets its own RedisStore instance. The store uses
// `sendCommand` (the only supported pattern in rate-limit-redis v4+) so it
// works with the modern node-redis v4/v5 client.
const createLoginRedisStore = (prefix: string) =>
  new RedisStore({
    sendCommand: (...args: string[]) => (redisClient as any).sendCommand(args),
    prefix,
  });

// Returns the store to back a login limiter with.
//
// - In development, or if REDIS_URL is unset, returns `undefined` so
//   express-rate-limit falls back to its built-in in-memory store. This
//   lets developers run the API without a local Redis instance.
// - In production with REDIS_URL configured, returns a RedisStore so
//   limits are shared across processes and survive restarts.
const getStore = (prefix: string): RedisStore | undefined => {
  if (process.env.NODE_ENV === 'development' || !process.env.REDIS_URL) {
    return undefined;
  }
  return createLoginRedisStore(prefix);
};

// `rate-limit-redis` calls SCRIPT LOAD inside its constructor, which would
// run at module-load time (before connectRedis() in the server bootstrap)
// and crash with "ClientClosedError". Defer building the limiter until the
// first request, by which point Redis is connected.
const lazyLimiter = (build: () => RateLimitRequestHandler): RequestHandler => {
  let inner: RateLimitRequestHandler | null = null;
  return (req, res, next) => {
    if (!inner) inner = build();
    return inner(req, res, next);
  };
};

// Global API limiter (kept fairly lenient for normal usage)
export const apiRateLimiter = rateLimit({
  windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW || '1', 10) * 60 * 1000, // 1 minute
  max: parseInt(process.env.API_RATE_LIMIT_MAX || '300', 10), // 300 req/min per IP
  message: 'Too many API requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => shouldSkipRateLimit(),
});

// More lenient auth limiter
export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '1', 10) * 60 * 1000, // 1 minute window
  max: parseInt(process.env.RATE_LIMIT_MAX || '1000', 10), // 1000 requests per minute
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => shouldSkipRateLimit(),
});

// Dynamic rate limiter for login attempts (uses database setting)
export const createLoginRateLimiter = async () => {
  try {
    const { prisma } = await import('../config/database');
    const adminSettings = await prisma.adminSettings.findFirst({
      select: { maxLoginAttempts: true }
    });
    const maxAttempts = adminSettings?.maxLoginAttempts || 5;
    
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: maxAttempts, // Use database setting
      message: `Too many login attempts. Maximum ${maxAttempts} attempts allowed per 15 minutes. Please try again later.`,
      standardHeaders: true,
      legacyHeaders: false,
      skip: () => shouldSkipRateLimit(),
    });
  } catch (error) {
    console.error('Error creating login rate limiter, using default:', error);
    // Fallback to default
    return rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      message: 'Too many login attempts, please try again later',
      standardHeaders: true,
      legacyHeaders: false,
      skip: () => shouldSkipRateLimit(),
    });
  }
};

// Per-IP login limiter — defends the network edge (one client / NAT egress).
// Backed by Redis so limits survive process restarts and are shared across
// horizontally-scaled server instances.
export const loginIpLimiter = lazyLimiter(() =>
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.LOGIN_IP_MAX ?? '20', 10),
    message: 'Too many login attempts from this IP, please try again later',
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => req.ip ?? 'unknown',
    store: getStore('login:ip:'),
    skip: () => shouldSkipRateLimit(),
  }),
);

// Per-account login limiter — defends a single account from credential
// stuffing regardless of source IP. Skipped when no email is supplied so
// validator middleware can return its own 422 instead of a 429.
export const loginAccountLimiter = lazyLimiter(() =>
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.LOGIN_ACCOUNT_MAX ?? '10', 10),
    message: 'Too many login attempts for this account, please try again later',
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => `account:${String(req.body?.email ?? '').toLowerCase()}`,
    store: getStore('login:account:'),
    skip: (req) => !req.body?.email || shouldSkipRateLimit(),
  }),
);

// QR verification limiter to reduce brute-force token guessing/spam scans
export const qrVerifyRateLimiter = rateLimit({
  windowMs: parseInt(process.env.QR_RATE_LIMIT_WINDOW || '1', 10) * 60 * 1000, // 1 minute
  max: parseInt(process.env.QR_RATE_LIMIT_MAX || '20', 10), // 20 verify requests/min per IP
  message: 'Too many QR verification attempts, please wait and try again',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => shouldSkipRateLimit(),
});