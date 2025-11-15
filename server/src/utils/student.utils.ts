import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const ensureStudentStartDate = async (
  studentId: string,
  attendanceDate: Date
) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { startDate: true },
    });

    if (!student) return;

    if (!student.startDate || attendanceDate < student.startDate) {
      await prisma.student.update({
        where: { id: studentId },
        data: { startDate: attendanceDate },
      });
    }
  } catch (error) {
    console.error('Failed to update student start date:', error);
  }
};

