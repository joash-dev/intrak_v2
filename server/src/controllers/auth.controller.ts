import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { auditLog } from '../services/audit.service';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: role || 'STUDENT'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    await auditLog(user.id, 'USER_REGISTERED', { email }, req);

    res.status(201).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error });
  }
};

// Test endpoint to check server health
export const testEndpoint = async (req: Request, res: Response) => {
  try {
    console.log('Test endpoint called');
    res.json({ message: 'Server is working', timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ message: 'Test endpoint failed', error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);
    console.log('Request body:', { email, password: password ? '[REDACTED]' : 'missing' });

    // Check if required environment variables are set
    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
      console.error('Missing JWT environment variables');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.active) {
      console.log('User not found or inactive:', { found: !!user, active: user?.active });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('User found:', { id: user.id, name: user.name, role: user.role });

    const validPassword = await bcrypt.compare(password, user.passwordHash);

    if (!validPassword) {
      console.log('Invalid password for user:', user.email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('Password valid, generating tokens...');
    const { accessToken, refreshToken } = generateTokens(user);
    console.log('Tokens generated successfully');

    console.log('Creating refresh token in database...');
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });
    console.log('Refresh token created successfully');

    console.log('Logging audit trail...');
    await auditLog(user.id, 'USER_LOGIN', { email }, req);
    console.log('Audit log created successfully');

    console.log('Sending response...');
    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      message: 'Login failed', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    const decoded = verifyRefreshToken(refreshToken);

    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const { accessToken, refreshToken: newRefreshToken } = 
      generateTokens(tokenRecord.user);

    await prisma.refreshToken.delete({
      where: { token: refreshToken }
    });

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: tokenRecord.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    res.status(401).json({ message: 'Token refresh failed' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken }
      });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Logout failed' });
  }
};