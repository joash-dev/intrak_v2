import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from './activity.controller';
import { prisma } from '../config/database';
import { emitStudentPortalSync } from '../utils/socketEmitters';

// Get all applications (for instructors/coordinators)
export const getAllApplications = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    const where: any = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    const applications = await prisma.companyApplication.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        company: {
          include: {
            students: {
              select: { id: true }
            }
          }
        },
        reviewer: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ applications });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Failed to fetch applications', error: (error instanceof Error ? error.message : String(error)) });
  }
};

// Get student's applications
export const getMyApplications = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userId = req.user.id;

    // Get student record
    let student;
    try {
      student = await prisma.student.findUnique({
        where: { userId }
      });
    } catch (dbError: any) {
      console.error('Database error fetching student:', dbError);
      return res.status(500).json({
        message: 'Failed to fetch student record',
        error: process.env.NODE_ENV === 'development' ? (dbError instanceof Error ? dbError.message : String(dbError)) : undefined
      });
    }

    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    let applications: any[] = [];
    try {
      applications = await prisma.companyApplication.findMany({
        where: {
          studentId: student.id
        },
        include: {
          company: true,
          reviewer: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (appError: any) {
      console.error('Error fetching applications:', appError);
      // Return empty array instead of error if applications query fails
      applications = [];
    }

    // Format applications with null safety
    const formattedApplications = applications.map(app => ({
      id: app.id || '',
      studentId: app.studentId || '',
      companyId: app.companyId || '',
      status: app.status || 'PENDING',
      message: app.message || null,
      rejectionReason: app.rejectionReason || null,
      appliedAt: app.appliedAt ? app.appliedAt.toISOString() : null,
      reviewedAt: app.reviewedAt ? app.reviewedAt.toISOString() : null,
      reviewedBy: app.reviewedBy || null,
      company: app.company ? {
        id: app.company.id || '',
        name: app.company.name || '',
        address: app.company.address || null,
        contactPerson: app.company.contactPerson || null,
        email: app.company.email || null,
        phone: app.company.phone || null
      } : null,
      reviewer: app.reviewer ? {
        name: app.reviewer.name || '',
        email: app.reviewer.email || ''
      } : null
    }));

    res.json({ applications: formattedApplications });
  } catch (error) {
    console.error('Error fetching my applications:', error);
    res.status(500).json({
      message: 'Failed to fetch applications',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    });
  }
};

// Apply to a company
export const applyToCompany = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { companyId, message } = req.body;

    if (!companyId) {
      return res.status(400).json({ message: 'Company ID is required' });
    }

    // Get student record
    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        user: true,
        company: true
      }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    // Check if student already has a company
    if (student.companyId) {
      return res.status(400).json({
        message: 'You already have a company assigned. Please contact your instructor to change companies.'
      });
    }

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        students: true
      }
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Check if company has available slots
    if (company.students.length >= company.maxSlots) {
      return res.status(400).json({
        message: `This company has no available slots. Current: ${company.students.length}/${company.maxSlots}`
      });
    }

    // Check if student already applied to this company
    const existingApplication = await prisma.companyApplication.findUnique({
      where: {
        studentId_companyId: {
          studentId: student.id,
          companyId
        }
      }
    });

    if (existingApplication) {
      if (existingApplication.status === 'PENDING') {
        return res.status(400).json({ message: 'You already have a pending application to this company' });
      } else if (existingApplication.status === 'APPROVED') {
        return res.status(400).json({ message: 'Your application to this company was already approved' });
      } else if (existingApplication.status === 'REJECTED' || existingApplication.status === 'WITHDRAWN') {
        // Reuse row: re-apply after rejection or student withdrawal (unique studentId+companyId)
        const application = await prisma.companyApplication.update({
          where: { id: existingApplication.id },
          data: {
            status: 'PENDING',
            message: message || null,
            rejectionReason: null,
            reviewedAt: null,
            reviewedBy: null,
            appliedAt: new Date()
          },
          include: {
            company: true
          }
        });

        await logActivity({
          type: 'DOCUMENT_UPLOADED',
          description: `${student.user.name} reapplied to ${company.name}`,
          userId: userId,
          userName: student.user.name,
          ipAddress: req.ip
        });

        return res.status(201).json({
          application,
          message: 'Application resubmitted successfully'
        });
      }
    }

    // Create new application
    const application = await prisma.companyApplication.create({
      data: {
        studentId: student.id,
        companyId,
        message: message || null,
        status: 'PENDING'
      },
      include: {
        company: true,
        student: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Log activity
    await logActivity({
      type: 'DOCUMENT_UPLOADED',
      description: `${student.user.name} applied to ${company.name}`,
      userId: userId,
      userName: student.user.name,
      ipAddress: req.ip
    });

    res.status(201).json({
      application,
      message: 'Application submitted successfully'
    });
  } catch (error) {
    console.error('Error applying to company:', error);
    res.status(500).json({ message: 'Failed to submit application', error: (error instanceof Error ? error.message : String(error)) });
  }
};

// Approve application
export const approveApplication = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userName = req.user!.name;

    const application = await prisma.companyApplication.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: true
          }
        },
        company: true
      }
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status !== 'PENDING') {
      return res.status(400).json({ message: 'Application has already been reviewed' });
    }

    // Check if company still has slots
    const company = await prisma.company.findUnique({
      where: { id: application.companyId },
      include: {
        students: true
      }
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (company.students.length >= company.maxSlots) {
      return res.status(400).json({
        message: `Cannot approve. Company has no available slots. Current: ${company.students.length}/${company.maxSlots}`
      });
    }

    // Update application and assign student to company in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update application status
      const updatedApplication = await tx.companyApplication.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedBy: userId
        },
        include: {
          student: {
            include: {
              user: true
            }
          },
          company: true,
          reviewer: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });

      // Assign student to company
      await tx.student.update({
        where: { id: application.studentId },
        data: {
          companyId: application.companyId
        }
      });

      // Reject all other pending applications from this student
      await tx.companyApplication.updateMany({
        where: {
          studentId: application.studentId,
          id: { not: id },
          status: 'PENDING'
        },
        data: {
          status: 'REJECTED',
          rejectionReason: 'Student was assigned to another company',
          reviewedAt: new Date(),
          reviewedBy: userId
        }
      });

      return updatedApplication;
    });

    // Log activity
    await logActivity({
      type: 'DOCUMENT_APPROVED',
      description: `${application.student.user.name} approved for ${company.name} by ${userName}`,
      userId: userId,
      userName: userName,
      ipAddress: req.ip
    });

    emitStudentPortalSync(application.student.user.id, { reason: 'company_application_approved' });

    res.json({
      application: result,
      message: 'Application approved and student assigned to company successfully'
    });
  } catch (error) {
    console.error('Error approving application:', error);
    res.status(500).json({ message: 'Failed to approve application', error: (error instanceof Error ? error.message : String(error)) });
  }
};

// Reject application
export const rejectApplication = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const userId = req.user!.id;
    const userName = req.user!.name;

    const application = await prisma.companyApplication.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: true
          }
        },
        company: true
      }
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status !== 'PENDING') {
      return res.status(400).json({ message: 'Application has already been reviewed' });
    }

    const updatedApplication = await prisma.companyApplication.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: rejectionReason || 'No reason provided',
        reviewedAt: new Date(),
        reviewedBy: userId
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        company: true,
        reviewer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Log activity
    await logActivity({
      type: 'DOCUMENT_REJECTED',
      description: `${application.student.user.name}'s application to ${application.company.name} rejected by ${userName}`,
      userId: userId,
      userName: userName,
      ipAddress: req.ip
    });

    emitStudentPortalSync(application.student.user.id, { reason: 'company_application_rejected' });

    res.json({
      application: updatedApplication,
      message: 'Application rejected successfully'
    });
  } catch (error) {
    console.error('Error rejecting application:', error);
    res.status(500).json({ message: 'Failed to reject application', error: (error instanceof Error ? error.message : String(error)) });
  }
};

// Withdraw application (student cancels their own application)
export const withdrawApplication = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Get student record
    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        user: true
      }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    const application = await prisma.companyApplication.findUnique({
      where: { id },
      include: {
        company: true
      }
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.studentId !== student.id) {
      return res.status(403).json({ message: 'You can only withdraw your own applications' });
    }

    if (application.status !== 'PENDING') {
      return res.status(400).json({ message: 'Only pending applications can be withdrawn' });
    }

    const updatedApplication = await prisma.companyApplication.update({
      where: { id },
      data: {
        status: 'WITHDRAWN'
      },
      include: {
        company: true
      }
    });

    // Log activity
    await logActivity({
      type: 'DOCUMENT_REJECTED',
      description: `${student.user.name} withdrew application to ${application.company.name}`,
      userId: userId,
      userName: student.user.name,
      ipAddress: req.ip
    });

    emitStudentPortalSync(userId, { reason: 'company_application_withdrawn' });

    res.json({
      application: updatedApplication,
      message: 'Application withdrawn successfully'
    });
  } catch (error) {
    console.error('Error withdrawing application:', error);
    res.status(500).json({ message: 'Failed to withdraw application', error: (error instanceof Error ? error.message : String(error)) });
  }
};

/** Student leaves an approved internship placement (clears company assignment). */
export const resignFromPlacement = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const student = await prisma.student.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    if (!student.companyId) {
      return res.status(400).json({ message: 'You do not have an active company placement to resign from' });
    }

    const application = await prisma.companyApplication.findFirst({
      where: {
        studentId: student.id,
        companyId: student.companyId,
        status: 'APPROVED',
      },
      include: { company: true },
    });

    if (!application) {
      return res.status(404).json({
        message:
          'No approved application matches your current assignment. Please contact your coordinator if you need to change companies.',
      });
    }

    const companyName = application.company.name;

    await prisma.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: student.id },
        data: {
          companyId: null,
          supervisorName: null,
          startDate: null,
          endDate: null,
          completedHours: 0,
          jobDescription: null,
        },
      });

      await tx.companyApplication.update({
        where: { id: application.id },
        data: {
          status: 'WITHDRAWN',
          rejectionReason: 'Student resigned from internship placement',
        },
      });
    });

    await logActivity({
      type: 'USER_UPDATED',
      description: `${student.user.name} resigned from internship placement at ${companyName}`,
      userId,
      userName: student.user.name,
      ipAddress: req.ip,
    });

    emitStudentPortalSync(userId, { reason: 'student_resigned_placement' });

    res.json({
      message: 'You have resigned from your internship placement. You may apply to companies again.',
    });
  } catch (error) {
    console.error('Error resigning from placement:', error);
    res.status(500).json({
      message: 'Failed to resign from placement',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

