import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { aiService } from '../services/aiService';
import { getAIConfig as getAIConfigFromConfig } from '../config/ai.config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const generateEvaluationRemarks = async (req: AuthRequest, res: Response) => {
  try {
    const { competencyId, rating, studentId, competencyTitle, ratingCriteria } = req.body;

    console.log('[AI] Request received:', { competencyId, rating, studentId, competencyTitle });

    if (!competencyId || !rating || !studentId) {
      console.error('[AI] Missing required fields:', { competencyId: !!competencyId, rating: !!rating, studentId: !!studentId });
      return res.status(400).json({
        message: 'Missing required fields: competencyId, rating, studentId',
        received: { competencyId: !!competencyId, rating: !!rating, studentId: !!studentId }
      });
    }

    // Fetch student data for context
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { name: true } },
        attendanceLogs: {
          where: { verified: true },
          select: {
            timeIn: true,
            timeOut: true,
            date: true,
          },
        },
        documents: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Calculate attendance metrics
    const totalHours = student.attendanceLogs.reduce((sum, log) => {
      if (log.timeIn && log.timeOut) {
        const inTime = new Date(log.timeIn);
        const outTime = new Date(log.timeOut);
        const hours = (outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }
      return sum;
    }, 0);

    const onTimeLogs = student.attendanceLogs.filter(log => {
      if (!log.timeIn) return false;
      const timeIn = new Date(log.timeIn);
      const hours = timeIn.getHours();
      const minutes = timeIn.getMinutes();
      // Consider on-time if before 9:00 AM
      return hours < 9 || (hours === 9 && minutes === 0);
    });
    const onTimePercentage = student.attendanceLogs.length > 0
      ? (onTimeLogs.length / student.attendanceLogs.length) * 100
      : 100;

    // Calculate document metrics
    const totalSubmitted = student.documents.length;
    const approved = student.documents.filter(d => d.status === 'APPROVED').length;
    const rejected = student.documents.filter(d => d.status === 'REJECTED').length;

    console.log(' Calling AI service...');
    const remarks = await aiService.generateEvaluationRemarks({
      competencyId,
      competencyTitle: competencyTitle || 'Competency',
      rating: parseInt(rating, 10),
      ratingCriteria: ratingCriteria || '',
      studentId,
      studentName: student.user?.name,
      attendanceData: {
        totalHours: Math.round(totalHours),
        onTimePercentage: Math.round(onTimePercentage),
        absences: 0, // Could be calculated from expected vs actual attendance
      },
      documentData: {
        totalSubmitted,
        approved,
        rejected,
      },
    });

    console.log(' AI remarks generated successfully, length:', remarks.length);
    res.json({ remarks });
  } catch (error) {
    console.error('Error generating evaluation remarks:', error);
    console.error('Error stack:', (error instanceof Error ? error.stack : undefined));
    res.status(500).json({
      message: 'Failed to generate remarks',
      error: (error instanceof Error ? error.message : String(error)),
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    });
  }
};

export const generateDocumentFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const { documentId, action } = req.body;

    if (!documentId || !action) {
      return res.status(400).json({
        message: 'Missing required fields: documentId, action'
      });
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        student: {
          include: {
            user: { select: { name: true } },
            documents: {
              select: {
                status: true,
              },
            },
          },
        },
      },
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const studentDocuments = document.student.documents;
    const totalSubmitted = studentDocuments.length;
    const approved = studentDocuments.filter(d => d.status === 'APPROVED').length;
    const approvalRate = totalSubmitted > 0 ? approved / totalSubmitted : 1;

    const feedback = await aiService.generateDocumentFeedback({
      documentType: document.type || 'document',
      documentTitle: (document as any).filename || document.type || 'Document',
      action: action as 'approve' | 'reject' | 'request_changes',
      studentName: document.student.user?.name || 'Student',
      studentHistory: {
        previousSubmissions: totalSubmitted - 1,
        approvalRate,
      },
    });

    res.json({ feedback });
  } catch (error) {
    console.error('Error generating document feedback:', error);
    res.status(500).json({
      message: 'Failed to generate feedback',
      error: (error instanceof Error ? error.message : String(error))
    });
  }
};

export const generateAttendanceNote = async (req: AuthRequest, res: Response) => {
  try {
    const { attendanceLogId, action } = req.body;

    if (!attendanceLogId || !action) {
      return res.status(400).json({
        message: 'Missing required fields: attendanceLogId, action'
      });
    }

    const log = await prisma.attendanceLog.findUnique({
      where: { id: attendanceLogId },
      include: {
        student: {
          include: {
            user: { select: { name: true } },
            attendanceLogs: {
              where: { verified: true },
              select: {
                timeIn: true,
                date: true,
              },
            },
          },
        },
      },
    });

    if (!log) {
      return res.status(404).json({ message: 'Attendance log not found' });
    }

    const studentLogs = log.student.attendanceLogs;
    const onTimeLogs = studentLogs.filter(l => {
      if (!l.timeIn) return false;
      const timeIn = new Date(l.timeIn);
      return timeIn.getHours() < 9 || (timeIn.getHours() === 9 && timeIn.getMinutes() === 0);
    });
    const onTimePercentage = studentLogs.length > 0
      ? (onTimeLogs.length / studentLogs.length) * 100
      : 100;

    const note = await aiService.generateAttendanceNote({
      studentName: log.student.user?.name || 'Student',
      date: log.date.toISOString().split('T')[0],
      timeIn: log.timeIn?.toISOString() || null,
      timeOut: log.timeOut?.toISOString() || null,
      action: action as 'approve' | 'reject',
      location: (log as any).location || undefined,
      attendanceHistory: {
        onTimePercentage: Math.round(onTimePercentage),
        recentAbsences: 0,
      },
    });

    res.json({ note });
  } catch (error) {
    console.error('Error generating attendance note:', error);
    res.status(500).json({
      message: 'Failed to generate note',
      error: (error instanceof Error ? error.message : String(error))
    });
  }
};

export const generateWeeklyReportSummary = async (req: AuthRequest, res: Response) => {
  try {
    const { tasksAccomplished, knowledgeSkillsValues } = req.body;

    // Log AI config status for debugging
    const config = getAIConfigFromConfig();
    console.log('[AI] Weekly Report Summary requested');
    console.log('   AI Enabled:', config.enabled);
    console.log('   AI Provider:', config.provider);
    console.log('   AI Model:', config.model);
    console.log('   Has API Key:', !!config.apiKey);

    if (!tasksAccomplished && !knowledgeSkillsValues) {
      return res.status(400).json({
        message: 'At least one of tasksAccomplished or knowledgeSkillsValues is required'
      });
    }

    const summary = await aiService.generateWeeklyReportSummary(
      tasksAccomplished || '',
      knowledgeSkillsValues || ''
    );

    res.json({ summary });
  } catch (error) {
    console.error('[AI] Error generating weekly report summary:', (error instanceof Error ? error.message : String(error)));
    console.error('   Full error:', error);
    res.status(500).json({
      message: 'Failed to generate summary',
      error: (error instanceof Error ? error.message : String(error))
    });
  }
};

export const generateOverallComments = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, competencies, overallRating, terminationData } = req.body;

    if (!studentId || !competencies || !overallRating) {
      return res.status(400).json({
        message: 'Missing required fields: studentId, competencies, overallRating'
      });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { name: true } },
        attendanceLogs: {
          where: { verified: true },
          select: {
            timeIn: true,
            timeOut: true,
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const totalHours = student.attendanceLogs.reduce((sum, log) => {
      if (log.timeIn && log.timeOut) {
        const inTime = new Date(log.timeIn);
        const outTime = new Date(log.timeOut);
        const hours = (outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }
      return sum;
    }, 0);

    const onTimeLogs = student.attendanceLogs.filter(log => {
      if (!log.timeIn) return false;
      const timeIn = new Date(log.timeIn);
      return timeIn.getHours() < 9 || (timeIn.getHours() === 9 && timeIn.getMinutes() === 0);
    });
    const onTimePercentage = student.attendanceLogs.length > 0
      ? (onTimeLogs.length / student.attendanceLogs.length) * 100
      : 100;

    const comments = await aiService.generateOverallComments({
      studentName: student.user?.name || 'Student',
      competencies: Array.isArray(competencies) ? competencies : [],
      overallRating: parseFloat(overallRating),
      attendanceData: {
        totalHours: Math.round(totalHours),
        onTimePercentage: Math.round(onTimePercentage),
      },
      terminationData: terminationData ? {
        terminated: terminationData.terminated || false,
        reasons: terminationData.reasons || [],
      } : undefined,
    });

    res.json({ comments });
  } catch (error) {
    console.error('Error generating overall comments:', error);
    res.status(500).json({
      message: 'Failed to generate comments',
      error: (error instanceof Error ? error.message : String(error))
    });
  }
};

export const generateForm18Comments = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, ratings } = req.body;

    if (!studentId || !ratings) {
      return res.status(400).json({
        message: 'Missing required fields: studentId, ratings'
      });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { name: true } },
      },
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const comments = await aiService.generateForm18Comments({
      studentName: student.user?.name || 'Student',
      ratings: {
        punctualRating: ratings.punctualRating || 0,
        knowledgeRating: ratings.knowledgeRating || 0,
        teamworkRating: ratings.teamworkRating || 0,
        taskPerformanceRating: ratings.taskPerformanceRating || 0,
        policyComplianceRating: ratings.policyComplianceRating || 0,
        conductRating: ratings.conductRating || 0,
        traitsRating: ratings.traitsRating || 0,
      },
    });

    res.json({ comments });
  } catch (error) {
    console.error('Error generating Form 18 comments:', error);
    res.status(500).json({
      message: 'Failed to generate comments',
      error: (error instanceof Error ? error.message : String(error))
    });
  }
};

export const generateInstructorEvaluationComments = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, ratings, overallRating } = req.body;

    if (!studentId) {
      return res.status(400).json({
        message: 'Missing required field: studentId'
      });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { name: true } },
        attendanceLogs: {
          where: { verified: true },
          select: {
            timeIn: true,
            timeOut: true,
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const totalHours = student.attendanceLogs.reduce((sum, log) => {
      if (log.timeIn && log.timeOut) {
        const inTime = new Date(log.timeIn);
        const outTime = new Date(log.timeOut);
        const hours = (outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }
      return sum;
    }, 0);

    const onTimeLogs = student.attendanceLogs.filter(log => {
      if (!log.timeIn) return false;
      const timeIn = new Date(log.timeIn);
      return timeIn.getHours() < 9 || (timeIn.getHours() === 9 && timeIn.getMinutes() === 0);
    });
    const onTimePercentage = student.attendanceLogs.length > 0
      ? (onTimeLogs.length / student.attendanceLogs.length) * 100
      : 100;

    const comments = await aiService.generateInstructorEvaluationComments({
      studentName: student.user?.name || 'Student',
      studentId,
      ratings: ratings || {},
      overallRating: overallRating ? parseFloat(overallRating) : undefined,
      attendanceData: {
        totalHours: Math.round(totalHours),
        onTimePercentage: Math.round(onTimePercentage),
      },
    });

    res.json({ comments });
  } catch (error) {
    console.error('Error generating instructor evaluation comments:', error);
    res.status(500).json({
      message: 'Failed to generate comments',
      error: (error instanceof Error ? error.message : String(error))
    });
  }
};

export const generateImprovementSuggestions = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, currentPerformance, ratings } = req.body;

    if (!studentId) {
      return res.status(400).json({
        message: 'Missing required field: studentId'
      });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { name: true } },
        attendanceLogs: {
          where: { verified: true },
          select: {
            timeIn: true,
            timeOut: true,
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const totalHours = student.attendanceLogs.reduce((sum, log) => {
      if (log.timeIn && log.timeOut) {
        const inTime = new Date(log.timeIn);
        const outTime = new Date(log.timeOut);
        const hours = (outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }
      return sum;
    }, 0);

    const onTimeLogs = student.attendanceLogs.filter(log => {
      if (!log.timeIn) return false;
      const timeIn = new Date(log.timeIn);
      return timeIn.getHours() < 9 || (timeIn.getHours() === 9 && timeIn.getMinutes() === 0);
    });
    const onTimePercentage = student.attendanceLogs.length > 0
      ? (onTimeLogs.length / student.attendanceLogs.length) * 100
      : 100;

    const suggestions = await aiService.generateImprovementSuggestions({
      studentName: student.user?.name || 'Student',
      studentId,
      currentPerformance: currentPerformance || '',
      ratings: ratings || {},
      attendanceData: {
        totalHours: Math.round(totalHours),
        onTimePercentage: Math.round(onTimePercentage),
      },
    });

    res.json({ suggestions });
  } catch (error) {
    console.error('Error generating improvement suggestions:', error);
    res.status(500).json({
      message: 'Failed to generate suggestions',
      error: (error instanceof Error ? error.message : String(error))
    });
  }
};

export const generateAnnouncementContent = async (req: AuthRequest, res: Response) => {
  try {
    const { title, audience, type } = req.body;

    if (!title || !audience) {
      return res.status(400).json({
        message: 'Missing required fields: title, audience'
      });
    }

    const content = await aiService.generateAnnouncementContent({
      title,
      audience,
      type: type || undefined,
    });

    res.json({ content });
  } catch (error) {
    console.error('Error generating announcement content:', error);
    res.status(500).json({
      message: 'Failed to generate content',
      error: (error instanceof Error ? error.message : String(error))
    });
  }
};

// Get AI configuration status (for frontend to check if AI is enabled)
export const getAIConfig = async (req: AuthRequest, res: Response) => {
  try {
    const config = getAIConfigFromConfig();

    // Return only safe config (don't expose API key)
    res.json({
      enabled: config.enabled,
      provider: config.provider,
      model: config.model,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
      hasApiKey: !!config.apiKey, // Just indicate if key exists, don't expose it
    });
  } catch (error) {
    console.error('Error getting AI config:', error);
    res.status(500).json({
      message: 'Failed to get AI configuration',
      error: (error instanceof Error ? error.message : String(error))
    });
  }
};

