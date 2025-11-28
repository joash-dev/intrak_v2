import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { resolveTemplatePath } from '../utils/template.utils';
import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

const prisma = new PrismaClient();
const templateName = '19b Evaluation Instrument of PSU Partner Agencies (Self Ratee)_2024.docx';

// Submit Form 19b - Agency Self Evaluation
export const submitAgencySelfEvaluation = async (req: AuthRequest, res: Response) => {
    try {
        const supervisorId = req.user?.id;
        if (!supervisorId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const {
            unitDivision,
            age,
            sex,
            communicationConnectivity,
            communicationDialogue,
            communicationParticipation,
            ethicalReputation,
            ethicalCSR,
            ethicalSupport,
            psuSupervisorQualified,
            psuSupportActivities,
            psuFacilities,
            hteSupervision,
            hteSupervisorQualified,
            hteFeedback,
            qualityTimeliness,
            qualityObjectives,
            qualityResources,
        } = req.body;

        // Validate all ratings (1-5)
        const ratings = [
            communicationConnectivity,
            communicationDialogue,
            communicationParticipation,
            ethicalReputation,
            ethicalCSR,
            ethicalSupport,
            psuSupervisorQualified,
            psuSupportActivities,
            psuFacilities,
            hteSupervision,
            hteSupervisorQualified,
            hteFeedback,
            qualityTimeliness,
            qualityObjectives,
            qualityResources,
        ];

        if (ratings.some((r) => r < 1 || r > 5)) {
            return res.status(400).json({ message: 'All ratings must be between 1 and 5' });
        }

        // Check if evaluation already exists for this supervisor
        const existingEvaluation = await prisma.agencySelfEvaluation.findFirst({
            where: { supervisorId },
        });

        let evaluation;
        if (existingEvaluation) {
            // Update existing evaluation
            console.log(`[submitAgencySelfEvaluation] Updating existing evaluation ${existingEvaluation.id}`);
            evaluation = await prisma.agencySelfEvaluation.update({
                where: { id: existingEvaluation.id },
                data: {
                    unitDivision,
                    age,
                    sex,
                    communicationConnectivity,
                    communicationDialogue,
                    communicationParticipation,
                    ethicalReputation,
                    ethicalCSR,
                    ethicalSupport,
                    psuSupervisorQualified,
                    psuSupportActivities,
                    psuFacilities,
                    hteSupervision,
                    hteSupervisorQualified,
                    hteFeedback,
                    qualityTimeliness,
                    qualityObjectives,
                    qualityResources,
                },
            });
        } else {
            // Create new evaluation
            console.log(`[submitAgencySelfEvaluation] Creating new evaluation for supervisorId: ${supervisorId}`);
            evaluation = await prisma.agencySelfEvaluation.create({
                data: {
                    supervisorId,
                    unitDivision,
                    age,
                    sex,
                    communicationConnectivity,
                    communicationDialogue,
                    communicationParticipation,
                    ethicalReputation,
                    ethicalCSR,
                    ethicalSupport,
                    psuSupervisorQualified,
                    psuSupportActivities,
                    psuFacilities,
                    hteSupervision,
                    hteSupervisorQualified,
                    hteFeedback,
                    qualityTimeliness,
                    qualityObjectives,
                    qualityResources,
                },
            });
            console.log(`[submitAgencySelfEvaluation] Evaluation created successfully with ID: ${evaluation.id}`);
        }

        res.json({ message: 'Agency self-evaluation submitted successfully', evaluation });
    } catch (error) {
        console.error('Error submitting agency self-evaluation:', error);
        res.status(500).json({ message: 'Failed to submit evaluation' });
    }
};

// Get Form 19b - Agency Self Evaluation
export const getAgencySelfEvaluation = async (req: AuthRequest, res: Response) => {
    try {
        console.log('[getAgencySelfEvaluation] Request received');
        console.log('[getAgencySelfEvaluation] User:', req.user ? { id: req.user.id, role: req.user.role } : 'null');
        
        const userId = req.user?.id;
        const userRole = req.user?.role;
        if (!userId) {
            console.log('[getAgencySelfEvaluation] No userId found - returning 401');
            return res.status(401).json({ message: 'Unauthorized' });
        }

        let supervisorId = userId;

        // For students, get their supervisor's ID from their company
        if (userRole === 'STUDENT') {
            const student = await prisma.student.findFirst({
                where: { userId },
                include: {
                    company: {
                        select: {
                            supervisorId: true,
                        },
                    },
                },
            });

            if (!student) {
                return res.status(404).json({ message: 'Student profile not found' });
            }

            if (!student.company?.supervisorId) {
                return res.status(404).json({ message: 'No supervisor assigned to your company' });
            }

            supervisorId = student.company.supervisorId;
            console.log(`[getAgencySelfEvaluation] Student accessing - using supervisorId: ${supervisorId}`);
        }

        const evaluation = await prisma.agencySelfEvaluation.findFirst({
            where: { supervisorId },
            include: {
                supervisor: {
                    select: {
                        name: true,
                        department: true,
                    },
                },
            },
        });

        if (!evaluation) {
            return res.status(404).json({ message: 'Evaluation not found' });
        }

        res.json(evaluation);
    } catch (error) {
        console.error('Error fetching agency self-evaluation:', error);
        res.status(500).json({ message: 'Failed to fetch evaluation' });
    }
};

// Export Form 19b - Agency Self Evaluation
export const exportAgencySelfEvaluation = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        let supervisorId = userId;

        // For students, get their supervisor's ID from their company
        if (userRole === 'STUDENT') {
            const student = await prisma.student.findFirst({
                where: { userId },
                include: {
                    company: {
                        select: {
                            supervisorId: true,
                        },
                    },
                },
            });

            if (!student) {
                return res.status(404).json({ message: 'Student profile not found' });
            }

            if (!student.company?.supervisorId) {
                return res.status(404).json({ message: 'No supervisor assigned to your company' });
            }

            supervisorId = student.company.supervisorId;
        }

        // Get evaluation data
        const evaluation = await prisma.agencySelfEvaluation.findFirst({
            where: { supervisorId },
            include: {
                supervisor: {
                    include: {
                        companiesSupervised: {
                            select: {
                                name: true,
                            },
                            take: 1,
                        },
                    },
                },
            },
        });

        if (!evaluation) {
            return res.status(404).json({ message: 'Evaluation not found' });
        }

        // Get company name from supervisor's companies or from student's company
        let companyName = 'N/A';
        if (evaluation.supervisor.companiesSupervised && evaluation.supervisor.companiesSupervised.length > 0) {
            companyName = evaluation.supervisor.companiesSupervised[0].name;
        } else if (userRole === 'STUDENT') {
            // For students, get company from their student record
            const student = await prisma.student.findFirst({
                where: { userId },
                include: {
                    company: {
                        select: {
                            name: true,
                        },
                    },
                },
            });
            if (student?.company?.name) {
                companyName = student.company.name;
            }
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
            name: evaluation.supervisor.name || '',
            supervisor_name: evaluation.supervisor.name || '',
            agency_name: companyName,
            agency_institution: companyName,
            company_name: companyName,
            unit_division: evaluation.unitDivision || '',
            department: evaluation.unitDivision || '',
            age: evaluation.age || '',
            sex: evaluation.sex || '',
            gender: evaluation.sex || '',
            date: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }),
            // Type of Rater - always Self Ratee for this form
            rater_self_ratee: '✓',
            rater_faculty: '',
            rater_student: '',
        };

        // Helper function to generate checkmarks for rating columns (1-5 scale)
        const generateRatingCheckmarks = (rating: number, prefix: string) => {
            placeholderValues[`${prefix}_5`] = rating === 5 ? '✓' : '';
            placeholderValues[`${prefix}_4`] = rating === 4 ? '✓' : '';
            placeholderValues[`${prefix}_3`] = rating === 3 ? '✓' : '';
            placeholderValues[`${prefix}_2`] = rating === 2 ? '✓' : '';
            placeholderValues[`${prefix}_1`] = rating === 1 ? '✓' : '';
        };

        // Generate checkmarks for each criterion
        // Communication
        generateRatingCheckmarks(evaluation.communicationConnectivity, 'communication_connectivity');
        generateRatingCheckmarks(evaluation.communicationDialogue, 'communication_dialogue');
        generateRatingCheckmarks(evaluation.communicationParticipation, 'communication_participation');

        // Ethical Dealings
        generateRatingCheckmarks(evaluation.ethicalReputation, 'ethical_reputation');
        generateRatingCheckmarks(evaluation.ethicalCSR, 'ethical_csr');
        generateRatingCheckmarks(evaluation.ethicalSupport, 'ethical_support');

        // Student Satisfaction - PSU
        generateRatingCheckmarks(evaluation.psuSupervisorQualified, 'psu_supervisor_qualified');
        generateRatingCheckmarks(evaluation.psuSupportActivities, 'psu_support_activities');
        generateRatingCheckmarks(evaluation.psuFacilities, 'psu_facilities');

        // Student Satisfaction - HTE
        generateRatingCheckmarks(evaluation.hteSupervision, 'hte_supervision');
        generateRatingCheckmarks(evaluation.hteSupervisorQualified, 'hte_supervisor_qualified');
        generateRatingCheckmarks(evaluation.hteFeedback, 'hte_feedback');

        // Quality Delivery
        generateRatingCheckmarks(evaluation.qualityTimeliness, 'quality_timeliness');
        generateRatingCheckmarks(evaluation.qualityObjectives, 'quality_objectives');
        generateRatingCheckmarks(evaluation.qualityResources, 'quality_resources');

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
            `attachment; filename="Form_19b_Agency_Self_Evaluation_${evaluation.supervisor.name.replace(
                /\s+/g,
                '_'
            )}_${new Date().toISOString().split('T')[0]}.docx"`
        );
        res.send(buffer);
    } catch (error) {
        console.error('Error exporting agency self-evaluation:', error);
        res.status(500).json({ message: 'Failed to export evaluation' });
    }
};

