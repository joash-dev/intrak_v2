import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { resolveTemplatePath } from '../utils/template.utils';

const prisma = new PrismaClient();

type CompetencyPayload = {
  rating: number;
  remarks?: string;
};

type TerminationData = {
  lackOfWork?: boolean;
  violationRules?: boolean;
  unfavorableHabits?: boolean;
  altercation?: boolean;
  absencesTardiness?: boolean;
  disrespectful?: boolean;
  noInterest?: boolean;
  other?: boolean;
  otherSpecify?: string;
  futureEmployment?: boolean;
  needsImprovement?: boolean;
};

type EvaluationExportBody = {
  studentId?: string;
  studentName: string;
  companyName: string;
  companyAddress?: string;
  dateStarted?: string | null;
  dateEnded?: string | null;
  evaluatorName?: string;
  evaluatorPosition?: string;
  ojtGrade?: number;
  competencies: Record<string, CompetencyPayload>;
  termination?: TerminationData;
};

const TEMPLATE_FILE = resolveTemplatePath('11 INTERNSHIP EVALUATION FORM_2024.docx');

const competencyPlaceholderMap: Record<string, string> = {
  abilityToLearn: 'ability_to_learn',
  workAttitude: 'work_attitude',
  conduct: 'conduct',
  motivationInitiative: 'motivation',
  qualityAccuracy: 'quality',
  quantityOfWork: 'quantity_of_work',
  safetyPractices: 'safety_practice',
  appearanceHygiene: 'apperance',
};

const formatDate = (value?: string | null) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};



const buildCompetencyPlaceholders = (
  prefix: string,
  competency?: CompetencyPayload
) => {
  const placeholders: Record<string, string> = {};
  for (let rating = 5; rating >= 1; rating -= 1) {
    placeholders[`${prefix}_${rating}`] =
      competency?.rating === rating ? 'X' : '';
  }
  placeholders[`${prefix}_remarks`] = competency?.remarks || '';
  return placeholders;
};

export const submitEvaluation = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const {
      studentId,
      overallRating,
      competencies,
      overallComments,
      termination,
    } = req.body;

    if (!studentId || !competencies || typeof overallRating !== 'number') {
      return res.status(400).json({
        message:
          'studentId, competencies, and overallRating are required fields',
      });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { name: true } },
        company: { select: { name: true, address: true } },
      },
    });

    if (!student) {
      return res
        .status(404)
        .json({ message: 'Student not found for evaluation' });
    }

    // Store termination data in criteria JSON if provided (we'll extract it separately)
    // For now, we'll store it as part of the criteria object
    const evaluationData: any = {
      studentId,
      evaluatorId: req.user.id,
      evaluatorRole: req.user.role,
      rating: overallRating,
      criteria: competencies,
      comments: overallComments ?? null,
    };

    // Store termination data in the criteria JSON object
    if (termination) {
      (evaluationData.criteria as any).__termination = termination;
    }

    const evaluation = await prisma.evaluation.create({
      data: evaluationData,
    });

    return res
      .status(201)
      .json({ message: 'Evaluation submitted successfully', evaluation });
  } catch (error) {
    console.error('Failed to submit evaluation:', error);
    return res.status(500).json({
      message: 'Unexpected error while submitting evaluation',
      details: error instanceof Error ? error.message : error,
    });
  }
};

export const getEvaluations = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { studentId } = req.query;
    const where: any = {};

    // For students, only show their own evaluations from supervisors
    if (req.user.role === 'STUDENT') {
      const student = await prisma.student.findFirst({
        where: { userId: req.user.id },
        select: { id: true },
      });

      if (!student) {
        return res.status(404).json({ message: 'Student profile not found' });
      }

      where.studentId = student.id;
      // Only show evaluations from supervisors (INDUSTRY_PARTNER)
      where.evaluatorRole = 'INDUSTRY_PARTNER';
    } else if (studentId) {
      // For other roles, allow filtering by studentId
      where.studentId = studentId as string;
    }

    const evaluations = await prisma.evaluation.findMany({
      where,
      include: {
        evaluator: {
          select: {
            name: true,
            email: true,
          },
        },
        student: {
          select: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform evaluations to match frontend format
    const formattedEvaluations = evaluations.map((evaluation) => {
      const criteria = evaluation.criteria as Record<string, any>;
      
      // Return original criteria structure with ratings and remarks
      // Keep the original keys (abilityToLearn, workAttitude, etc.) for proper display
      const originalCriteria: Record<string, { rating: number; remarks?: string }> = {};
      let terminationData: TerminationData | undefined = undefined;
      
      if (criteria) {
        Object.entries(criteria).forEach(([key, value]) => {
          // Extract termination data if present
          if (key === '__termination' && typeof value === 'object' && value !== null) {
            terminationData = value as TerminationData;
            return;
          }
          
          const rating = typeof value === 'object' && value !== null 
            ? (value as CompetencyPayload).rating 
            : (typeof value === 'number' ? value : 0);
          const remarks = typeof value === 'object' && value !== null 
            ? (value as CompetencyPayload).remarks 
            : '';
          originalCriteria[key] = { rating, remarks: remarks || undefined };
        });
      }

      // Extract strengths and areas for improvement from comments if available
      // For now, we'll use empty arrays as the database doesn't store these separately
      const strengths: string[] = [];
      const areasForImprovement: string[] = [];

      // Determine evaluation type based on date or other criteria
      // For now, defaulting to "Mid-term" - can be enhanced later
      const evaluationDate = new Date(evaluation.createdAt);
      const type: "Mid-term" | "Final" | "Progress Check" | "Monthly" = "Mid-term";

      return {
        id: evaluation.id,
        evaluatorName: evaluation.evaluator?.name || 'Unknown',
        evaluatorRole: evaluation.evaluatorRole as "INDUSTRY_PARTNER" | "COORDINATOR" | "INSTRUCTOR",
        type,
        date: evaluation.createdAt.toISOString().split('T')[0],
        overallRating: evaluation.rating,
        criteria: originalCriteria,
        comments: evaluation.comments || '',
        termination: terminationData,
        strengths,
        areasForImprovement,
      };
    });

    return res.json({ evaluations: formattedEvaluations });
  } catch (error) {
    console.error('Failed to fetch evaluations:', error);
    return res.status(500).json({
      message: 'Unexpected error while fetching evaluations',
      details: error instanceof Error ? error.message : error,
    });
  }
};

export const exportEvaluationDocx = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!fs.existsSync(TEMPLATE_FILE)) {
      return res.status(500).json({
        message: 'Evaluation template is missing on the server',
      });
    }

    const {
      studentId,
      studentName,
      companyName,
      companyAddress,
      dateStarted,
      dateEnded,
      evaluatorName,
      evaluatorPosition,
      ojtGrade,
      competencies,
      termination,
    } = req.body as EvaluationExportBody;

    if (!studentName || !companyName || !competencies) {
      return res.status(400).json({
        message:
          'studentName, companyName, and competencies are required for export',
      });
    }

    const templateBuffer = fs.readFileSync(TEMPLATE_FILE);
    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: {
        start: '${',
        end: '}',
      },
    });

    const placeholderValues: Record<string, string | number> = {
      student_name: studentName,
      company_name: companyName,
      company_address: companyAddress || 'N/A',
      date_started: formatDate(dateStarted),
      date_ended: formatDate(dateEnded),
      evaluator_name: evaluatorName || req.user?.name || '',
      evaluator_position: evaluatorPosition || '',
      supervisor_name: evaluatorName || req.user?.name || '',
      supervisor_position: evaluatorPosition || '',
      ojt_grade: typeof ojtGrade === 'number' ? ojtGrade.toString() : '',
    };

    Object.entries(competencyPlaceholderMap).forEach(
      ([clientKey, placeholderPrefix]) => {
        const competencyData = competencies[clientKey];
        Object.assign(
          placeholderValues,
          buildCompetencyPlaceholders(placeholderPrefix, competencyData)
        );
      }
    );

    // Add termination placeholders
    if (termination) {
      placeholderValues.termination_lack_of_work = termination.lackOfWork ? 'X' : '';
      placeholderValues.termination_violation_rules = termination.violationRules ? 'X' : '';
      placeholderValues.termination_unfavorable_habits = termination.unfavorableHabits ? 'X' : '';
      placeholderValues.termination_altercation = termination.altercation ? 'X' : '';
      placeholderValues.termination_absences_tardiness = termination.absencesTardiness ? 'X' : '';
      placeholderValues.termination_disrespectful = termination.disrespectful ? 'X' : '';
      placeholderValues.termination_no_interest = termination.noInterest ? 'X' : '';
      placeholderValues.termination_other = termination.other ? 'X' : '';
      placeholderValues.termination_other_specify = termination.otherSpecify || '';
      placeholderValues.future_employment = termination.futureEmployment ? 'X' : '';
      placeholderValues.needs_improvement = termination.needsImprovement ? 'X' : '';
    } else {
      // Set all termination placeholders to empty if not provided
      placeholderValues.termination_lack_of_work = '';
      placeholderValues.termination_violation_rules = '';
      placeholderValues.termination_unfavorable_habits = '';
      placeholderValues.termination_altercation = '';
      placeholderValues.termination_absences_tardiness = '';
      placeholderValues.termination_disrespectful = '';
      placeholderValues.termination_no_interest = '';
      placeholderValues.termination_other = '';
      placeholderValues.termination_other_specify = '';
      placeholderValues.future_employment = '';
      placeholderValues.needs_improvement = '';
    }

    doc.setData(placeholderValues);

    try {
      doc.render();
    } catch (error) {
      console.error('DOCX render error:', error);
      return res.status(500).json({
        message: 'Failed to generate evaluation form',
        details: error instanceof Error ? error.message : error,
      });
    }

    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
    });

    const safeStudentName = studentName.replace(/[^a-z0-9]/gi, '_');
    const filename = `InternshipEvaluation_${safeStudentName || 'student'}.docx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    return res.send(buffer);
  } catch (error) {
    console.error('Failed to export evaluation DOCX:', error);
    return res.status(500).json({
      message: 'Unexpected error while exporting evaluation form',
      details: error instanceof Error ? error.message : error,
    });
  }
};
