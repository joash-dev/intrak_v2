import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { CompanyProposalStatus, NotificationType, Role } from '@prisma/client';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { createLocalBackup, ensureNASDirectoryExists, getStoragePathWithFallback, resolveFilePath } from '../config/nas';
import { logActivity } from './activity.controller';
import { emailService } from '../services/email.service';

const STUDENT_UPLOADABLE_STATUSES: CompanyProposalStatus[] = [
  'SUBMITTED_TO_INSTRUCTOR',
  'RETURNED_BY_INSTRUCTOR',
];

const STUDENT_DELETABLE_STATUSES: CompanyProposalStatus[] = [
  'SUBMITTED_TO_INSTRUCTOR',
  'RETURNED_BY_INSTRUCTOR',
  'REJECTED_BY_INSTRUCTOR',
];

const INSTRUCTOR_ACTIONABLE_STATUSES: CompanyProposalStatus[] = [
  'SUBMITTED_TO_INSTRUCTOR',
  'RETURNED_BY_INSTRUCTOR',
];

const COORDINATOR_ACTIONABLE_STATUSES: CompanyProposalStatus[] = [
  'FORWARDED_TO_COORDINATOR',
  'UNDER_COORDINATOR_REVIEW',
  'PENDING_EXTERNAL_APPROVAL',
];

const includeProposal = {
  student: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
  instructor: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  attachments: {
    include: {
      uploadedBy: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc' as const,
    },
  },
};

const notifyUser = async (userId: string, title: string, message: string, link: string) => {
  // 1. Create in-app notification
  await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      link,
      type: NotificationType.OTHER,
      read: false,
    },
  });

  // 2. Send email notification (fire-and-forget so it doesn't block the response)
  sendProposalEmailToUser(userId, title, message, link).catch((err) => {
    console.error('📧 Failed to send proposal email notification:', err);
  });
};

/**
 * Look up the user's email and send a formatted company-proposal email.
 * Runs as fire-and-forget — failures are logged but never block the caller.
 */
const sendProposalEmailToUser = async (
  userId: string,
  title: string,
  body: string,
  linkPath: string,
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
  if (!user) return;

  const clientUrl = process.env.CLIENT_URL || 'https://intrak.site';
  const fullLink = `${clientUrl}${linkPath}`;

  await emailService.sendCompanyProposalEmail(
    user.email,
    user.name,
    title,
    body,
    fullLink,
  );
};

const proposalLink = (proposalId: string, role: Role): string => {
  if (role === 'STUDENT') return `/student/partnership-assistance`;
  if (role === 'INSTRUCTOR') return `/instructor/company-proposals`;
  return `/coordinator/company-proposals`;
};

const countRoleAttachments = async (proposalId: string, role: Role): Promise<number> => {
  return prisma.companyProposalAttachment.count({
    where: {
      proposalId,
      role,
    },
  });
};

const normalizeForMatch = (value?: string | null): string => (value || '').trim().toLowerCase().replace(/\s+/g, ' ');

const findExistingCompanyForProposal = async (proposal: {
  companyName: string;
  contactEmail?: string | null;
}) => {
  const normalizedName = normalizeForMatch(proposal.companyName);
  const normalizedEmail = normalizeForMatch(proposal.contactEmail);

  const companies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
      contactEmail: true,
      contactPerson: true,
      contactNumber: true,
      address: true,
      maxSlots: true,
      industry: true,
      createdAt: true,
      updatedAt: true,
      supervisorId: true,
      companyType: true,
      workingDays: true,
      _count: {
        select: {
          students: true,
        },
      },
    },
  });

  return (
    companies.find((company) => {
      const sameName = normalizeForMatch(company.name) === normalizedName;
      const sameEmail =
        normalizedEmail.length > 0 && normalizeForMatch(company.contactEmail) === normalizedEmail;
      return sameName || sameEmail;
    }) || null
  );
};

const createCompanyFromApprovedProposal = async (
  proposal: {
    id: string;
    companyName: string;
    address?: string | null;
    contactPerson?: string | null;
    contactEmail?: string | null;
    contactNumber?: string | null;
    industry?: string | null;
  },
) => {
  const fallbackEmail = `proposal-${proposal.id.slice(0, 8)}@pending.local`;
  return prisma.company.create({
    data: {
      name: proposal.companyName.trim(),
      address: proposal.address?.trim() || 'To be updated',
      contactPerson: proposal.contactPerson?.trim() || 'To be updated',
      contactEmail: proposal.contactEmail?.trim() || fallbackEmail,
      contactNumber: proposal.contactNumber?.trim() || 'To be updated',
      industry: proposal.industry?.trim() || null,
      description: `Auto-created from approved company proposal (${proposal.id}).`,
      companyType: 'PUBLIC',
      maxSlots: 10,
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    },
    include: {
      _count: {
        select: {
          students: true,
        },
      },
    },
  });
};

const getStudentByUserId = async (userId: string) =>
  prisma.student.findUnique({
    where: { userId },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      instructor: {
        select: { id: true, name: true, email: true },
      },
    },
  });

const loadProposalWithGuard = async (proposalId: string) => {
  return prisma.companyProposal.findUnique({
    where: { id: proposalId },
    include: {
      student: true,
      instructor: true,
      attachments: true,
    },
  });
};

const ensureProposalAccess = async (req: AuthRequest, proposalId: string) => {
  const proposal = await prisma.companyProposal.findUnique({
    where: { id: proposalId },
    include: {
      student: {
        include: {
          user: true,
        },
      },
      instructor: true,
    },
  });

  if (!proposal) {
    return { error: { status: 404, message: 'Company proposal not found' }, proposal: null };
  }

  const user = req.user!;
  if (user.role === 'ADMIN' || user.role === 'COORDINATOR') {
    return { error: null, proposal };
  }

  if (user.role === 'INSTRUCTOR') {
    if (proposal.instructorId === user.id || proposal.student.instructorId === user.id) {
      return { error: null, proposal };
    }
    return { error: { status: 403, message: 'You are not assigned to this proposal' }, proposal: null };
  }

  if (user.role === 'STUDENT') {
    if (proposal.student.userId === user.id) {
      return { error: null, proposal };
    }
    return { error: { status: 403, message: 'You can only access your own proposals' }, proposal: null };
  }

  return { error: { status: 403, message: 'Insufficient permissions' }, proposal: null };
};

export const createProposal = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      companyName,
      address,
      contactPerson,
      contactEmail,
      contactNumber,
      industry,
      remarks,
    } = req.body;

    if (!companyName || typeof companyName !== 'string' || !companyName.trim()) {
      return res.status(400).json({ message: 'Company name is required' });
    }

    const student = await getStudentByUserId(userId);
    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    const proposal = await prisma.companyProposal.create({
      data: {
        studentId: student.id,
        instructorId: student.instructorId ?? null,
        companyName: companyName.trim(),
        address: address?.trim() || null,
        contactPerson: contactPerson?.trim() || null,
        contactEmail: contactEmail?.trim() || null,
        contactNumber: contactNumber?.trim() || null,
        industry: industry?.trim() || null,
        remarks: remarks?.trim() || null,
        status: 'SUBMITTED_TO_INSTRUCTOR',
      },
      include: includeProposal,
    });

    if (student.instructorId) {
      await notifyUser(
        student.instructorId,
        'New Company Proposal',
        `${student.user.name} submitted a company proposal for ${proposal.companyName}.`,
        proposalLink(proposal.id, 'INSTRUCTOR'),
      );
    }

    await logActivity({
      type: 'DOCUMENT_UPLOADED',
      description: `${student.user.name} submitted company proposal: ${proposal.companyName}`,
      userId,
      userName: student.user.name,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      message: 'Company proposal submitted successfully',
      proposal,
    });
  } catch (error) {
    console.error('Error creating company proposal:', error);
    return res.status(500).json({ message: 'Failed to submit company proposal' });
  }
};

export const getMyProposals = async (req: AuthRequest, res: Response) => {
  try {
    const student = await getStudentByUserId(req.user!.id);
    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    const proposals = await prisma.companyProposal.findMany({
      where: { studentId: student.id },
      include: includeProposal,
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ proposals });
  } catch (error) {
    console.error('Error getting student proposals:', error);
    return res.status(500).json({ message: 'Failed to fetch proposals' });
  }
};

export const deleteMyProposal = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const student = await getStudentByUserId(req.user!.id);
    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    const proposal = await prisma.companyProposal.findUnique({
      where: { id },
      include: {
        attachments: true,
        student: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!proposal || proposal.studentId !== student.id) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    if (!STUDENT_DELETABLE_STATUSES.includes(proposal.status)) {
      return res.status(400).json({
        message: 'This proposal can no longer be deleted at its current stage',
      });
    }

    const filePaths = proposal.attachments.map((attachment) => attachment.filepath);

    await prisma.companyProposal.delete({
      where: { id },
    });

    for (const storedPath of filePaths) {
      const resolved = resolveFilePath(storedPath);
      if (resolved && fs.existsSync(resolved)) {
        try {
          fs.unlinkSync(resolved);
        } catch (error) {
          console.warn(`Unable to remove file for deleted proposal: ${resolved}`, error);
        }
      }
    }

    await logActivity({
      type: 'DOCUMENT_REJECTED',
      description: `${proposal.student.user.name} deleted company proposal: ${proposal.companyName}`,
      userId: req.user!.id,
      userName: proposal.student.user.name,
      ipAddress: req.ip,
    });

    return res.json({ message: 'Proposal deleted successfully' });
  } catch (error) {
    console.error('Error deleting company proposal:', error);
    return res.status(500).json({ message: 'Failed to delete proposal' });
  }
};

export const getInstructorProposals = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { status } = req.query;

    const where: any = {
      OR: [{ instructorId: userId }, { student: { instructorId: userId } }],
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    const proposals = await prisma.companyProposal.findMany({
      where,
      include: includeProposal,
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ proposals });
  } catch (error) {
    console.error('Error getting instructor proposals:', error);
    return res.status(500).json({ message: 'Failed to fetch proposals' });
  }
};

export const getCoordinatorProposals = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    const where: any = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    const proposals = await prisma.companyProposal.findMany({
      where,
      include: includeProposal,
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ proposals });
  } catch (error) {
    console.error('Error getting coordinator proposals:', error);
    return res.status(500).json({ message: 'Failed to fetch proposals' });
  }
};

export const uploadProposalAttachment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { documentType } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!documentType) {
      return res.status(400).json({ message: 'Document type is required' });
    }

    const access = await ensureProposalAccess(req, id);
    if (access.error) {
      return res.status(access.error.status).json({ message: access.error.message });
    }

    const proposal = access.proposal!;
    const role = req.user!.role as Role;

    if (role === 'STUDENT') {
      if (proposal.student.userId !== req.user!.id) {
        return res.status(403).json({ message: 'You can only upload to your own proposal' });
      }
      if (!STUDENT_UPLOADABLE_STATUSES.includes(proposal.status)) {
        return res.status(400).json({ message: 'This proposal is no longer open for student uploads' });
      }
    }

    if (role === 'INSTRUCTOR') {
      if (!(proposal.instructorId === req.user!.id || proposal.student.instructorId === req.user!.id)) {
        return res.status(403).json({ message: 'You are not assigned to this student' });
      }
      if (!INSTRUCTOR_ACTIONABLE_STATUSES.includes(proposal.status)) {
        return res.status(400).json({ message: 'Instructor uploads are not allowed at the current stage' });
      }
    }

    if (role === 'COORDINATOR') {
      if (!COORDINATOR_ACTIONABLE_STATUSES.includes(proposal.status)) {
        return res.status(400).json({ message: 'Coordinator uploads are not allowed at the current stage' });
      }
    }

    const { storagePath, isUsingFallback } = getStoragePathWithFallback();
    const proposalDir = path.join(storagePath, 'company-proposals', id);
    await ensureNASDirectoryExists(proposalDir);

    const finalFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(req.file.originalname)}`;
    const finalPath = path.join(proposalDir, finalFilename);

    try {
      fs.copyFileSync(req.file.path, finalPath);
      fs.unlinkSync(req.file.path);

      if (!isUsingFallback && finalPath.startsWith(process.env.NAS_PATH || '/mnt/nas/intrak')) {
        createLocalBackup(finalPath, finalPath);
      }
    } catch (moveError) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      if (fs.existsSync(finalPath)) {
        fs.unlinkSync(finalPath);
      }
      throw moveError;
    }

    const attachment = await prisma.companyProposalAttachment.create({
      data: {
        proposalId: id,
        uploadedById: req.user!.id,
        role,
        documentType,
        filename: req.file.originalname,
        filepath: finalPath,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    await logActivity({
      type: 'DOCUMENT_UPLOADED',
      description: `${req.user!.name} uploaded ${documentType} for proposal ${proposal.companyName}`,
      userId: req.user!.id,
      userName: req.user!.name,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      message: 'Attachment uploaded successfully',
      attachment,
    });
  } catch (error) {
    console.error('Error uploading company proposal attachment:', error);
    return res.status(500).json({ message: 'Failed to upload attachment' });
  }
};

export const downloadAttachment = async (req: AuthRequest, res: Response) => {
  try {
    const { attachmentId } = req.params;
    const attachment = await prisma.companyProposalAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        proposal: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    const access = await ensureProposalAccess(req, attachment.proposalId);
    if (access.error) {
      return res.status(access.error.status).json({ message: access.error.message });
    }

    const resolvedPath = resolveFilePath(attachment.filepath);
    if (!resolvedPath || !fs.existsSync(resolvedPath)) {
      return res.status(404).json({ message: 'Attachment file not found' });
    }

    return res.download(resolvedPath, attachment.filename);
  } catch (error) {
    console.error('Error downloading proposal attachment:', error);
    return res.status(500).json({ message: 'Failed to download attachment' });
  }
};

export const instructorForwardProposal = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const proposal = await loadProposalWithGuard(id);
    if (!proposal) {
      return res.status(404).json({ message: 'Company proposal not found' });
    }

    if (!(proposal.instructorId === req.user!.id || proposal.student.instructorId === req.user!.id)) {
      return res.status(403).json({ message: 'You are not assigned to this proposal' });
    }

    if (!INSTRUCTOR_ACTIONABLE_STATUSES.includes(proposal.status)) {
      return res.status(400).json({ message: 'Proposal cannot be forwarded at its current stage' });
    }

    const instructorAttachments = await countRoleAttachments(id, 'INSTRUCTOR');
    if (instructorAttachments === 0) {
      return res.status(400).json({
        message: 'Please upload an instructor endorsement file before forwarding',
      });
    }

    const updatedProposal = await prisma.companyProposal.update({
      where: { id },
      data: {
        status: 'FORWARDED_TO_COORDINATOR',
        remarks: remarks?.trim() || proposal.remarks,
        instructorId: req.user!.id,
        instructorReviewedAt: new Date(),
      },
      include: includeProposal,
    });

    const coordinators = await prisma.user.findMany({
      where: { role: 'COORDINATOR', active: true },
      select: { id: true },
    });

    await Promise.all(
      coordinators.map((coordinator) =>
        notifyUser(
          coordinator.id,
          'Company Proposal for Review',
          `${req.user!.name} forwarded ${proposal.companyName} for coordinator review.`,
          proposalLink(id, 'COORDINATOR'),
        ),
      ),
    );

    await notifyUser(
      proposal.student.userId,
      'Company Proposal Forwarded',
      `Your proposal for ${proposal.companyName} has been forwarded to the OJT Coordinator.`,
      proposalLink(id, 'STUDENT'),
    );

    return res.json({ message: 'Proposal forwarded to coordinator', proposal: updatedProposal });
  } catch (error) {
    console.error('Error forwarding proposal:', error);
    return res.status(500).json({ message: 'Failed to forward proposal' });
  }
};

export const instructorRejectOrReturnProposal = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { decision, remarks } = req.body;

    if (!['RETURNED_BY_INSTRUCTOR', 'REJECTED_BY_INSTRUCTOR'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be RETURNED_BY_INSTRUCTOR or REJECTED_BY_INSTRUCTOR' });
    }

    if (!remarks || !remarks.trim()) {
      return res.status(400).json({ message: 'Remarks are required' });
    }

    const proposal = await loadProposalWithGuard(id);
    if (!proposal) {
      return res.status(404).json({ message: 'Company proposal not found' });
    }

    if (!(proposal.instructorId === req.user!.id || proposal.student.instructorId === req.user!.id)) {
      return res.status(403).json({ message: 'You are not assigned to this proposal' });
    }

    if (!INSTRUCTOR_ACTIONABLE_STATUSES.includes(proposal.status)) {
      return res.status(400).json({ message: 'Proposal cannot be updated by instructor at this stage' });
    }

    const updatedProposal = await prisma.companyProposal.update({
      where: { id },
      data: {
        status: decision,
        remarks: remarks.trim(),
        instructorId: req.user!.id,
        instructorReviewedAt: new Date(),
      },
      include: includeProposal,
    });

    await notifyUser(
      proposal.student.userId,
      decision === 'RETURNED_BY_INSTRUCTOR' ? 'Company Proposal Returned' : 'Company Proposal Rejected',
      decision === 'RETURNED_BY_INSTRUCTOR'
        ? `Your proposal for ${proposal.companyName} was returned by your instructor for revision.`
        : `Your proposal for ${proposal.companyName} was rejected by your instructor.`,
      proposalLink(id, 'STUDENT'),
    );

    return res.json({
      message:
        decision === 'RETURNED_BY_INSTRUCTOR'
          ? 'Proposal returned to student'
          : 'Proposal rejected by instructor',
      proposal: updatedProposal,
    });
  } catch (error) {
    console.error('Error updating instructor decision:', error);
    return res.status(500).json({ message: 'Failed to update proposal decision' });
  }
};

export const instructorNotifyStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const proposal = await loadProposalWithGuard(id);
    if (!proposal) {
      return res.status(404).json({ message: 'Company proposal not found' });
    }

    if (!(proposal.instructorId === req.user!.id || proposal.student.instructorId === req.user!.id)) {
      return res.status(403).json({ message: 'You are not assigned to this proposal' });
    }

    if (!['APPROVED', 'REJECTED'].includes(proposal.status)) {
      return res.status(400).json({
        message: 'Student can only be notified after coordinator final decision',
      });
    }

    const defaultMessage =
      proposal.status === 'APPROVED'
        ? `Your proposed company "${proposal.companyName}" is approved and can proceed for OJT application steps.`
        : `Your proposed company "${proposal.companyName}" was not approved. Please coordinate with your instructor for next steps.`;

    await notifyUser(
      proposal.student.userId,
      `Instructor Update: Company Proposal ${proposal.status}`,
      message?.trim() || defaultMessage,
      proposalLink(id, 'STUDENT'),
    );

    await logActivity({
      type: 'DOCUMENT_APPROVED',
      description: `${req.user!.name} notified student about ${proposal.companyName} decision (${proposal.status})`,
      userId: req.user!.id,
      userName: req.user!.name,
      ipAddress: req.ip,
    });

    return res.json({ message: 'Student notified successfully' });
  } catch (error) {
    console.error('Error notifying student from instructor:', error);
    return res.status(500).json({ message: 'Failed to notify student' });
  }
};

export const coordinatorMarkExternalPending = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const proposal = await loadProposalWithGuard(id);
    if (!proposal) {
      return res.status(404).json({ message: 'Company proposal not found' });
    }

    if (proposal.status === 'PENDING_EXTERNAL_APPROVAL') {
      return res.json({
        message: 'Proposal is already marked as pending external approval',
        proposal,
      });
    }

    if (!['FORWARDED_TO_COORDINATOR', 'UNDER_COORDINATOR_REVIEW'].includes(proposal.status)) {
      return res.status(400).json({
        message: 'Proposal must be forwarded first before marking external pending',
      });
    }

    const updatedProposal = await prisma.companyProposal.update({
      where: { id },
      data: {
        status: 'PENDING_EXTERNAL_APPROVAL',
        coordinatorRemarks: remarks?.trim() || proposal.coordinatorRemarks,
      },
      include: includeProposal,
    });

    if (proposal.instructorId) {
      await notifyUser(
        proposal.instructorId,
        'Company Proposal Sent to University President',
        `${proposal.companyName} has been sent to the University President for external review.`,
        proposalLink(id, 'INSTRUCTOR'),
      );
    }

    return res.json({
      message: 'Proposal moved to pending external approval',
      proposal: updatedProposal,
    });
  } catch (error) {
    console.error('Error marking proposal pending external approval:', error);
    return res.status(500).json({ message: 'Failed to update proposal stage' });
  }
};

export const coordinatorFinalizeProposal = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { decision, remarks, externalReference } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be APPROVED or REJECTED' });
    }

    if (!remarks || !remarks.trim()) {
      return res.status(400).json({ message: 'Remarks are required for finalization' });
    }

    const proposal = await loadProposalWithGuard(id);
    if (!proposal) {
      return res.status(404).json({ message: 'Company proposal not found' });
    }

    if (proposal.status !== 'PENDING_EXTERNAL_APPROVAL') {
      return res.status(400).json({
        message: 'Finalize is only allowed after the proposal is sent to University President and marked pending external approval',
      });
    }

    const updatedProposal = await prisma.companyProposal.update({
      where: { id },
      data: {
        status: decision,
        coordinatorRemarks: remarks.trim(),
        externalReference: externalReference?.trim() || null,
        coordinatorReviewedAt: new Date(),
      },
      include: includeProposal,
    });

    let linkedCompany: any = null;
    let companyAction: 'created_new' | 'linked_existing' | 'none' = 'none';

    if (decision === 'APPROVED') {
      const existingCompany = await findExistingCompanyForProposal({
        companyName: proposal.companyName,
        contactEmail: proposal.contactEmail,
      });

      if (existingCompany) {
        linkedCompany = existingCompany;
        companyAction = 'linked_existing';
      } else {
        linkedCompany = await createCompanyFromApprovedProposal({
          id: proposal.id,
          companyName: proposal.companyName,
          address: proposal.address,
          contactPerson: proposal.contactPerson,
          contactEmail: proposal.contactEmail,
          contactNumber: proposal.contactNumber,
          industry: proposal.industry,
        });
        companyAction = 'created_new';
      }
    }

    if (proposal.instructorId) {
      await notifyUser(
        proposal.instructorId,
        `Company Proposal Returned from University President`,
        `${proposal.companyName} was returned to coordinator and marked as ${decision.toLowerCase()}. Please inform the student.`,
        proposalLink(id, 'INSTRUCTOR'),
      );
    }

    return res.json({
      message: `Proposal ${decision.toLowerCase()} successfully`,
      proposal: updatedProposal,
      company: linkedCompany,
      companyAction,
    });
  } catch (error) {
    console.error('Error finalizing proposal:', error);
    return res.status(500).json({ message: 'Failed to finalize proposal' });
  }
};
