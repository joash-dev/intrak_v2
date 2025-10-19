import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";

const prisma = new PrismaClient();

// Helper function for audit logging
const auditLog = async (userId: string, action: string, meta: any, req: any) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        meta,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || 'Unknown'
      }
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
};

// =============================================
// COMPANY MANAGEMENT CONTROLLERS
// =============================================

// Get all companies
export const getAllCompanies = async (req: AuthRequest, res: Response) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        students: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        },
        _count: {
          select: {
            students: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ companies });
  } catch (error: any) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ message: 'Failed to fetch companies', error: error.message });
  }
};

// Get company by ID
export const getCompanyById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        students: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        },
        _count: {
          select: {
            students: true
          }
        }
      }
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json({ company });
  } catch (error: any) {
    console.error('Error fetching company:', error);
    res.status(500).json({ message: 'Failed to fetch company', error: error.message });
  }
};

// Create new company
export const createCompany = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      address,
      contactPerson,
      contactEmail,
      contactNumber,
      latitude,
      longitude,
      radiusMeters
    } = req.body;

    // Validate required fields
    if (!name || !address || !contactPerson || !contactEmail || !contactNumber) {
      return res.status(400).json({ 
        message: 'Missing required fields: name, address, contactPerson, contactEmail, contactNumber' 
      });
    }

    // Check if company with same email already exists
    const existingCompany = await prisma.company.findFirst({
      where: { contactEmail }
    });

    if (existingCompany) {
      return res.status(400).json({ message: 'Company with this email already exists' });
    }

    const company = await prisma.company.create({
      data: {
        name,
        address,
        contactPerson,
        contactEmail,
        contactNumber,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        radiusMeters: radiusMeters ? parseInt(radiusMeters) : 100
      },
      include: {
        students: true,
        _count: {
          select: {
            students: true
          }
        }
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || 'system',
        action: 'CREATE_COMPANY',
        meta: { companyName: company.name },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || 'Unknown'
      }
    });

    res.status(201).json({ company });
  } catch (error: any) {
    console.error('Error creating company:', error);
    res.status(500).json({ message: 'Failed to create company', error: error.message });
  }
};

// Update company
export const updateCompany = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      address,
      contactPerson,
      contactEmail,
      contactNumber,
      latitude,
      longitude,
      radiusMeters
    } = req.body;

    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id }
    });

    if (!existingCompany) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Check if email is being changed and if it already exists
    if (contactEmail && contactEmail !== existingCompany.contactEmail) {
      const emailExists = await prisma.company.findFirst({
        where: { 
          contactEmail,
          id: { not: id }
        }
      });

      if (emailExists) {
        return res.status(400).json({ message: 'Company with this email already exists' });
      }
    }

    const company = await prisma.company.update({
      where: { id },
      data: {
        name,
        address,
        contactPerson,
        contactEmail,
        contactNumber,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        radiusMeters: radiusMeters ? parseInt(radiusMeters) : 100
      },
      include: {
        students: true,
        _count: {
          select: {
            students: true
          }
        }
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || 'system',
        action: 'UPDATE_COMPANY',
        meta: { companyName: company.name },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || 'Unknown'
      }
    });

    res.json({ company });
  } catch (error: any) {
    console.error('Error updating company:', error);
    res.status(500).json({ message: 'Failed to update company', error: error.message });
  }
};

// Delete company
export const deleteCompany = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            students: true
          }
        }
      }
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Check if company has assigned students
    if (company._count.students > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete company with assigned students. Please unassign students first.' 
      });
    }

    await prisma.company.delete({
      where: { id }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || 'system',
        action: 'DELETE_COMPANY',
        meta: { companyName: company.name },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || 'Unknown'
      }
    });

    res.json({ message: 'Company deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting company:', error);
    res.status(500).json({ message: 'Failed to delete company', error: error.message });
  }
};

// =============================================
// MOA MANAGEMENT CONTROLLERS (Using Document model)
// =============================================

// Get all MOA documents
export const getAllMOAs = async (req: AuthRequest, res: Response) => {
  try {
    const { status, companyId, expiring } = req.query;

    let whereClause: any = {
      type: 'MOA'
    };

    if (status) {
      whereClause.status = status;
    }

    if (companyId) {
      whereClause.student = {
        companyId: companyId
      };
    }

    if (expiring === 'true') {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      // For MOA documents, we'll use the createdAt date as a proxy for expiry
      // In a real implementation, you'd want to add an expiry date field
      whereClause.createdAt = {
        lte: thirtyDaysFromNow,
        gte: new Date()
      };
    }

    const moas = await prisma.document.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: {
              select: { name: true, email: true }
            },
            company: {
              select: {
                id: true,
                name: true,
                contactEmail: true,
                contactPerson: true
              }
            }
          }
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { uploadedAt: 'desc' }
    });

    res.json({ moas });
  } catch (error: any) {
    console.error('Error fetching MOAs:', error);
    res.status(500).json({ message: 'Failed to fetch MOAs', error: error.message });
  }
};

// Get MOA by ID
export const getMOAById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const moa = await prisma.document.findFirst({
      where: { 
        id,
        type: 'MOA'
      },
      include: {
        student: {
          include: {
            user: {
              select: { name: true, email: true }
            },
            company: {
              select: {
                id: true,
                name: true,
                contactEmail: true,
                contactPerson: true,
                contactNumber: true,
                address: true
              }
            }
          }
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!moa) {
      return res.status(404).json({ message: 'MOA not found' });
    }

    res.json({ moa });
  } catch (error: any) {
    console.error('Error fetching MOA:', error);
    res.status(500).json({ message: 'Failed to fetch MOA', error: error.message });
  }
};

// Approve MOA document
export const approveMOA = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    // Check if MOA exists
    const moa = await prisma.document.findFirst({
      where: { 
        id,
        type: 'MOA'
      },
      include: {
        student: {
          include: {
            user: {
              select: { name: true, email: true }
            },
            company: true
          }
        }
      }
    });

    if (!moa) {
      return res.status(404).json({ message: 'MOA not found' });
    }

    if (moa.status === 'APPROVED') {
      return res.status(400).json({ message: 'MOA is already approved' });
    }

    const updatedMOA = await prisma.document.update({
      where: { id },
      data: {
        status: 'APPROVED',
        remarks: notes || moa.remarks
      },
      include: {
        student: {
          include: {
            user: {
              select: { name: true, email: true }
            },
            company: {
              select: {
                id: true,
                name: true,
                contactEmail: true,
                contactPerson: true
              }
            }
          }
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || 'system',
        action: 'APPROVE_MOA',
        meta: { 
          moaId: moa.id,
          companyName: moa.student?.company?.name,
          studentName: moa.student?.user?.name
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || 'Unknown'
      }
    });

    res.json({ moa: updatedMOA });
  } catch (error: any) {
    console.error('Error approving MOA:', error);
    res.status(500).json({ message: 'Failed to approve MOA', error: error.message });
  }
};

// Reject MOA document
export const rejectMOA = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    // Check if MOA exists
    const moa = await prisma.document.findFirst({
      where: { 
        id,
        type: 'MOA'
      },
      include: {
        student: {
          include: {
            user: {
              select: { name: true, email: true }
            },
            company: true
          }
        }
      }
    });

    if (!moa) {
      return res.status(404).json({ message: 'MOA not found' });
    }

    if (moa.status === 'REJECTED') {
      return res.status(400).json({ message: 'MOA is already rejected' });
    }

    const updatedMOA = await prisma.document.update({
      where: { id },
      data: {
        status: 'REJECTED',
        remarks: reason
      },
      include: {
        student: {
          include: {
            user: {
              select: { name: true, email: true }
            },
            company: {
              select: {
                id: true,
                name: true,
                contactEmail: true,
                contactPerson: true
              }
            }
          }
        }
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || 'system',
        action: 'REJECT_MOA',
        meta: { 
          moaId: moa.id,
          companyName: moa.student?.company?.name,
          studentName: moa.student?.user?.name,
          reason: reason
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || 'Unknown'
      }
    });

    res.json({ moa: updatedMOA });
  } catch (error: any) {
    console.error('Error rejecting MOA:', error);
    res.status(500).json({ message: 'Failed to reject MOA', error: error.message });
  }
};

// Get MOA statistics
export const getMOAStats = async (req: AuthRequest, res: Response) => {
  try {
    const totalMOAs = await prisma.document.count({
      where: { type: 'MOA' }
    });
    
    const approvedMOAs = await prisma.document.count({ 
      where: { 
        type: 'MOA',
        status: 'APPROVED' 
      } 
    });
    
    const pendingMOAs = await prisma.document.count({ 
      where: { 
        type: 'MOA',
        status: 'PENDING' 
      } 
    });
    
    const rejectedMOAs = await prisma.document.count({ 
      where: { 
        type: 'MOA',
        status: 'REJECTED' 
      } 
    });

    // For expiring MOAs, we'll use a simple date-based approach
    // In a real implementation, you'd want to add proper expiry tracking
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const expiringMOAs = await prisma.document.count({
      where: {
        type: 'MOA',
        status: 'APPROVED',
        uploadedAt: {
          lte: thirtyDaysAgo
        }
      }
    });

    res.json({
      stats: {
        total: totalMOAs,
        approved: approvedMOAs,
        pending: pendingMOAs,
        rejected: rejectedMOAs,
        expiring: expiringMOAs
      }
    });
  } catch (error: any) {
    console.error('Error fetching MOA stats:', error);
    res.status(500).json({ message: 'Failed to fetch MOA statistics', error: error.message });
  }
};