import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';
import { auditLog } from '../services/audit.service';

const prisma = new PrismaClient();

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;

    const where: any = {};
    if (role) where.role = role;
    if (search) {
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
          createdAt: true
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
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
        student: true
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
    const { name, email, password, active } = req.body;

    if (req.user!.role !== 'ADMIN' && req.user!.id !== id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const data: any = {};
    if (name) data.name = name;
    if (email) data.email = email;
    if (password) data.passwordHash = await bcrypt.hash(password, 12);
    if (active !== undefined && req.user!.role === 'ADMIN') data.active = active;

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true
      }
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
      select: { passwordHash: true, email: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ 
        message: 'Current password is incorrect. Please enter your current password correctly.' 
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
  } catch (error: any) {
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
      select: { id: true, name: true, email: true, role: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

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

      // 3. Delete documents uploaded by this user
      await tx.document.deleteMany({
        where: { uploadedBy: id }
      });

      // 4. Delete evaluations given by this user
      await tx.evaluation.deleteMany({
        where: { evaluatorId: id }
      });

      // 5. Delete announcements created by this user
      await tx.announcement.deleteMany({
        where: { createdBy: id }
      });

      // 6. Delete document templates uploaded by this user
      await tx.documentTemplate.deleteMany({
        where: { uploadedBy: id }
      });

      // 7. Delete admin settings if user is admin
      await tx.adminSettings.deleteMany({
        where: { userId: id }
      });

      // 8. For students, unassign them from this instructor
      if (user.role === 'INSTRUCTOR') {
        await tx.student.updateMany({
          where: { instructorId: id },
          data: { instructorId: null }
        });
      }

      // 9. Delete the user (this will cascade delete Student record if user is a student)
      await tx.user.delete({
        where: { id }
      });
    });

    // Log the deletion
    await auditLog(req.user!.id, 'USER_DELETED', { 
      deletedUserId: id, 
      deletedUserName: user.name,
      deletedUserEmail: user.email 
    }, req);

    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Delete user error:', error);
    
    // Handle specific database errors
    if (error.code === 'P2003') {
      return res.status(400).json({ 
        message: 'Cannot delete user. User has related data that must be handled first. Please contact support for assistance.' 
      });
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found. The user may have already been deleted.' });
    }

    if (error.code === 'P2002') {
      return res.status(400).json({ 
        message: 'Cannot delete user due to unique constraint violation. Please contact support.' 
      });
    }

    // Provide more detailed error message in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Failed to delete user: ${error.message}` 
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

    // Create profile photos directory if it doesn't exist
    const photosDir = path.join(process.cwd(), 'uploads', 'profile-photos');
    if (!fs.existsSync(photosDir)) {
      fs.mkdirSync(photosDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = path.extname(req.file.originalname);
    const filename = `${userId}_${timestamp}${fileExtension}`;
    const filepath = path.join(photosDir, filename);

    // Move file from temp location to profile photos directory
    fs.renameSync(req.file.path, filepath);

    // Delete old profile photo if it exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    }) as any;

    if (user?.profilePhoto) {
      const oldFilePath = path.join(process.cwd(), 'uploads', 'profile-photos', user.profilePhoto);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Update user profile photo in database
    await prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: filename } as any
    });

    res.json({ 
      message: 'Profile photo uploaded successfully',
      profilePhoto: `/api/users/profile-photo/${filename}`
    });
  } catch (error) {
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

    // Return the full URL path for the profile photo
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.BASE_URL || 'http://localhost:5000'
      : 'http://localhost:5000';
    
    res.json({ 
      profilePhoto: `${baseUrl}/api/users/profile-photo/${user.profilePhoto}`
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

    // Basic validation
    if (typeof filename !== 'string' || filename.length === 0) {
      return res.status(404).json({ message: 'Invalid profile photo filename' });
    }

    // Enforce strict filename pattern: userId_timestamp.ext
    const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
    const sanitized = path.basename(filename);
    const ext = path.extname(sanitized).toLowerCase();

    // Reject if path traversal is attempted or extension is not allowed
    if (sanitized !== filename || !allowedExtensions.has(ext)) {
      return res.status(404).json({ message: 'Invalid profile photo filename' });
    }

    // Validate structural pattern (e.g., uuid-or-id + '_' + timestamp)
    const nameWithoutExt = sanitized.slice(0, -ext.length);
    const validPattern = /^[A-Za-z0-9-]+_\d+$/; // id_like + '_' + digits
    if (!validPattern.test(nameWithoutExt)) {
      return res.status(404).json({ message: 'Invalid profile photo filename' });
    }

    const photosDir = path.join(process.cwd(), 'uploads', 'profile-photos');
    const baseDir = path.resolve(photosDir);
    const absolutePath = path.resolve(photosDir, sanitized);

    // Ensure the resolved path stays within the base directory
    if (!(absolutePath === baseDir || absolutePath.startsWith(baseDir + path.sep))) {
      return res.status(404).json({ message: 'Invalid profile photo filename' });
    }

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: 'Profile photo file not found' });
    }

    // Add CORS headers for image serving
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');

    // Set appropriate content type based on file extension
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    res.header('Content-Type', mimeTypes[ext] || 'image/jpeg');

    res.sendFile(absolutePath);
  } catch (error) {
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
      const filepath = path.join(process.cwd(), 'uploads', 'profile-photos', user.profilePhoto);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }

    // Remove profile photo from database
    await prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: null } as any
    });

    res.json({ message: 'Profile photo removed successfully' });
  } catch (error) {
    console.error('Remove profile photo error:', error);
    res.status(500).json({ 
      message: 'Failed to remove profile photo', 
      error: process.env.NODE_ENV === 'development' ? error : undefined 
    });
  }
};