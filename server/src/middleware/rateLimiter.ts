import rateLimit from 'express-rate-limit';

const shouldSkipRateLimit = () =>
  process.env.NODE_ENV === 'development' || process.env.DISABLE_RATE_LIMIT === 'true';

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

// Default rate limiter (for immediate use, will be replaced by dynamic one)
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Default, will be overridden by dynamic limiter
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => shouldSkipRateLimit(),
});

// QR verification limiter to reduce brute-force token guessing/spam scans
export const qrVerifyRateLimiter = rateLimit({
  windowMs: parseInt(process.env.QR_RATE_LIMIT_WINDOW || '1', 10) * 60 * 1000, // 1 minute
  max: parseInt(process.env.QR_RATE_LIMIT_MAX || '20', 10), // 20 verify requests/min per IP
  message: 'Too many QR verification attempts, please wait and try again',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => shouldSkipRateLimit(),
});