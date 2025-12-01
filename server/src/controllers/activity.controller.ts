import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';

// Get recent activities
export const getRecentActivities = async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;

    const activities = await prisma.activity.findMany({
      take: parseInt(limit as string),
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ activities });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ message: 'Error fetching activities' });
  }
};

// Create a new activity
export const createActivity = async (req: Request, res: Response) => {
  try {
    const { type, description, userId, userName, metadata, ipAddress } = req.body;

    const activity = await prisma.activity.create({
      data: {
        type,
        description,
        userId,
        userName,
        metadata,
        ipAddress
      }
    });

    res.status(201).json({ activity });
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ message: 'Error creating activity' });
  }
};

// Helper function to log activity (can be called from other controllers)
export const logActivity = async (data: {
  type: string;
  description: string;
  userId?: string;
  userName?: string;
  metadata?: any;
  ipAddress?: string;
}) => {
  try {
    await prisma.activity.create({
      data: {
        type: data.type as any,
        description: data.description,
        userId: data.userId,
        userName: data.userName,
        metadata: data.metadata,
        ipAddress: data.ipAddress
      }
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};
