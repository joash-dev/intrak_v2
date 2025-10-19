import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const checkMaintenanceMode = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Skip maintenance check for admin routes, auth routes, and health - they can always access
    if (req.path.startsWith('/admin') || req.path.startsWith('/auth') || req.path.startsWith('/health')) {
      return next();
    }

    // Check if maintenance mode is enabled
    const adminSettings = await prisma.adminSettings.findFirst({
      where: {
        maintenanceMode: true
      }
    });

    if (!adminSettings) {
      // No maintenance mode enabled, continue
      return next();
    }

    // If maintenance mode is enabled, check if user is admin
    // First, try to get token and authenticate user
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      try {
        // Verify token and get user info
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        // Get user from database
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, email: true, role: true, active: true }
        });

        // If user is admin and active, allow access
        if (user && user.active && user.role === 'ADMIN') {
          console.log('🔧 Admin user bypassing maintenance mode:', user.email);
          return next();
        }
      } catch (tokenError) {
        console.log('Token verification failed in maintenance check:', tokenError);
        // Continue to block if token is invalid
      }
    }

    // All other users are blocked during maintenance
    console.log('🚫 Blocking non-admin user during maintenance mode');
    return res.status(503).json({
      message: 'System is currently under maintenance. Please try again later.',
      maintenanceMode: true,
      estimatedDowntime: 'Please check back in a few hours',
      contactInfo: 'For urgent matters, please contact the system administrator'
    });

  } catch (error) {
    console.error('Error checking maintenance mode:', error);
    // On error, allow access to prevent system lockout
    next();
  }
};
