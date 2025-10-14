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

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Use a transaction to handle related data deletion
    await prisma.$transaction(async (tx) => {
      // Delete audit logs first (since they don't have cascade delete)
      await tx.auditLog.deleteMany({
        where: { userId: id }
      });

      // Delete the user (this will cascade delete RefreshToken and Student records)
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
        message: 'Cannot delete user. User has related data that must be handled first.' 
      });
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(500).json({ 
      message: 'Failed to delete user', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
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

    console.log(`📸 Profile photo request: ${filename}`);

    // Validate filename format (should be userId_timestamp.extension)
    if (!filename || !filename.includes('_')) {
      console.log(`📸 Invalid filename format: ${filename}`);
      return res.status(404).json({ message: 'Invalid profile photo filename' });
    }

    const filepath = path.join(process.cwd(), 'uploads', 'profile-photos', filename);
    console.log(`📸 Looking for file at: ${filepath}`);
    
    if (!fs.existsSync(filepath)) {
      console.log(`📸 File does not exist at: ${filepath}`);
      return res.status(404).json({ message: 'Profile photo file not found' });
    }

    console.log(`📸 Serving profile photo: ${filename}`);
    
    // Add CORS headers for image serving
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Set appropriate content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    res.header('Content-Type', mimeTypes[ext] || 'image/jpeg');
    
    res.sendFile(filepath);
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