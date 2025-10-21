import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get system alerts
export const getSystemAlerts = async (req: Request, res: Response) => {
  try {
    const { resolved, limit = 20 } = req.query;

    const where: any = {};
    if (resolved !== undefined) {
      where.resolved = resolved === 'true';
    }

    const alerts = await prisma.systemAlert.findMany({
      where,
      take: parseInt(limit as string),
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ alerts });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ message: 'Error fetching alerts' });
  }
};

// Create a new alert
export const createAlert = async (req: Request, res: Response) => {
  try {
    const { type, priority, title, message } = req.body;

    const alert = await prisma.systemAlert.create({
      data: {
        type,
        priority,
        title,
        message
      }
    });

    res.status(201).json({ alert });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ message: 'Error creating alert' });
  }
};

// Resolve an alert
export const resolveAlert = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { resolvedBy } = req.body;

    const alert = await prisma.systemAlert.update({
      where: { id },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy
      }
    });

    res.json({ alert });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ message: 'Error resolving alert' });
  }
};

// Delete an alert
export const deleteAlert = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.systemAlert.delete({
      where: { id }
    });

    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({ message: 'Error deleting alert' });
  }
};

// Helper function to create alerts (can be called from other controllers)
export const createSystemAlert = async (data: {
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
}) => {
  try {
    await prisma.systemAlert.create({
      data
    });
  } catch (error) {
    console.error('Error creating system alert:', error);
  }
};
