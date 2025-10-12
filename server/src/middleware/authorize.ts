import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    console.log(`🔐 Authorization check: user role=${req.user.role}, required roles=${roles.join(',')}`);

    if (!roles.includes(req.user.role)) {
      console.log(`🔐 Access denied: user role '${req.user.role}' not in allowed roles [${roles.join(',')}]`);
      return res.status(403).json({ 
        message: 'Forbidden: Insufficient permissions',
        userRole: req.user.role,
        requiredRoles: roles
      });
    }

    console.log(`🔐 Access granted for user with role '${req.user.role}'`);
    next();
  };
};