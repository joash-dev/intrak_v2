import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, action, page = 1, limit = 50 } = req.query;

    const where: any = {};
    if (userId) where.userId = userId;
    if (action) where.action = { contains: action as string };

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { name: true, email: true, role: true } }
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({
      logs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch audit logs', error });
  }
};

export const getAuditLogById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const log = await prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true, role: true } }
      }
    });

    if (!log) {
      return res.status(404).json({ message: 'Audit log not found' });
    }

    res.json({ log });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch audit log', error });
  }
};