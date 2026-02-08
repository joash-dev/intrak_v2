import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import {
  generateAttendanceReportExcel,
  generateAttendanceReportPDF,
  generateComplianceReportExcel,
  getAttendanceReportData,
  getComplianceReportData,
} from '../services/report.service';
import { auditLog } from '../services/audit.service';

const prisma = new PrismaClient();

const parseDate = (value: unknown): Date | undefined => {
  if (!value) {
    return undefined;
  }

  const candidate = Array.isArray(value) ? value[0] : value;
  if (typeof candidate !== 'string') {
    return undefined;
  }

  const date = new Date(candidate);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const resolveStudentId = async (req: AuthRequest, requestedId?: string) => {
  if (req.user?.role === 'STUDENT') {
    const student = await prisma.student.findFirst({
      where: { userId: req.user.id },
      select: { id: true },
    });

    if (!student) {
      throw Object.assign(new Error('Student profile not found'), {
        statusCode: 404,
      });
    }
    return student.id;
  }

  if (!requestedId) {
    throw Object.assign(new Error('studentId is required'), {
      statusCode: 400,
    });
  }

  if (requestedId === 'me') {
    const student = await prisma.student.findFirst({
      where: { userId: req.user?.id },
      select: { id: true },
    });

    if (!student) {
      throw Object.assign(new Error('Student profile not found'), {
        statusCode: 404,
      });
    }
    return student.id;
  }

  return requestedId;
};

export const getAttendanceReport = async (req: AuthRequest, res: Response) => {
  try {
    const format = (req.query.format as string | undefined)?.toLowerCase() || 'pdf';
    const studentIdParam = req.query.studentId as string | undefined;
    const dateFrom = parseDate(req.query.from);
    const dateTo = parseDate(req.query.to);

    if (dateFrom && dateTo && dateFrom > dateTo) {
      return res.status(400).json({
        message: 'Invalid date range: "from" must be before "to".',
      });
    }

    const studentId = await resolveStudentId(req, studentIdParam);

    const reportData = await getAttendanceReportData({
      studentId,
      dateFrom,
      dateTo,
    });

    const dateRangeLabel =
      dateFrom || dateTo
        ? `Coverage: ${dateFrom ? dateFrom.toLocaleDateString() : 'Start'} - ${dateTo ? dateTo.toLocaleDateString() : 'Present'
        }`
        : 'Coverage: Entire internship history';

    if (format === 'json') {
      return res.json({
        ...reportData,
        summary: reportData.summary,
      });
    }

    if (format === 'excel') {
      const buffer = await generateAttendanceReportExcel(reportData, dateRangeLabel);
      const filename = `attendance-report-${reportData.student.studentNumber}-${Date.now()}.xlsx`;

      await auditLog(
        req.user!.id,
        'REPORT_ATTENDANCE_GENERATED',
        { studentId, format: 'excel' },
        req
      );

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(Buffer.from(buffer));
    }

    if (format === 'pdf') {
      const buffer = await generateAttendanceReportPDF(reportData, dateRangeLabel);
      const filename = `attendance-report-${reportData.student.studentNumber}-${Date.now()}.pdf`;

      await auditLog(
        req.user!.id,
        'REPORT_ATTENDANCE_GENERATED',
        { studentId, format: 'pdf' },
        req
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(buffer);
    }

    return res.status(400).json({
      message: `Unsupported format "${format}". Allowed values: pdf, excel, json.`,
    });
  } catch (error) {
    const statusCode = (error as any)?.statusCode || 500;
    res.status(statusCode).json({
      message: 'Report generation failed',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : undefined) : undefined,
    });
  }
};

export const getComplianceReport = async (req: AuthRequest, res: Response) => {
  try {
    const format = (req.query.format as string | undefined)?.toLowerCase() || 'excel';
    const companyId = req.query.companyId as string | undefined;

    const reportData = await getComplianceReportData(companyId);

    if (format === 'json') {
      return res.json(reportData);
    }

    if (format === 'excel') {
      const buffer = await generateComplianceReportExcel(reportData);
      const filename = `compliance-report-${Date.now()}.xlsx`;

      await auditLog(
        req.user!.id,
        'REPORT_COMPLIANCE_GENERATED',
        { companyId: companyId || 'all', format: 'excel' },
        req
      );

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(Buffer.from(buffer));
    }

    return res.status(400).json({
      message: `Unsupported format "${format}". Allowed values: excel, json.`,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Report generation failed',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : undefined) : undefined,
    });
  }
};
