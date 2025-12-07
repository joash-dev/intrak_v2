import rateLimit from 'express-rate-limit';

// More lenient rate limiting for development
export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '1') * 60 * 1000, // 1 minute window
  max: parseInt(process.env.RATE_LIMIT_MAX || '1000'), // 1000 requests per minute
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development mode
    return process.env.NODE_ENV === 'development';
  }
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
      skip: (req) => {
        // Skip rate limiting in development mode
        return process.env.NODE_ENV === 'development';
      }
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
      skip: (req) => process.env.NODE_ENV === 'development'
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
  skip: (req) => {
    // Skip rate limiting in development mode
    return process.env.NODE_ENV === 'development';
  }
});