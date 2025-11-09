import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from './activity.controller';

const prisma = new PrismaClient();

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
  } catch (error: any) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Failed to fetch applications', error: error.message });
  }
};

// Get student's applications
export const getMyApplications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get student record
    const student = await prisma.student.findUnique({
      where: { userId }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    const applications = await prisma.companyApplication.findMany({
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

    res.json({ applications });
  } catch (error: any) {
    console.error('Error fetching my applications:', error);
    res.status(500).json({ message: 'Failed to fetch applications', error: error.message });
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
      } else if (existingApplication.status === 'REJECTED') {
        // Allow reapplication if previously rejected
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

        // Log activity
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
  } catch (error: any) {
    console.error('Error applying to company:', error);
    res.status(500).json({ message: 'Failed to submit application', error: error.message });
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

    res.json({ 
      application: result,
      message: 'Application approved and student assigned to company successfully' 
    });
  } catch (error: any) {
    console.error('Error approving application:', error);
    res.status(500).json({ message: 'Failed to approve application', error: error.message });
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

    res.json({ 
      application: updatedApplication,
      message: 'Application rejected successfully' 
    });
  } catch (error: any) {
    console.error('Error rejecting application:', error);
    res.status(500).json({ message: 'Failed to reject application', error: error.message });
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

    res.json({ 
      application: updatedApplication,
      message: 'Application withdrawn successfully' 
    });
  } catch (error: any) {
    console.error('Error withdrawing application:', error);
    res.status(500).json({ message: 'Failed to withdraw application', error: error.message });
  }
};

