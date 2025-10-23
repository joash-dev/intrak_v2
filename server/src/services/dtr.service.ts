import PDFDocument from 'pdfkit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DTROptions {
  studentId: string;
  startDate?: Date;
  endDate?: Date;
  month?: number;
  year?: number;
}

export async function generateDTRPDF(options: DTROptions): Promise<Buffer> {
  const { studentId, startDate, endDate, month, year } = options;

  // Determine date range
  let dateFrom: Date;
  let dateTo: Date;

  if (month && year) {
    // Generate DTR for specific month
    dateFrom = new Date(year, month - 1, 1);
    dateTo = new Date(year, month, 0, 23, 59, 59);
  } else if (startDate && endDate) {
    dateFrom = startDate;
    dateTo = endDate;
  } else {
    // Default to current month
    const now = new Date();
    dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  }

  // Fetch student data
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: { select: { name: true, email: true } },
      company: { select: { name: true, address: true, contactPerson: true } }
    }
  });

  if (!student) {
    throw new Error('Student not found');
  }

  // Fetch attendance logs
  const logs = await prisma.attendanceLog.findMany({
    where: {
      studentId,
      date: {
        gte: dateFrom,
        lte: dateTo
      }
    },
    orderBy: { date: 'asc' }
  });

  // Create PDF
  const doc = new PDFDocument({ 
    size: 'A4', 
    margin: 50,
    info: {
      Title: `Internship Time Frame - ${student.user.name}`,
      Author: 'INTRAK System',
      Subject: 'Internship Time Frame'
    }
  });

  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header - Title
    doc.fontSize(16).font('Helvetica-Bold').text('INTERNSHIP TIME FRAME', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('PANGASINAN STATE UNIVERSITY', { align: 'center' });
    doc.moveDown(1.5);

    // Student Information Section
    const leftMargin = 50;
    const infoTop = doc.y;
    
    // Draw outer border
    doc.rect(leftMargin, infoTop, 495, 100).stroke();
    
    // Info fields with horizontal lines
    doc.fontSize(9).font('Helvetica-Bold');
    let currentY = infoTop + 10;
    
    // NAME OF STUDENT/INTERN
    doc.text('NAME OF STUDENT/INTERN:', leftMargin + 5, currentY);
    doc.font('Helvetica').text(student.user.name, leftMargin + 150, currentY);
    currentY += 18;
    doc.moveTo(leftMargin, currentY).lineTo(leftMargin + 495, currentY).stroke();
    currentY += 2;
    
    // YEAR AND COURSE
    doc.font('Helvetica-Bold').text('YEAR AND COURSE:', leftMargin + 5, currentY);
    doc.font('Helvetica').text(student.program || 'N/A', leftMargin + 150, currentY);
    currentY += 18;
    doc.moveTo(leftMargin, currentY).lineTo(leftMargin + 495, currentY).stroke();
    currentY += 2;
    
    // COMPANY NAME
    doc.font('Helvetica-Bold').text('COMPANY NAME:', leftMargin + 5, currentY);
    doc.font('Helvetica').text(student.company?.name || 'N/A', leftMargin + 150, currentY);
    currentY += 18;
    doc.moveTo(leftMargin, currentY).lineTo(leftMargin + 495, currentY).stroke();
    currentY += 2;
    
    // COMPANY ADDRESS
    doc.font('Helvetica-Bold').text('COMPANY ADDRESS:', leftMargin + 5, currentY);
    doc.font('Helvetica').text(student.company?.address || 'N/A', leftMargin + 150, currentY, { width: 330 });
    currentY += 18;
    doc.moveTo(leftMargin, currentY).lineTo(leftMargin + 495, currentY).stroke();
    currentY += 2;
    
    // NUMBER OF HOURS
    doc.font('Helvetica-Bold').text('NUMBER OF HOURS:', leftMargin + 5, currentY);
    doc.font('Helvetica').text(student.totalHours.toString(), leftMargin + 150, currentY);
    
    doc.moveDown(2);
    currentY = doc.y;

    // Attendance Table
    const tableLeft = leftMargin;
    const colWidths = {
      date: 165,
      day: 165,
      hours: 165
    };

    // Table Header
    doc.fontSize(9).font('Helvetica-Bold');
    let tableHeaderY = currentY;
    
    // Draw table border
    doc.rect(tableLeft, tableHeaderY, colWidths.date + colWidths.day + colWidths.hours, 20).stroke();
    
    // Vertical lines for header
    doc.moveTo(tableLeft + colWidths.date, tableHeaderY).lineTo(tableLeft + colWidths.date, tableHeaderY + 20).stroke();
    doc.moveTo(tableLeft + colWidths.date + colWidths.day, tableHeaderY).lineTo(tableLeft + colWidths.date + colWidths.day, tableHeaderY + 20).stroke();
    
    // Header text
    doc.text('DATE', tableLeft, tableHeaderY + 6, { width: colWidths.date, align: 'center' });
    doc.text('DAY', tableLeft + colWidths.date, tableHeaderY + 6, { width: colWidths.day, align: 'center' });
    doc.text('NUMBER OF HOURS', tableLeft + colWidths.date + colWidths.day, tableHeaderY + 6, { width: colWidths.hours, align: 'center' });

    // Table Rows
    currentY = tableHeaderY + 20;
    doc.font('Helvetica').fontSize(8);

    const rowHeight = 20;
    const maxRowsPerPage = 25; // Approximate number of rows that fit

    logs.forEach((log, index) => {
      // Check if we need a new page
      if (currentY > 720) {
        doc.addPage();
        currentY = 50;
        // Redraw table header on new page
        doc.fontSize(9).font('Helvetica-Bold');
        doc.rect(tableLeft, currentY, colWidths.date + colWidths.day + colWidths.hours, 20).stroke();
        doc.moveTo(tableLeft + colWidths.date, currentY).lineTo(tableLeft + colWidths.date, currentY + 20).stroke();
        doc.moveTo(tableLeft + colWidths.date + colWidths.day, currentY).lineTo(tableLeft + colWidths.date + colWidths.day, currentY + 20).stroke();
        doc.text('DATE', tableLeft, currentY + 6, { width: colWidths.date, align: 'center' });
        doc.text('DAY', tableLeft + colWidths.date, currentY + 6, { width: colWidths.day, align: 'center' });
        doc.text('NUMBER OF HOURS', tableLeft + colWidths.date + colWidths.day, currentY + 6, { width: colWidths.hours, align: 'center' });
        currentY += 20;
        doc.font('Helvetica').fontSize(8);
      }

      // Draw row border
      doc.rect(tableLeft, currentY, colWidths.date + colWidths.day + colWidths.hours, rowHeight).stroke();
      
      // Vertical lines
      doc.moveTo(tableLeft + colWidths.date, currentY).lineTo(tableLeft + colWidths.date, currentY + rowHeight).stroke();
      doc.moveTo(tableLeft + colWidths.date + colWidths.day, currentY).lineTo(tableLeft + colWidths.date + colWidths.day, currentY + rowHeight).stroke();

      // Date
      const logDate = new Date(log.date);
      const dateStr = logDate.toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit',
        year: 'numeric'
      });
      doc.text(dateStr, tableLeft + 5, currentY + 6, { width: colWidths.date - 10, align: 'left' });

      // Day
      const dayStr = logDate.toLocaleDateString('en-US', { weekday: 'long' });
      doc.text(dayStr, tableLeft + colWidths.date + 5, currentY + 6, { width: colWidths.day - 10, align: 'left' });

      // Hours
      const hours = (log.durationMinutes / 60).toFixed(2);
      doc.text(hours, tableLeft + colWidths.date + colWidths.day + 5, currentY + 6, { width: colWidths.hours - 10, align: 'center' });

      currentY += rowHeight;
    });

    // Add empty rows to make the table look complete (minimum 15 rows total)
    const minRows = 15;
    const emptyRowsNeeded = Math.max(0, minRows - logs.length);
    
    for (let i = 0; i < emptyRowsNeeded; i++) {
      if (currentY > 720) {
        doc.addPage();
        currentY = 50;
      }
      
      doc.rect(tableLeft, currentY, colWidths.date + colWidths.day + colWidths.hours, rowHeight).stroke();
      doc.moveTo(tableLeft + colWidths.date, currentY).lineTo(tableLeft + colWidths.date, currentY + rowHeight).stroke();
      doc.moveTo(tableLeft + colWidths.date + colWidths.day, currentY).lineTo(tableLeft + colWidths.date + colWidths.day, currentY + rowHeight).stroke();
      
      currentY += rowHeight;
    }

    // Total Hours Row
    doc.fontSize(9).font('Helvetica-Bold');
    doc.rect(tableLeft, currentY, colWidths.date + colWidths.day + colWidths.hours, 25).stroke();
    doc.moveTo(tableLeft + colWidths.date + colWidths.day, currentY).lineTo(tableLeft + colWidths.date + colWidths.day, currentY + 25).stroke();
    
    const totalHours = logs.reduce((sum, log) => sum + log.durationMinutes, 0) / 60;
    doc.text('TOTAL NUMBER OF HOURS:', tableLeft + 5, currentY + 8, { width: colWidths.date + colWidths.day - 10, align: 'right' });
    doc.text(totalHours.toFixed(2), tableLeft + colWidths.date + colWidths.day + 5, currentY + 8, { width: colWidths.hours - 10, align: 'center' });

    currentY += 35;

    // Signature Section - PREPARED BY
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('PREPARED BY:', tableLeft, currentY);
    currentY += 30;
    
    // Signature line
    doc.moveTo(tableLeft + 150, currentY).lineTo(tableLeft + 350, currentY).stroke();
    currentY += 5;
    
    doc.fontSize(8).font('Helvetica-Oblique').fillColor('#666666');
    doc.text('Student-Intern', tableLeft + 150, currentY, { width: 200, align: 'center' });
    currentY += 15;
    
    doc.text('Date:__________________', tableLeft + 150, currentY, { width: 200, align: 'center' });
    currentY += 35;

    // NOTED BY
    doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold');
    doc.text('NOTED BY:', tableLeft, currentY);
    currentY += 30;
    
    doc.moveTo(tableLeft + 150, currentY).lineTo(tableLeft + 350, currentY).stroke();
    currentY += 5;
    
    doc.fontSize(8).font('Helvetica-Oblique').fillColor('#666666');
    doc.text('Internship / Practicum Subject Instructor', tableLeft + 150, currentY, { width: 200, align: 'center' });
    currentY += 15;
    
    doc.text('Date:__________________', tableLeft + 150, currentY, { width: 200, align: 'center' });
    currentY += 35;

    // APPROVED BY
    doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold');
    doc.text('APPROVED BY:', tableLeft, currentY);
    currentY += 30;
    
    doc.moveTo(tableLeft + 150, currentY).lineTo(tableLeft + 350, currentY).stroke();
    currentY += 5;
    
    doc.fontSize(8).font('Helvetica-Oblique').fillColor('#666666');
    doc.text("Company's Authorized Representative", tableLeft + 150, currentY, { width: 200, align: 'center' });
    currentY += 15;
    
    doc.text('Date:__________________', tableLeft + 150, currentY, { width: 200, align: 'center' });

    doc.end();
  });
}

