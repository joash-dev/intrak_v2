import { PrismaClient } from '@prisma/client';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export const generateQRToken = async (studentId: string) => {
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await prisma.qRToken.create({
    data: {
      token,
      studentId,
      expiresAt
    }
  });

  const qrCodeDataURL = await QRCode.toDataURL(token);

  return {
    token,
    qrCode: qrCodeDataURL,
    expiresAt
  };
};

export const verifyQRToken = async (token: string) => {
  const qrToken = await prisma.qRToken.findUnique({
    where: { token }
  });

  if (!qrToken || qrToken.used || qrToken.expiresAt < new Date()) {
    return null;
  }

  return qrToken;
};