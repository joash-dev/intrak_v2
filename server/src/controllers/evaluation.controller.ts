import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

type CompetencyPayload = {
  rating: number;
  remarks?: string;
};

type EvaluationExportBody = {
  studentName: string;
  companyName: string;
  companyAddress?: string;
  dateStarted?: string | null;
  dateEnded?: string | null;
  evaluatorName?: string;
  evaluatorPosition?: string;
  ojtGrade?: number;
  competencies: Record<string, CompetencyPayload>;
};

const TEMPLATE_FILE = path.resolve(
  __dirname,
  '../templates/11 INTERNSHIP EVALUATION FORM_2024.docx'
);

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
    } = req.body;

    if (!studentId || !competencies || typeof overallRating !== 'number') {
      return res.status(400).json({
        message:
          'studentId, competencies, and overallRating are required fields',
      });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true },
    });

    if (!student) {
      return res
        .status(404)
        .json({ message: 'Student not found for evaluation' });
    }

    const evaluation = await prisma.evaluation.create({
      data: {
        studentId,
        evaluatorId: req.user.id,
        evaluatorRole: req.user.role,
        rating: overallRating,
        criteria: competencies,
        comments: overallComments ?? null,
      },
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
      studentName,
      companyName,
      companyAddress,
      dateStarted,
      dateEnded,
      evaluatorName,
      evaluatorPosition,
      ojtGrade,
      competencies,
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
