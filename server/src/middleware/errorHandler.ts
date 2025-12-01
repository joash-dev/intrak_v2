import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log full error details (critical for Render debugging)
  console.error('========== ERROR DETAILS ==========');
  console.error('Error Name:', err.name);
  console.error('Error Message:', err.message);
  console.error('Error Code:', err.code);
  console.error('Error Stack:', err.stack);
  console.error('Request URL:', req.url);
  console.error('Request Method:', req.method);
  if (err.meta) {
    console.error('Error Meta:', JSON.stringify(err.meta, null, 2));
  }
  console.error('===================================');

  // Prisma errors
  if (err.code?.startsWith('P')) {
    console.error('Prisma Error Code:', err.code);
    console.error('Prisma Meta:', err.meta);
    
    if (err.code === 'P2002') {
      return res.status(409).json({
        message: 'Duplicate entry',
        field: err.meta?.target
      });
    }
    
    // Database connection errors
    if (err.code === 'P1001' || err.code === 'P1017' || err.code === 'P1000') {
      console.error('❌ DATABASE CONNECTION ERROR');
      return res.status(503).json({
        message: 'Database connection error. Please try again.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation error',
      errors: err.errors
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Authentication failed',
      error: err.message
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      message: 'Unauthorized access'
    });
  }

  // File system errors
  if (err.code === 'ENOENT') {
    console.error('File not found error:', err.path);
    return res.status(404).json({
      message: 'File or directory not found',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      code: err.code,
      name: err.name
    })
  });
};