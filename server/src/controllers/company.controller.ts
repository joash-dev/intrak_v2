import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { AuthRequest } from "../middleware/auth";
import { emailService } from "../services/email.service";

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

const generateTemporaryPassword = (): string => {
  const base = crypto.randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
  const core = base.slice(0, 8);
  return `${core}A1!`;
};

type SupervisorProvisionSuccess = {
  created: boolean;
  supervisorUser: {
    id: string;
    name: string | null;
    email: string;
  };
  companyName: string;
  contactPerson: string | null;
  temporaryPassword?: string;
};

type SupervisorProvisionError = {
  error: {
    status: number;
    message: string;
  };
};

const provisionSupervisorAccount = async (
  companyId: string
): Promise<SupervisorProvisionSuccess | SupervisorProvisionError> => {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      supervisor: true,
    },
  });

  if (!company) {
    return { error: { status: 404, message: 'Company not found' } };
  }

  if (!company.contactEmail || !company.contactEmail.trim()) {
    return {
      error: {
        status: 400,
        message:
          'Company contact email is required before creating a supervisor account. Please update the company record with a valid email address.',
      },
    };
  }

  if (company.supervisorId && company.supervisor) {
    return {
      created: false,
      supervisorUser: {
        id: company.supervisor.id,
        name: company.supervisor.name,
        email: company.supervisor.email,
      },
      companyName: company.name,
      contactPerson: company.contactPerson,
      temporaryPassword: undefined,
    };
  }

  let supervisorUser = await prisma.user.findUnique({
    where: { email: company.contactEmail },
  });

  let temporaryPassword: string | undefined;
  let created = false;

  if (!supervisorUser) {
    const tempPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    supervisorUser = await prisma.user.create({
      data: {
        email: company.contactEmail,
        name: company.contactPerson || `${company.name} Supervisor`,
        passwordHash,
        role: 'INDUSTRY_PARTNER',
      },
    });

    temporaryPassword = tempPassword;
    created = true;
  } else if (supervisorUser.role !== 'INDUSTRY_PARTNER') {
    return {
      error: {
        status: 400,
        message: `The contact email ${company.contactEmail} already belongs to a ${supervisorUser.role.toLowerCase()}. Please use a unique supervisor email for this company.`,
      },
    };
  } else {
    temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);
    const trimmedContact = company.contactPerson?.trim();

    supervisorUser = await prisma.user.update({
      where: { id: supervisorUser.id },
      data: {
        passwordHash,
        name:
          trimmedContact && trimmedContact.length > 0
            ? trimmedContact
            : supervisorUser.name,
      },
    });
  }

  await prisma.company.update({
    where: { id: company.id },
    data: { supervisorId: supervisorUser.id },
  });

  return {
    created,
    supervisorUser: {
      id: supervisorUser.id,
      name: supervisorUser.name,
      email: supervisorUser.email,
    },
    companyName: company.name,
    contactPerson: company.contactPerson,
    temporaryPassword,
  };
};

// =============================================
// COMPANY MANAGEMENT CONTROLLERS
// =============================================

// Get all companies
export const getAllCompanies = async (req: AuthRequest, res: Response) => {
  try {
    // First, try to get companies with a simpler query to identify the issue
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        contactPerson: true,
        contactEmail: true,
        contactNumber: true,
        latitude: true,
        longitude: true,
        radiusMeters: true,
        maxSlots: true,
        description: true,
        industry: true,
        supervisorId: true,
        companyType: true,
        workingDays: true,
        createdAt: true,
        updatedAt: true,
        supervisor: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get student counts separately to avoid potential issues with _count
    const companiesWithCounts = await Promise.all(
      companies.map(async (company) => {
        try {
          const studentCount = await prisma.student.count({
            where: { companyId: company.id },
          });

          return {
            ...company,
            _count: {
              students: studentCount,
            },
          };
        } catch (countError) {
          console.error(`Error counting students for company ${company.id}:`, countError);
          return {
            ...company,
            _count: {
              students: 0,
            },
          };
        }
      })
    );

    // Ensure proper serialization of dates and arrays
    const serializedCompanies = companiesWithCounts.map(company => ({
      ...company,
      createdAt: company.createdAt instanceof Date ? company.createdAt.toISOString() : company.createdAt,
      updatedAt: company.updatedAt instanceof Date ? company.updatedAt.toISOString() : company.updatedAt,
      workingDays: Array.isArray(company.workingDays) ? company.workingDays : [],
      supervisor: company.supervisor || null,
    }));

    res.json({ companies: serializedCompanies });
  } catch (error) {
    console.error('Error fetching companies:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : undefined);
    console.error('Error code:', (error as any)?.code);
    console.error('Error meta:', (error as any)?.meta);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch companies';
    const errorDetails = process.env.NODE_ENV === 'development'
      ? {
        message: errorMessage,
        code: (error as any)?.code,
        meta: (error as any)?.meta,
      }
      : { message: errorMessage };

    res.status(500).json({
      message: 'Failed to fetch companies',
      error: errorDetails
    });
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
              select: { name: true, email: true },
            },
          },
        },
        supervisor: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json({ company });
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ message: 'Failed to fetch company', error: (error instanceof Error ? error.message : String(error)) });
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
      radiusMeters,
      maxSlots,
      companyType,
      workingDays
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

    // Set default working days based on company type
    let defaultWorkingDays: string[];
    if (companyType === 'PRIVATE') {
      defaultWorkingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    } else {
      defaultWorkingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    }

    // Use provided workingDays or default based on company type
    const finalWorkingDays = workingDays && Array.isArray(workingDays) && workingDays.length > 0
      ? workingDays
      : defaultWorkingDays;

    // Validate working days
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const invalidDays = finalWorkingDays.filter(day => !validDays.includes(day));
    if (invalidDays.length > 0) {
      return res.status(400).json({
        message: `Invalid working days: ${invalidDays.join(', ')}. Valid days are: ${validDays.join(', ')}`
      });
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
        radiusMeters: radiusMeters ? parseInt(radiusMeters) : 100,
        maxSlots: maxSlots ? parseInt(maxSlots) : undefined,
        companyType: (companyType === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC') as any,
        workingDays: finalWorkingDays,
      } as any,
      include: {
        students: true,
        supervisor: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
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
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ message: 'Failed to create company', error: (error instanceof Error ? error.message : String(error)) });
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
      radiusMeters,
      maxSlots,
      companyType,
      workingDays
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

    // Prepare update data
    const updateData: any = {
      name,
      address,
      contactPerson,
      contactEmail,
      contactNumber,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      radiusMeters: radiusMeters ? parseInt(radiusMeters) : 100,
      maxSlots: typeof maxSlots === 'number' ? maxSlots : maxSlots ? parseInt(maxSlots) : existingCompany.maxSlots,
    };

    // Update company type if provided
    if (companyType !== undefined) {
      updateData.companyType = companyType === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC';
    }

    // Update working days if provided
    if (workingDays !== undefined && Array.isArray(workingDays)) {
      // Validate working days
      const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const invalidDays = workingDays.filter(day => !validDays.includes(day));
      if (invalidDays.length > 0) {
        return res.status(400).json({
          message: `Invalid working days: ${invalidDays.join(', ')}. Valid days are: ${validDays.join(', ')}`
        });
      }
      if (workingDays.length === 0) {
        return res.status(400).json({
          message: 'At least one working day must be selected'
        });
      }
      updateData.workingDays = workingDays;
    }

    const company = await prisma.company.update({
      where: { id },
      data: updateData,
      include: {
        students: true,
        supervisor: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
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
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ message: 'Failed to update company', error: (error instanceof Error ? error.message : String(error)) });
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
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ message: 'Failed to delete company', error: (error instanceof Error ? error.message : String(error)) });
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
  } catch (error) {
    console.error('Error fetching MOAs:', error);
    res.status(500).json({ message: 'Failed to fetch MOAs', error: (error instanceof Error ? error.message : String(error)) });
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
  } catch (error) {
    console.error('Error fetching MOA:', error);
    res.status(500).json({ message: 'Failed to fetch MOA', error: (error instanceof Error ? error.message : String(error)) });
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
        status: "APPROVED",
        remarks: notes || moa.remarks,
      },
      include: {
        student: {
          include: {
            user: {
              select: { name: true, email: true },
            },
            company: {
              select: {
                id: true,
                name: true,
                contactEmail: true,
                contactPerson: true,
                supervisorId: true,
                supervisor: {
                  select: { id: true, name: true, email: true, role: true },
                },
              },
            },
          },
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const company = updatedMOA.student?.company;

    if (
      company &&
      updatedMOA.student &&
      (!updatedMOA.student.supervisorName ||
        !updatedMOA.student.supervisorName.trim()) &&
      company.contactPerson
    ) {
      await prisma.student.update({
        where: { id: updatedMOA.student.id },
        data: { supervisorName: company.contactPerson },
      });
    }

    const refreshedMOA = await prisma.document.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: {
              select: { name: true, email: true },
            },
            company: {
              select: {
                id: true,
                name: true,
                contactEmail: true,
                contactPerson: true,
                supervisorId: true,
                supervisor: {
                  select: { id: true, name: true, email: true, role: true },
                },
              },
            },
          },
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
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

    res.json({ moa: refreshedMOA, supervisorAccount: null });
  } catch (error) {
    console.error('Error approving MOA:', error);
    res.status(500).json({ message: 'Failed to approve MOA', error: (error instanceof Error ? error.message : String(error)) });
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
  } catch (error) {
    console.error('Error rejecting MOA:', error);
    res.status(500).json({ message: 'Failed to reject MOA', error: (error instanceof Error ? error.message : String(error)) });
  }
};

export const createSupervisorAccount = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await provisionSupervisorAccount(id);

    if ('error' in result) {
      return res.status(result.error.status).json({ message: result.error.message });
    }

    const { supervisorUser, created, temporaryPassword, companyName, contactPerson } = result;

    const supervisorDisplayName =
      supervisorUser.name || contactPerson || `${companyName} Supervisor`;
    const loginUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/login`;

    let emailSent = false;
    let emailMessage = "";

    try {
      if (created && temporaryPassword) {
        const subject = `INTRAK: Supervisor Account Created for ${companyName}`;

        const content = `
      <p>Hello ${supervisorDisplayName}!</p>
      <p>Your Supervisor account has been successfully created in the INTRAK OJT Management System.</p>
      
      <div class="credentials-box">
        <p><strong>Account Credentials:</strong></p>
      <p><strong>Email:</strong> ${supervisorUser.email}</p>
      <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
      <p><strong>Role:</strong> Supervisor</p>
      <p><strong>Company:</strong> ${companyName}</p>
      </div>

      <p><strong>Important:</strong> This is a temporary password that you must change on your first login for security purposes.</p>
      
      <a href="${loginUrl}" class="login-button">Login to INTRAK</a>
      
      <p class="note">If the button above does not work, copy and paste this link into your browser:<br>
      <span style="word-break: break-all;">${loginUrl}</span></p>
      
      <p>If you have any questions or need assistance, please contact your system administrator.</p>
      
      <p><br><strong>– INTRAK System</strong></p>
    `;

        const html = emailService.generateEmailTemplate(
          content,
          'Welcome to INTRAK',
          'https://img.icons8.com/ios-filled/50/ffffff/user-male-circle.png'
        );
        const text = `Supervisor Account Created

Your supervisor account for ${companyName} has been created.

ACCOUNT CREDENTIALS
Email: ${supervisorUser.email}
Temporary Password: ${temporaryPassword}

Login here: ${loginUrl}

Please change this password immediately after your first login. If you did not expect this account, contact the coordinator.
`;

        const emailResult = await emailService.sendEmail({
          to: supervisorUser.email,
          subject,
          html,
          text,
        });
        emailSent = emailResult.success;
        emailMessage = emailSent
          ? `Supervisor account created and credentials sent to ${supervisorUser.email}.`
          : `Supervisor account created, but failed to send credentials email to ${supervisorUser.email}. ${emailResult.error || ''}`;
      } else {
        const subject = `INTRAK: Supervisor Account Linked to ${companyName}`;

        const content = `
      <p>Hello ${supervisorDisplayName}!</p>
      <p>Your email <strong>${supervisorUser.email}</strong> is now linked as the official supervisor for <strong>${companyName}</strong> in the INTRAK system.</p>
      ${temporaryPassword
            ? `<div class="credentials-box">
              <p><strong>Account Credentials:</strong></p>
              <p><strong>Email:</strong> ${supervisorUser.email}</p>
              <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
              <p><strong>Role:</strong> Supervisor</p>
              <p><strong>Company:</strong> ${companyName}</p>
            </div>
            <p><strong>Important:</strong> This is a temporary password that you must change on your first login for security purposes.</p>`
            : `<p>You can sign in using your existing INTRAK credentials.</p>`
          }
      
      <a href="${loginUrl}" class="login-button">Login to INTRAK</a>
      
      <p class="note">If the button above does not work, copy and paste this link into your browser:<br>
      <span style="word-break: break-all;">${loginUrl}</span></p>
      
      <p>If you did not expect this change, please contact the coordinator immediately.</p>
      
      <p><br><strong>– INTRAK System</strong></p>
    `;

        const html = emailService.generateEmailTemplate(
          content,
          'Supervisor Account Linked',
          'https://img.icons8.com/ios-filled/50/ffffff/user-male-circle.png'
        );
        const text = `Supervisor Account Linked
 
 Your email ${supervisorUser.email} is now linked as the supervisor for ${companyName}.
 ${temporaryPassword
            ? `Sign in using the temporary password below (change it immediately after logging in).

Temporary Password: ${temporaryPassword}

`
            : ''
          }Sign in${temporaryPassword ? ' at' : ' with your existing credentials at'} ${loginUrl}.
 
 This is an automated message. Please do not reply to this email.`;

        const emailResult = await emailService.sendEmail({
          to: supervisorUser.email,
          subject,
          html,
          text,
        });
        emailSent = emailResult.success;
        emailMessage = emailSent
          ? `Supervisor account linked and credentials sent to ${supervisorUser.email}.`
          : `Supervisor account linked, but failed to send credential email to ${supervisorUser.email}. ${emailResult.error || ''}`;
      }
    } catch (emailError) {
      console.error("Error sending supervisor account email:", emailError);
      emailSent = false;
      emailMessage = `Supervisor account processed, but sending email to ${supervisorUser.email} failed.`;
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || 'system',
        action: created ? 'CREATE_SUPERVISOR_ACCOUNT' : 'LINK_SUPERVISOR_ACCOUNT',
        meta: {
          companyId: id,
          supervisorEmail: supervisorUser.email,
          emailSent,
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || 'Unknown',
      },
    });

    res.json({
      created,
      supervisor: {
        id: supervisorUser.id,
        name: supervisorUser.name,
        email: supervisorUser.email,
      },
      temporaryPassword,
      emailSent,
      emailMessage,
    });
  } catch (error) {
    console.error('Error creating supervisor account:', error);
    res.status(500).json({
      message: 'Failed to create supervisor account',
      error: (error instanceof Error ? error.message : String(error)),
    });
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
  } catch (error) {
    console.error('Error fetching MOA stats:', error);
    res.status(500).json({ message: 'Failed to fetch MOA statistics', error: (error instanceof Error ? error.message : String(error)) });
  }
};