import { PrismaClient } from '@prisma/client';
import { Request } from 'express';

const prisma = new PrismaClient();

export const auditLog = async (
  userId: string,
  action: string,
  meta: any,
  req: Request
) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        meta,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });
  } catch (error) {
    console.error('Audit log failed:', error);
  }
};