import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { resolveTemplatePath } from '../utils/template.utils';
import path from 'path';
import fs from 'fs';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

const prisma = new PrismaClient();

// Resolve template path
const templateName = '16 PRACTICUM WEEKLY REPORT_2024.docx';
const WEEKLY_REPORT_TEMPLATE_FILE = resolveTemplatePath(templateName);

interface WeekData {
  weekNumber: number;
  dateRange: string;
  tasksAccomplished: string;
  knowledgeSkillsValues: string;
}

// Get or create weekly report for student
export const getWeeklyReport = async (req: AuthRequest, res: Response) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id },
      include: {
        user: { select: { name: true, email: true } },
        instructor: { select: { name: true } },
        company: { select: { name: true } },
      },
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get weekly report from database (stored as JSON in a field or separate table)
    // For now, we'll use a simple approach - store in a JSON field
    // You may want to create a separate WeeklyReport table later
    const weeklyReport = await prisma.student.findUnique({
      where: { id: student.id },
      select: { weeklyReportData: true },
    });

    const weeks: WeekData[] = weeklyReport?.weeklyReportData
      ? (weeklyReport.weeklyReportData as any).weeks || []
      : [];

    // Return saved weeks, or empty array if none
    res.json({ weeks });
  } catch (error) {
    console.error('Error getting weekly report:', error);
    res.status(500).json({ message: 'Failed to get weekly report' });
  }
};

// Save weekly report
export const saveWeeklyReport = async (req: AuthRequest, res: Response) => {
  try {
    const { weeks } = req.body as { weeks: WeekData[] };

    if (!weeks || !Array.isArray(weeks)) {
      return res.status(400).json({ message: 'Invalid weeks data' });
    }

    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id },
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Save weekly report data as JSON
    await prisma.student.update({
      where: { id: student.id },
      data: {
        weeklyReportData: { weeks } as any,
      },
    });

    res.json({ message: 'Weekly report saved successfully', weeks });
  } catch (error) {
    console.error('Error saving weekly report:', error);
    res.status(500).json({ message: 'Failed to save weekly report' });
  }
};

// Export weekly report as DOCX
export const exportWeeklyReport = async (req: AuthRequest, res: Response) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id },
      include: {
        user: { select: { name: true, email: true } },
        instructor: { select: { name: true } },
        company: { select: { name: true } },
      },
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get weekly report data
    const weeklyReport = await prisma.student.findUnique({
      where: { id: student.id },
      select: { weeklyReportData: true },
    });

    const weeks: WeekData[] = weeklyReport?.weeklyReportData
      ? (weeklyReport.weeklyReportData as any).weeks || []
      : [];

    if (weeks.length === 0) {
      return res.status(400).json({ message: 'No weekly report data found. Please fill out the weekly report first.' });
    }

    // Check if template exists
    if (!fs.existsSync(WEEKLY_REPORT_TEMPLATE_FILE)) {
      return res.status(404).json({
        message: 'Weekly report template not found',
        details: { templatePath: WEEKLY_REPORT_TEMPLATE_FILE }
      });
    }

    // Load template
    const templateBuffer = fs.readFileSync(WEEKLY_REPORT_TEMPLATE_FILE);
    const zip = new PizZip(templateBuffer);

    let doc: Docxtemplater;
    try {
      doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: '${', end: '}' },
      });
    } catch (error) {
      console.error('Error creating Docxtemplater instance:', error);
      return res.status(500).json({
        message: 'Failed to process template',
        details: {
          message: (error instanceof Error ? error.message : String(error)),
          properties: (error as any)?.properties,
        },
      });
    }

    // Format date
    const formatDate = (value?: Date | string | null): string => {
      if (!value) return 'N/A';
      const date = typeof value === 'string' ? new Date(value) : value;
      if (Number.isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).toUpperCase();
    };

    // Prepare placeholder values
    const placeholderValues: Record<string, any> = {
      student_name: (student.user?.name || 'N/A').toUpperCase(),
      instructor_name: (student.instructor?.name || 'N/A').toUpperCase(),
      company_name: (student.company?.name || 'N/A').toUpperCase(),
      job_description: (student.jobDescription || 'N/A').toUpperCase(),
      start_date: formatDate(student.startDate),
      end_date: formatDate(student.endDate),
      total_hours: `${student.totalHours || 240} HOURS`,
    };

    // Add week data
    // We loop up to the maximum week number found in data, or at least 5 (to satisfy current template)
    const maxWeek = Math.max(5, ...weeks.map(w => w.weekNumber));

    for (let i = 1; i <= maxWeek; i++) {
      const week = weeks.find((w) => w.weekNumber === i) || {
        weekNumber: i,
        dateRange: '',
        tasksAccomplished: '',
        knowledgeSkillsValues: '',
      };

      placeholderValues[`week_${i}_date_range`] = week.dateRange || '';
      placeholderValues[`week_${i}_tasks`] = week.tasksAccomplished || '';
      placeholderValues[`week_${i}_learned`] = week.knowledgeSkillsValues || '';
    }

    // Set data
    try {
      doc.setData(placeholderValues);
      doc.render();
    } catch (error) {
      console.error('Error rendering template:', error);
      return res.status(500).json({
        message: 'Failed to render template',
        details: {
          message: (error instanceof Error ? error.message : String(error)),
          properties: (error as any)?.properties,
        },
      });
    }

    // Generate buffer
    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    } as any);

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Weekly_Report_${student.user?.name || 'Report'}_${new Date().toISOString().split('T')[0]}.docx"`
    );

    res.send(buffer);
  } catch (error) {
    console.error('Error exporting weekly report:', error);
    res.status(500).json({
      message: 'Failed to export weekly report',
      details: { message: (error instanceof Error ? error.message : String(error)) },
    });
  }
};

