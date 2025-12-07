import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

// Check session timeout based on last activity
const checkSessionTimeout = async (userId: string): Promise<{ valid: boolean; remaining?: number }> => {
  try {
    // Get admin settings for session timeout
    const adminSettings = await prisma.adminSettings.findFirst({
      select: { sessionTimeout: true }
    });

    const sessionTimeoutMinutes = adminSettings?.sessionTimeout || 30;
    const sessionTimeoutMs = sessionTimeoutMinutes * 60 * 1000;

    // Get most recent refresh token (represents last activity)
    const refreshToken = await prisma.refreshToken.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    if (!refreshToken) {
      return { valid: false };
    }

    const lastActivity = refreshToken.createdAt.getTime();
    const now = Date.now();
    const timeSinceActivity = now - lastActivity;
    const remaining = sessionTimeoutMs - timeSinceActivity;

    if (remaining <= 0) {
      // Session expired - delete all refresh tokens
      await prisma.refreshToken.deleteMany({
        where: { userId }
      });
      return { valid: false };
    }

    return { valid: true, remaining: Math.floor(remaining / 1000) }; // Return in seconds
  } catch (error) {
    console.error('Error checking session timeout:', error);
    // On error, allow access to prevent lockout
    return { valid: true };
  }
};

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    console.log('🔍 Checking auth - Token present:', !!token);
    console.log('🔍 Authorization header:', req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({ 
        message: 'No token provided',
        hint: 'Include Authorization: Bearer <token> header'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, name: true, active: true }
    });

    if (!user || !user.active) {
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }

    // Check session timeout (only for non-admin routes to allow admin access during maintenance)
    if (!req.path.startsWith('/admin') && !req.path.startsWith('/auth')) {
      const sessionCheck = await checkSessionTimeout(user.id);
      if (!sessionCheck.valid) {
        return res.status(401).json({ 
          message: 'Session expired due to inactivity',
          code: 'SESSION_TIMEOUT'
        });
      }
      
      // Add remaining time to response header for frontend
      if (sessionCheck.remaining !== undefined) {
        res.setHeader('X-Session-Remaining', sessionCheck.remaining.toString());
      }
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    };
    console.log('✅ User authenticated:', user.email);
    
    next();
  } catch (error: any) {
    console.error('❌ Auth error:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    res.status(401).json({ message: 'Authentication failed', error: error.message });
  }
};