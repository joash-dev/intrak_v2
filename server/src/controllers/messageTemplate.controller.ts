import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';

export const getMessageTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role;

    if (!role) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const category = typeof req.query.category === 'string' ? req.query.category.trim() : undefined;

    const where: any = {
      isActive: true,
      targetRoles: {
        has: role as any,
      },
    };

    if (category) {
      where.category = category;
    }

    // Use dynamic access so endpoint works before Prisma client regeneration.
    const templates = await (prisma as any).messageTemplate.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        targetRoles: true,
        sortOrder: true,
      },
    });

    return res.json({ templates });
  } catch (error) {
    console.error('Error fetching message templates:', error);
    return res.status(500).json({
      message: 'Failed to fetch message templates',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    });
  }
};

