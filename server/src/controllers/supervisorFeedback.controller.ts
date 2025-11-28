import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { resolveTemplatePath } from '../utils/template.utils';
import fs from 'fs';
import path from 'path';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';

const prisma = new PrismaClient();

const templateName = '18 TRAINING SUPERVISOR_S FEEDBACK FORM_2024.docx';

// Submit supervisor feedback for a student
export const submitFeedback = async (req: AuthRequest, res: Response) => {
    try {
        const supervisorId = req.user?.id;
        if (!supervisorId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const {
            studentId,
            punctualRating,
            knowledgeRating,
            teamworkRating,
            taskPerformanceRating,
            policyComplianceRating,
            conductRating,
            traitsRating,
            comments,
        } = req.body;

        console.log(`[submitFeedback] Supervisor ${supervisorId} submitting feedback for studentId: ${studentId}`);

        // Validate ratings (1-5)
        const ratings = [
            punctualRating,
            knowledgeRating,
            teamworkRating,
            taskPerformanceRating,
            policyComplianceRating,
            conductRating,
            traitsRating,
        ];

        if (ratings.some((r) => r < 1 || r > 5)) {
            return res.status(400).json({ message: 'All ratings must be between 1 and 5' });
        }

        // Check if feedback already exists
        const existingFeedback = await prisma.supervisorFeedback.findFirst({
            where: {
                studentId,
                supervisorId,
            },
        });

        let feedback;
        if (existingFeedback) {
            // Update existing feedback
            console.log(`[submitFeedback] Updating existing feedback ${existingFeedback.id}`);
            feedback = await prisma.supervisorFeedback.update({
                where: { id: existingFeedback.id },
                data: {
                    punctualRating,
                    knowledgeRating,
                    teamworkRating,
                    taskPerformanceRating,
                    policyComplianceRating,
                    conductRating,
                    traitsRating,
                    comments,
                },
            });
        } else {
            // Create new feedback
            console.log(`[submitFeedback] Creating new feedback for studentId: ${studentId}, supervisorId: ${supervisorId}`);
            feedback = await prisma.supervisorFeedback.create({
                data: {
                    studentId,
                    supervisorId,
                    punctualRating,
                    knowledgeRating,
                    teamworkRating,
                    taskPerformanceRating,
                    policyComplianceRating,
                    conductRating,
                    traitsRating,
                    comments,
                },
            });
            console.log(`[submitFeedback] Feedback created successfully with ID: ${feedback.id}`);
        }

        res.json({ message: 'Feedback submitted successfully', feedback });
    } catch (error) {
        console.error('Error submitting supervisor feedback:', error);
        res.status(500).json({ message: 'Failed to submit feedback' });
    }
};

// Get supervisor feedback for a student
export const getFeedback = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        const { studentId } = req.params;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // For students, verify they're accessing their own feedback
        let actualStudentId = studentId;
        if (userRole === 'STUDENT') {
            const student = await prisma.student.findFirst({
                where: { userId },
                select: { id: true },
            });

            if (!student) {
                console.log(`[getFeedback] Student profile not found for userId: ${userId}`);
                return res.status(404).json({ message: 'Student profile not found' });
            }

            // Use the actual student ID from the database, not the one from params
            // This ensures students always get their own feedback
            actualStudentId = student.id;
            console.log(`[getFeedback] Student accessing feedback - using actual studentId: ${actualStudentId} (requested: ${studentId})`);
        }

        // Build where clause based on role
        const where: any = { studentId: actualStudentId };
        if (userRole === 'INDUSTRY_PARTNER') {
            where.supervisorId = userId;
        }

        console.log(`[getFeedback] Searching for feedback with where:`, where, `role: ${userRole}`);

        const feedback = await prisma.supervisorFeedback.findFirst({
            where,
            include: {
                student: {
                    include: {
                        user: true,
                        company: true,
                    },
                },
                supervisor: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        if (!feedback) {
            console.log(`[getFeedback] No feedback found for studentId: ${actualStudentId}, role: ${userRole}`);
            return res.status(404).json({ message: 'Feedback not found' });
        }

        console.log(`[getFeedback] Feedback found:`, { id: feedback.id, studentId: feedback.studentId });

        res.json(feedback);
    } catch (error) {
        console.error('Error fetching supervisor feedback:', error);
        res.status(500).json({ message: 'Failed to fetch feedback' });
    }
};

// Export supervisor feedback as DOCX
export const exportFeedback = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        const { studentId } = req.params;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // For students, verify they're accessing their own feedback
        if (userRole === 'STUDENT') {
            const student = await prisma.student.findFirst({
                where: { userId },
                select: { id: true },
            });

            if (!student) {
                return res.status(404).json({ message: 'Student profile not found' });
            }

            if (student.id !== studentId) {
                return res.status(403).json({ message: 'Access denied. You can only export your own feedback.' });
            }
        }

        // Build where clause based on role
        const where: any = { studentId };
        if (userRole === 'INDUSTRY_PARTNER') {
            where.supervisorId = userId;
        }

        // Get feedback data
        const feedback = await prisma.supervisorFeedback.findFirst({
            where,
            include: {
                student: {
                    include: {
                        user: true,
                        company: true,
                    },
                },
                supervisor: true,
            },
        });

        if (!feedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }

        // Load template
        const templatePath = resolveTemplatePath(templateName);
        if (!fs.existsSync(templatePath)) {
            return res.status(404).json({ message: 'Template file not found' });
        }

        const content = fs.readFileSync(templatePath, 'binary');
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            delimiters: { start: '${', end: '}' },
        });

        // Prepare placeholder data
        const placeholderValues: Record<string, any> = {
            supervisor_name: feedback.supervisor.name || '',
            department: feedback.supervisor.department || '',
            company_name: feedback.student.company?.name || '',
            student_name: feedback.student.user.name || '',
            comments: feedback.comments || '',
            date: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }),
        };

        // Helper function to generate checkmarks for rating columns
        const generateRatingCheckmarks = (rating: number, prefix: string) => {
            placeholderValues[`${prefix}_strongly_agree`] = rating === 5 ? '✓' : '';
            placeholderValues[`${prefix}_agree`] = rating === 4 ? '✓' : '';
            placeholderValues[`${prefix}_neither`] = rating === 3 ? '✓' : '';
            placeholderValues[`${prefix}_disagree`] = rating === 2 ? '✓' : '';
            placeholderValues[`${prefix}_strongly_disagree`] = rating === 1 ? '✓' : '';
        };

        // Generate checkmarks for each criterion
        generateRatingCheckmarks(feedback.punctualRating, 'punctual');
        generateRatingCheckmarks(feedback.knowledgeRating, 'knowledge');
        generateRatingCheckmarks(feedback.teamworkRating, 'teamwork');
        generateRatingCheckmarks(feedback.taskPerformanceRating, 'task_performance');
        generateRatingCheckmarks(feedback.policyComplianceRating, 'policy_compliance');
        generateRatingCheckmarks(feedback.conductRating, 'conduct');
        generateRatingCheckmarks(feedback.traitsRating, 'traits');

        // Render document
        doc.setData(placeholderValues);
        doc.render();

        const buffer = doc.getZip().generate({ type: 'nodebuffer' });

        // Send file
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="Supervisor_Feedback_${feedback.student.user.name.replace(
                /\s+/g,
                '_'
            )}_${new Date().toISOString().split('T')[0]}.docx"`
        );
        res.send(buffer);
    } catch (error) {
        console.error('Error exporting supervisor feedback:', error);
        res.status(500).json({ message: 'Failed to export feedback' });
    }
};
