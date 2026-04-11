import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';
import { auditLog } from '../services/audit.service';
import { logActivity } from './activity.controller';
import { prisma } from '../config/database';
import { getStoragePath, getStoragePathWithFallback, ensureNASDirectoryExists, resolveFilePath, getNASConfig, invalidateNASCache } from '../config/nas';

const NAS_IO_ERRORS = ['EHOSTDOWN', 'EIO', 'ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENETUNREACH'];
import { deleteStudentAccountWithNASPurge } from '../services/studentDeletion.service';

/** Strip non-digits; preserve optional leading + (e.g. +639…). */
function normalizePhoneForStorage(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const trimmed = phone.trimStart();
  if (trimmed.startsWith('+') && digits.length > 0) {
    return `+${digits}`;
  }
  return digits;
}

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { role, search, page = 1, limit = 20, email, active } = req.query;

    const where: any = {};
    if (role) where.role = role;
    if (active === 'true') where.active = true;
    if (active === 'false') where.active = false;
    if (email) {
      // Direct email lookup for validation purposes
      where.email = email;
    } else if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          active: true,
          phone: true,
          profilePhoto: true,
          createdAt: true,
          _count: {
            select: {
              studentsAssigned: true,
            },
          },
          // Include student relation for student users
          student: {
            select: {
              id: true,  // Student record ID (needed for instructor assignment)
              studentNumber: true,
              program: true,
              year: true,
              company: {
                select: {
                  name: true
                }
              }
            }
          },
          companiesSupervised: {
            select: {
              id: true,
              name: true,
              contactNumber: true
            },
            take: 1
          }
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error });
  }
};

export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        phone: true,
        emergencyContact: true,
        emergencyName: true,
        student: true,
        companiesSupervised: {
          select: {
            id: true,
            name: true,
            contactNumber: true
          },
          take: 1
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user', error });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, password, active, phone, company, emergencyContact, emergencyName } = req.body;

    if (req.user!.role !== 'ADMIN' && req.user!.id !== id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: {
        role: true,
        companiesSupervised: {
          select: { id: true },
          take: 1
        }
      }
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const data: any = {};
    if (name) data.name = name;
    // Only administrators may change email; other roles use settings UI without email edits.
    if (email && req.user!.role === 'ADMIN') {
      data.email = email;
    }
    if (password) data.passwordHash = await bcrypt.hash(password, 12);
    if (active !== undefined && req.user!.role === 'ADMIN') data.active = active;
    // Allow users to update their own phone number; keep admin ability too.
    if (phone !== undefined && (req.user!.role === 'ADMIN' || req.user!.id === id)) {
      data.phone = typeof phone === 'string' ? normalizePhoneForStorage(phone) : phone;
    }
    // Allow users to update their own emergency fields; keep admin ability too.
    if (emergencyContact !== undefined && (req.user!.role === 'ADMIN' || req.user!.id === id)) {
      data.emergencyContact = emergencyContact;
    }
    if (emergencyName !== undefined && (req.user!.role === 'ADMIN' || req.user!.id === id)) {
      data.emergencyName = emergencyName;
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        phone: true,
        emergencyContact: true,
        emergencyName: true,
      }
    });

    // Admin can update the linked company name/contact number for industry partners.
    if (
      req.user!.role === 'ADMIN' &&
      existingUser.role === 'INDUSTRY_PARTNER' &&
      (company !== undefined || phone !== undefined)
    ) {
      const targetCompany = existingUser.companiesSupervised[0];
      if (targetCompany) {
        const companyData: any = {};
        if (typeof company === 'string' && company.trim()) {
          companyData.name = company.trim();
        }
        if (phone !== undefined && typeof phone === 'string') {
          companyData.contactNumber = normalizePhoneForStorage(phone);
        }

        if (Object.keys(companyData).length > 0) {
          await prisma.company.update({
            where: { id: targetCompany.id },
            data: companyData
          });
        }
      }
    }

    // Log activity
    await logActivity({
      type: 'USER_UPDATED',
      description: `User profile updated: ${user.name} (${user.role})`,
      userId: req.user!.id,
      userName: req.user!.name,
      ipAddress: req.ip
    });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user', error });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.id;

    // Validate input
    if (!currentPassword) {
      return res.status(400).json({ message: 'Current password is required' });
    }

    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: 'New password must be at least 8 characters long'
      });
    }

    // Get user with current password hash
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, email: true, emailVerified: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        message: 'Verify your email before changing your password. Use Email verification below or resend the link from your account settings.'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        message: 'Current password is incorrect. Please enter your current password correctly.'
      });
    }

    const isSameAsCurrent = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSameAsCurrent) {
      return res.status(400).json({
        message: 'New password must be different from your current password.'
      });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash }
    });

    // Log the password change
    await auditLog(userId, 'PASSWORD_CHANGED', {
      userId: userId,
      userEmail: user.email
    }, req);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      message: 'Failed to change password. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, profilePhoto: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const studentRecord = await prisma.student.findUnique({
      where: { userId: id },
      select: { id: true },
    });

    // Student accounts use orchestrated NAS-aware deletion flow.
    if (studentRecord) {
      const outcome = await deleteStudentAccountWithNASPurge(studentRecord.id);
      await auditLog(req.user!.id, 'USER_DELETED', {
        deletedUserId: id,
        deletedUserName: user.name,
        deletedUserEmail: user.email,
        deletedRole: user.role,
        deleted: outcome.deleted,
        files: outcome.files,
      }, req);
      await logActivity({
        type: 'USER_DELETED',
        description: `User account deleted: ${user.name} (${user.role})`,
        userId: req.user!.id,
        userName: req.user!.name,
        metadata: {
          deletedUserId: id,
          files: outcome.files,
        },
        ipAddress: req.ip
      });
      return res.json({
        message: 'User deleted successfully',
        deleted: outcome.deleted,
        files: outcome.files,
      });
    }

    // Prevent admin from deleting their own account
    if (req.user?.id === id) {
      return res.status(403).json({ message: 'You cannot delete your own account' });
    }

    // Get all documents and templates uploaded by this user to delete files
    const [userDocuments, userTemplates] = await Promise.all([
      prisma.document.findMany({
        where: { uploadedById: id },
        select: { filepath: true }
      }),
      prisma.documentTemplate.findMany({
        where: { uploadedById: id },
        select: { filepath: true }
      })
    ]);

    // Use a transaction to handle related data deletion
    await prisma.$transaction(async (tx) => {
      // Delete related data in the correct order to avoid foreign key constraints

      // 1. Delete audit logs
      await tx.auditLog.deleteMany({
        where: { userId: id }
      });

      // 2. Delete refresh tokens
      await tx.refreshToken.deleteMany({
        where: { userId: id }
      });

      // 3. Delete notifications (cascade delete, but explicit for clarity)
      await tx.notification.deleteMany({
        where: { userId: id }
      });

      // 4. Delete activity logs
      await tx.activity.deleteMany({
        where: { userId: id }
      });

      // 5. Delete supervisor feedbacks given by this user
      await tx.supervisorFeedback.deleteMany({
        where: { supervisorId: id }
      });

      // 6. Delete agency self evaluations by this user
      await tx.agencySelfEvaluation.deleteMany({
        where: { supervisorId: id }
      });

      // 7. Delete document feedback authored by this user (cascade delete, but explicit for clarity)
      await tx.documentFeedback.deleteMany({
        where: { authorId: id }
      });

      // 8. Delete partnership messages sent by this user (cascade delete, but explicit for clarity)
      await tx.partnershipMessage.deleteMany({
        where: { senderId: id }
      });

      // 9. Delete documents uploaded by this user
      await tx.document.deleteMany({
        where: { uploadedById: id }
      });

      // 10. Delete evaluations given by this user
      await tx.evaluation.deleteMany({
        where: { evaluatorId: id }
      });

      // 11. Delete announcements created by this user
      await tx.announcement.deleteMany({
        where: { createdById: id }
      });

      // 12. Delete document templates uploaded by this user
      await tx.documentTemplate.deleteMany({
        where: { uploadedById: id }
      });

      // 13. Delete admin settings if user is admin
      await tx.adminSettings.deleteMany({
        where: { userId: id }
      });

      // 14. Delete coordinator settings if user is coordinator
      await tx.coordinatorSettings.deleteMany({
        where: { userId: id }
      });

      // 15. Null out reviewedBy in company applications
      await tx.companyApplication.updateMany({
        where: { reviewedBy: id },
        data: { reviewedBy: null }
      });

      // 16. Null out supervisorId in companies
      await tx.company.updateMany({
        where: { supervisorId: id },
        data: { supervisorId: null }
      });

      // 17. Unassign students from this instructor
      await tx.student.updateMany({
        where: { instructorId: id },
        data: { instructorId: null }
      });

      // 18. Delete the user (this will cascade delete Student record if user is a student)
      await tx.user.delete({
        where: { id }
      });
    });

    // Delete physical files after database transaction
    try {
      // Delete uploaded documents
      for (const doc of userDocuments) {
        if (doc.filepath) {
          const fullPath = path.join(process.cwd(), doc.filepath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        }
      }

      // Delete document template files
      for (const template of userTemplates) {
        if (template.filepath) {
          const fullPath = path.join(process.cwd(), template.filepath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        }
      }

      // Delete profile photo if exists
      if (user.profilePhoto) {
        const photoPath = path.join(process.cwd(), 'uploads', 'profile-photos', user.profilePhoto);
        if (fs.existsSync(photoPath)) {
          fs.unlinkSync(photoPath);
        }
      }
    } catch (fileError) {
      // Log file deletion errors but don't fail the request
      console.error('Error deleting user files:', fileError);
    }

    // Log the deletion
    await auditLog(req.user!.id, 'USER_DELETED', {
      deletedUserId: id,
      deletedUserName: user.name,
      deletedUserEmail: user.email
    }, req);

    // Log activity
    await logActivity({
      type: 'USER_DELETED',
      description: `User account deleted: ${user.name} (${user.role})`,
      userId: req.user!.id,
      userName: req.user!.name,
      ipAddress: req.ip
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);

    // Handle specific database errors
    const errorCode = (error as any)?.code;
    if (errorCode === 'P2003') {
      return res.status(400).json({
        message: 'Cannot delete user. User has related data that must be handled first. Please contact support for assistance.'
      });
    }

    if (errorCode === 'P2025') {
      return res.status(404).json({ message: 'User not found. The user may have already been deleted.' });
    }

    if (errorCode === 'P2002') {
      return res.status(400).json({
        message: 'Cannot delete user due to unique constraint violation. Please contact support.'
      });
    }

    // Provide more detailed error message in development
    const errorMessage = process.env.NODE_ENV === 'development'
      ? `Failed to delete user: ${(error instanceof Error ? error.message : String(error))}`
      : 'Failed to delete user. Please try again or contact support.';

    res.status(500).json({
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Upload profile photo
export const uploadProfilePhoto = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const userId = req.user!.id;

    const { storagePath, isUsingFallback } = getStoragePathWithFallback();
    let photosDir = path.join(storagePath, 'profile-photos');
    await ensureNASDirectoryExists(photosDir);

    const timestamp = Date.now();
    const fileExtension = path.extname(req.file.originalname);
    const filename = `${userId}_${timestamp}${fileExtension}`;
    let filepath = path.join(photosDir, filename);

    try {
      fs.copyFileSync(req.file.path, filepath);
      fs.unlinkSync(req.file.path);
    } catch (moveError: any) {
      // If the NAS write failed, retry to local storage
      if (NAS_IO_ERRORS.includes(moveError?.code) && !isUsingFallback) {
        invalidateNASCache();
        const localDir = path.join(process.env.UPLOAD_PATH || './uploads', 'profile-photos');
        await fs.promises.mkdir(localDir, { recursive: true });
        filepath = path.join(localDir, filename);
        try {
          fs.copyFileSync(req.file.path, filepath);
          fs.unlinkSync(req.file.path);
        } catch (retryError) {
          console.error('Error moving profile photo (local retry):', retryError);
          if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
          throw new Error('Failed to save profile photo');
        }
      } else {
        console.error('Error moving profile photo:', moveError);
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
        throw new Error('Failed to save profile photo');
      }
    }

    // Delete old profile photo from both NAS and local to avoid orphans
    const user = await prisma.user.findUnique({
      where: { id: userId }
    }) as any;

    if (user?.profilePhoto) {
      const nasDir = path.join(getNASConfig().mountPath, 'profile-photos');
      const localDir = path.join(process.env.UPLOAD_PATH || './uploads', 'profile-photos');
      for (const dir of [nasDir, localDir]) {
        try { await fs.promises.unlink(path.join(dir, user.profilePhoto)); } catch {}
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: filename } as any
    });

    res.json({
      message: 'Profile photo uploaded successfully',
      profilePhoto: `/api/users/profile-photo/${filename}`
    });
  } catch (error: any) {
    if (NAS_IO_ERRORS.includes(error?.code)) invalidateNASCache();
    console.error('Profile photo upload error:', error);
    res.status(500).json({
      message: 'Profile photo upload failed',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get current user's profile photo info
export const getCurrentUserProfilePhoto = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    }) as any;

    if (!user?.profilePhoto) {
      return res.json({ profilePhoto: null });
    }

    // Return relative URL path for the profile photo
    res.json({
      profilePhoto: `/api/users/profile-photo/${user.profilePhoto}`
    });
  } catch (error) {
    console.error('Get current user profile photo error:', error);
    res.status(500).json({
      message: 'Failed to get profile photo',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get profile photo file by filename (public endpoint - no auth required)
export const getProfilePhoto = async (req: any, res: Response) => {
  try {
    const { filename } = req.params;

    console.log(`📸 Profile photo request: ${filename}`);

    // Validate filename format (should be userId_timestamp.extension)
    if (!filename || !filename.includes('_')) {
      console.log(`📸 Invalid filename format: ${filename}`);
      return res.status(404).json({ message: 'Invalid profile photo filename' });
    }

    const candidatePath = path.join(getStoragePath(), 'profile-photos', filename);
    const resolved = resolveFilePath(candidatePath);

    if (!resolved) {
      console.log(`📸 File not found (NAS + local): ${candidatePath}`);
      return res.status(404).json({ message: 'Profile photo file not found' });
    }

    console.log(`📸 Serving profile photo: ${resolved}`);

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');

    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    res.header('Content-Type', mimeTypes[ext] || 'image/jpeg');

    res.sendFile(resolved);
  } catch (error: any) {
    if (NAS_IO_ERRORS.includes(error?.code)) invalidateNASCache();
    console.error('Get profile photo error:', error);
    res.status(500).json({
      message: 'Failed to get profile photo',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Remove profile photo
export const removeProfilePhoto = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    }) as any;

    if (user?.profilePhoto) {
      const nasDir = path.join(getNASConfig().mountPath, 'profile-photos');
      const localDir = path.join(process.env.UPLOAD_PATH || './uploads', 'profile-photos');
      for (const dir of [nasDir, localDir]) {
        try { await fs.promises.unlink(path.join(dir, user.profilePhoto)); } catch {}
      }
    }

    // Remove profile photo from database
    await prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: null } as any
    });

    res.json({ message: 'Profile photo removed successfully' });
  } catch (error: any) {
    if (NAS_IO_ERRORS.includes(error?.code)) invalidateNASCache();
    console.error('Remove profile photo error:', error);
    res.status(500).json({
      message: 'Failed to remove profile photo',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get last login info for the current user
export const getLastLoginInfo = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        lastLoginAt: true,
        lastLoginIp: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      lastLoginAt: user.lastLoginAt,
      lastLoginIp: user.lastLoginIp
    });
  } catch (error) {
    console.error('Get last login info error:', error);
    res.status(500).json({
      message: 'Failed to get last login info',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};