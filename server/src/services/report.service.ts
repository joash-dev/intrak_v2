import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { PrismaClient, VerificationMethod } from '@prisma/client';

const prisma = new PrismaClient();

export interface AttendanceReportOptions {
  studentId: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface AttendanceReportData {
  student: {
    id: string;
    name: string;
    email: string;
    studentNumber: string;
    program: string;
    companyName?: string | null;
    companyAddress?: string | null;
    supervisorName?: string | null;
    totalHoursRequired: number;
    completedHours: number;
  };
  logs: Array<{
    date: Date;
    timeIn: Date | null;
    timeOut: Date | null;
    durationMinutes: number;
    verificationMethod: VerificationMethod | null;
    verified: boolean;
    remarks: string | null;
  }>;
  summary: {
    totalLogs: number;
    totalMinutes: number;
    totalHours: number;
    verifiedLogs: number;
    pendingLogs: number;
    averageHoursPerDay: number;
  };
}

export const getAttendanceReportData = async (
  options: AttendanceReportOptions
): Promise<AttendanceReportData> => {
  const { studentId, dateFrom, dateTo } = options;

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: { select: { name: true, email: true } },
      company: {
        select: {
          name: true,
          address: true,
          contactPerson: true,
          supervisor: { select: { name: true } },
        },
      },
    },
  });

  if (!student) {
    throw new Error('Student not found');
  }

  const logs = await prisma.attendanceLog.findMany({
    where: {
      studentId,
      ...(dateFrom || dateTo
        ? {
            date: {
              ...(dateFrom ? { gte: dateFrom } : {}),
              ...(dateTo ? { lte: dateTo } : {}),
            },
          }
        : {}),
    },
    orderBy: { date: 'asc' },
  });

  const totalMinutes = logs.reduce(
    (sum, log) => sum + (log.durationMinutes || 0),
    0
  );

  const verifiedLogs = logs.filter((log) => log.verified).length;
  const pendingLogs = logs.length - verifiedLogs;

  const summary = {
    totalLogs: logs.length,
    totalMinutes,
    totalHours: Number((totalMinutes / 60).toFixed(2)),
    verifiedLogs,
    pendingLogs,
    averageHoursPerDay:
      logs.length > 0 ? Number((totalMinutes / 60 / logs.length).toFixed(2)) : 0,
  };

  return {
    student: {
      id: student.id,
      name: student.user.name,
      email: student.user.email,
      studentNumber: student.studentNumber,
      program: student.program,
      companyName: student.company?.name,
      companyAddress: student.company?.address,
      supervisorName:
        student.company?.supervisor?.name ?? student.supervisorName ?? null,
      totalHoursRequired: student.totalHours,
      completedHours: student.completedHours,
    },
    logs: logs.map((log) => ({
      date: log.date,
      timeIn: log.timeIn,
      timeOut: log.timeOut,
      durationMinutes: log.durationMinutes || 0,
      verificationMethod: log.verificationMethod,
      verified: log.verified,
      remarks: log.remarks,
    })),
    summary,
  };
};

export const generateAttendanceReportPDF = async (
  data: AttendanceReportData,
  dateRangeLabel: string
): Promise<Buffer> => {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.font('Helvetica-Bold').fontSize(16).text('INTRAK Attendance Report', {
      align: 'center',
    });
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10).text(dateRangeLabel, { align: 'center' });
    doc.moveDown(1);

    // Student info
    const infoEntries: Array<[string, string]> = [
      ['Student Name', data.student.name],
      ['Student Number', data.student.studentNumber],
      ['Program', data.student.program],
      [
        'Company',
        data.student.companyName ? data.student.companyName : 'Not Assigned',
      ],
      [
        'Supervisor',
        data.student.supervisorName ? data.student.supervisorName : 'Not Assigned',
      ],
      ['Hours Completed', `${data.student.completedHours}/${data.student.totalHoursRequired}`],
    ];

    doc.font('Helvetica-Bold').fontSize(12).text('Student Information');
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10);

    infoEntries.forEach(([label, value]) => {
      doc.text(`${label}: `, { continued: true }).font('Helvetica-Bold').text(value);
      doc.font('Helvetica');
    });

    doc.moveDown(1);
    doc.font('Helvetica-Bold').fontSize(12).text('Summary');
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10);

    const { summary } = data;
    const summaryEntries: Array<[string, string]> = [
      ['Total Logs', summary.totalLogs.toString()],
      ['Total Hours', summary.totalHours.toString()],
      ['Verified Logs', summary.verifiedLogs.toString()],
      ['Pending Logs', summary.pendingLogs.toString()],
      ['Average Hours per Day', summary.averageHoursPerDay.toString()],
    ];

    summaryEntries.forEach(([label, value]) => {
      doc.text(`${label}: `, { continued: true }).font('Helvetica-Bold').text(value);
      doc.font('Helvetica');
    });

    doc.moveDown(1);
    doc.font('Helvetica-Bold').fontSize(12).text('Attendance Logs');
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const columnWidths = {
      date: 80,
      timeIn: 70,
      timeOut: 70,
      duration: 70,
      method: 80,
      status: 60,
      remarks: 120,
    };

    const drawTableHeader = (y: number) => {
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .text('Date', 40, y, { width: columnWidths.date })
        .text('Time In', 40 + columnWidths.date, y, { width: columnWidths.timeIn })
        .text('Time Out', 40 + columnWidths.date + columnWidths.timeIn, y, {
          width: columnWidths.timeOut,
        })
        .text(
          'Duration (hrs)',
          40 + columnWidths.date + columnWidths.timeIn + columnWidths.timeOut,
          y,
          { width: columnWidths.duration }
        )
        .text(
          'Method',
          40 +
            columnWidths.date +
            columnWidths.timeIn +
            columnWidths.timeOut +
            columnWidths.duration,
          y,
          { width: columnWidths.method }
        )
        .text(
          'Status',
          40 +
            columnWidths.date +
            columnWidths.timeIn +
            columnWidths.timeOut +
            columnWidths.duration +
            columnWidths.method,
          y,
          { width: columnWidths.status }
        )
        .text(
          'Remarks',
          40 +
            columnWidths.date +
            columnWidths.timeIn +
            columnWidths.timeOut +
            columnWidths.duration +
            columnWidths.method +
            columnWidths.status,
          y,
          { width: columnWidths.remarks }
        );

      doc.moveTo(40, y - 2).lineTo(40 + Object.values(columnWidths).reduce((a, b) => a + b, 0), y - 2).stroke();
      doc.moveDown(0.5);
      doc.font('Helvetica');
    };

    drawTableHeader(tableTop);
    let currentY = doc.y;

    const formatDate = (value: Date | null) =>
      value ? new Date(value).toLocaleString() : '-';

    data.logs.forEach((log, index) => {
      if (currentY > 720) {
        doc.addPage();
        currentY = 60;
        drawTableHeader(currentY);
        currentY = doc.y;
      }

      const durationHours = (log.durationMinutes / 60).toFixed(2);
      const methodLabel = log.verificationMethod || 'MANUAL';
      const statusLabel = log.verified ? 'Verified' : 'Pending';

      doc
        .fontSize(9)
        .text(new Date(log.date).toLocaleDateString(), 40, currentY, {
          width: columnWidths.date,
        })
        .text(formatDate(log.timeIn), 40 + columnWidths.date, currentY, {
          width: columnWidths.timeIn,
        })
        .text(formatDate(log.timeOut), 40 + columnWidths.date + columnWidths.timeIn, currentY, {
          width: columnWidths.timeOut,
        })
        .text(durationHours, 40 + columnWidths.date + columnWidths.timeIn + columnWidths.timeOut, currentY, {
          width: columnWidths.duration,
        })
        .text(methodLabel, 40 + columnWidths.date + columnWidths.timeIn + columnWidths.timeOut + columnWidths.duration, currentY, {
          width: columnWidths.method,
        })
        .text(statusLabel, 40 + columnWidths.date + columnWidths.timeIn + columnWidths.timeOut + columnWidths.duration + columnWidths.method, currentY, {
          width: columnWidths.status,
        })
        .text(log.remarks || '-', 40 + columnWidths.date + columnWidths.timeIn + columnWidths.timeOut + columnWidths.duration + columnWidths.method + columnWidths.status, currentY, {
          width: columnWidths.remarks,
        });

      currentY = doc.y;
      if (index < data.logs.length - 1) {
        doc.moveTo(40, currentY).lineTo(40 + Object.values(columnWidths).reduce((a, b) => a + b, 0), currentY).strokeColor('#dddddd');
        doc.stroke();
        doc.strokeColor('#000000');
      }
    });

    if (data.logs.length === 0) {
      doc.fontSize(10).text('No attendance logs found for the selected period.', {
        align: 'center',
      });
    }

    doc.end();
  });
};

export const generateAttendanceReportExcel = async (
  data: AttendanceReportData,
  dateRangeLabel: string
): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'INTRAK System';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Attendance');

  sheet.columns = [
    { header: 'Date', key: 'date', width: 18 },
    { header: 'Time In', key: 'timeIn', width: 18 },
    { header: 'Time Out', key: 'timeOut', width: 18 },
    { header: 'Duration (hrs)', key: 'duration', width: 16 },
    { header: 'Method', key: 'method', width: 16 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Remarks', key: 'remarks', width: 30 },
  ];

  sheet.mergeCells('A1:G1');
  sheet.getCell('A1').value = 'INTRAK Attendance Report';
  sheet.getCell('A1').font = { size: 16, bold: true };
  sheet.getCell('A1').alignment = { horizontal: 'center' };

  sheet.mergeCells('A2:G2');
  sheet.getCell('A2').value = dateRangeLabel;
  sheet.getCell('A2').alignment = { horizontal: 'center' };

  sheet.addRow([]);

  const infoRows = [
    ['Student Name', data.student.name],
    ['Student Number', data.student.studentNumber],
    ['Program', data.student.program],
    ['Company', data.student.companyName || 'Not Assigned'],
    ['Supervisor', data.student.supervisorName || 'Not Assigned'],
    [
      'Hours Completed',
      `${data.student.completedHours}/${data.student.totalHoursRequired}`,
    ],
  ];

  infoRows.forEach(([label, value]) => {
    const row = sheet.addRow([label, value]);
    row.font = { bold: label === 'Student Name' ? true : false };
    sheet.mergeCells(`B${row.number}:G${row.number}`);
  });

  sheet.addRow([]);

  const summaryRowStart = sheet.rowCount + 1;
  sheet.addRow(['Summary']);
  sheet.mergeCells(`A${summaryRowStart}:G${summaryRowStart}`);
  sheet.getCell(`A${summaryRowStart}`).font = { bold: true };

  const summary = data.summary;
  const summaryData = [
    ['Total Logs', summary.totalLogs],
    ['Total Hours', summary.totalHours],
    ['Verified Logs', summary.verifiedLogs],
    ['Pending Logs', summary.pendingLogs],
    ['Average Hours per Day', summary.averageHoursPerDay],
  ];

  summaryData.forEach(([label, value]) => {
    const row = sheet.addRow([label, value]);
    sheet.mergeCells(`B${row.number}:G${row.number}`);
  });

  sheet.addRow([]);

  sheet.addRow({
    date: 'Date',
    timeIn: 'Time In',
    timeOut: 'Time Out',
    duration: 'Duration (hrs)',
    method: 'Method',
    status: 'Status',
    remarks: 'Remarks',
  });
  const headerRow = sheet.getRow(sheet.rowCount);
  headerRow.font = { bold: true };
  headerRow.alignment = { horizontal: 'center' };

  data.logs.forEach((log) => {
    sheet.addRow({
      date: new Date(log.date).toLocaleDateString(),
      timeIn: log.timeIn ? new Date(log.timeIn).toLocaleTimeString() : '-',
      timeOut: log.timeOut ? new Date(log.timeOut).toLocaleTimeString() : '-',
      duration: (log.durationMinutes / 60).toFixed(2),
      method: log.verificationMethod || 'MANUAL',
      status: log.verified ? 'Verified' : 'Pending',
      remarks: log.remarks || '',
    });
  });

  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.alignment = cell.alignment || { horizontal: 'left' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
};

export interface ComplianceReportDataItem {
  studentName: string;
  studentNumber: string;
  email: string;
  companyName?: string | null;
  completedHours: number;
  totalHours: number;
  progress: number;
  documentsSubmitted: number;
  documentsApproved: number;
  evaluationsCompleted: number;
  averageRating: number | null;
}

export interface ComplianceReportData {
  generatedAt: Date;
  companyFilter?: string;
  items: ComplianceReportDataItem[];
}

export const getComplianceReportData = async (
  companyId?: string
): Promise<ComplianceReportData> => {
  try {
    const students = await prisma.student.findMany({
      where: companyId ? { companyId } : {},
      select: {
        id: true,
        studentNumber: true,
        completedHours: true,
        totalHours: true,
        user: { select: { name: true, email: true } },
        company: { select: { name: true } },
        documents: {
          select: {
            id: true,
            status: true,
          },
        },
        evaluations: {
          select: {
            id: true,
            rating: true,
          },
        },
      },
    });

    const items: ComplianceReportDataItem[] = students.map((student) => {
      const approvedDocuments = student.documents.filter(
        (doc) => doc.status === 'APPROVED'
      );
      const rating =
        student.evaluations.length > 0
          ? student.evaluations.reduce((sum, e) => sum + (e.rating || 0), 0) /
            student.evaluations.length
          : null;

      return {
        studentName: student.user.name,
        studentNumber: student.studentNumber,
        email: student.user.email,
        companyName: student.company?.name || null,
        completedHours: student.completedHours,
        totalHours: student.totalHours,
        progress:
          student.totalHours > 0
            ? Number(((student.completedHours / student.totalHours) * 100).toFixed(1))
            : 0,
        documentsSubmitted: student.documents.length,
        documentsApproved: approvedDocuments.length,
        evaluationsCompleted: student.evaluations.length,
        averageRating: rating ? Number(rating.toFixed(2)) : null,
      };
    });

    const companyFilterName =
      companyId && students.length > 0
        ? students[0].company?.name || undefined
        : undefined;

    return {
      generatedAt: new Date(),
      companyFilter: companyFilterName,
      items,
    };
  } catch (error: any) {
    console.error('Error generating compliance report data:', error);
    throw new Error(error?.message || 'Failed to generate compliance report data');
  }
};

export const generateComplianceReportExcel = async (
  data: ComplianceReportData
): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'INTRAK System';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Compliance');

  sheet.mergeCells('A1:J1');
  sheet.getCell('A1').value = 'INTRAK Internship Compliance Report';
  sheet.getCell('A1').font = { size: 16, bold: true };
  sheet.getCell('A1').alignment = { horizontal: 'center' };

  sheet.mergeCells('A2:J2');
  sheet.getCell('A2').value = data.companyFilter
    ? `Company: ${data.companyFilter}`
    : 'Company: All';
  sheet.getCell('A2').alignment = { horizontal: 'center' };

  sheet.mergeCells('A3:J3');
  sheet.getCell('A3').value = `Generated: ${data.generatedAt.toLocaleString()}`;
  sheet.getCell('A3').alignment = { horizontal: 'center' };

  sheet.addRow([]);

  sheet.columns = [
    { header: 'Student Name', key: 'studentName', width: 25 },
    { header: 'Student Number', key: 'studentNumber', width: 18 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Company', key: 'companyName', width: 25 },
    { header: 'Completed Hours', key: 'completedHours', width: 18 },
    { header: 'Total Hours', key: 'totalHours', width: 15 },
    { header: 'Progress (%)', key: 'progress', width: 15 },
    { header: 'Documents Submitted', key: 'documentsSubmitted', width: 20 },
    { header: 'Documents Approved', key: 'documentsApproved', width: 20 },
    { header: 'Evaluations Completed', key: 'evaluationsCompleted', width: 20 },
    { header: 'Average Rating', key: 'averageRating', width: 16 },
  ];

  const headerRow = sheet.addRow({
    studentName: 'Student Name',
    studentNumber: 'Student Number',
    email: 'Email',
    companyName: 'Company',
    completedHours: 'Completed Hours',
    totalHours: 'Total Hours',
    progress: 'Progress (%)',
    documentsSubmitted: 'Documents Submitted',
    documentsApproved: 'Documents Approved',
    evaluationsCompleted: 'Evaluations Completed',
    averageRating: 'Average Rating',
  });
  headerRow.font = { bold: true };
  headerRow.alignment = { horizontal: 'center' };

  data.items.forEach((item) => {
    sheet.addRow({
      studentName: item.studentName,
      studentNumber: item.studentNumber,
      email: item.email,
      companyName: item.companyName || 'Not Assigned',
      completedHours: item.completedHours,
      totalHours: item.totalHours,
      progress: item.progress,
      documentsSubmitted: item.documentsSubmitted,
      documentsApproved: item.documentsApproved,
      evaluationsCompleted: item.evaluationsCompleted,
      averageRating: item.averageRating ?? 'N/A',
    });
  });

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber >= headerRow.number) {
      row.eachCell((cell) => {
        cell.alignment = cell.alignment || { horizontal: 'left' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        };
      });
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
};

