import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { auditLog } from '../services/audit.service';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

export const uploadTemplate = async (req: AuthRequest, res: Response) => {
  try {
    console.log(`📄 Template upload request from user: ${req.user?.id}, role: ${req.user?.role}`);
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { name, description, type } = req.body;
    console.log(`📄 Template upload data: name=${name}, type=${type}`);

    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({ 
        message: 'Template name and type are required' 
      });
    }

    // Check if template with same name and type already exists
    const existingTemplate = await prisma.documentTemplate.findFirst({
      where: {
        name: name.trim(),
        type: type,
        isActive: true
      }
    });

    if (existingTemplate) {
      return res.status(409).json({ 
        message: 'A template with this name and type already exists' 
      });
    }

    // Create templates directory if it doesn't exist
    const templatesDir = path.join(process.cwd(), 'uploads', 'templates');
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }

    // Generate unique filename to avoid conflicts
    const timestamp = Date.now();
    const fileExtension = path.extname(req.file.originalname);
    const uniqueFilename = `${timestamp}_${req.file.originalname}`;
    const filepath = path.join(templatesDir, uniqueFilename);

    // Move file from temp location to templates directory
    fs.renameSync(req.file.path, filepath);

    const template = await prisma.documentTemplate.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        type,
        filename: req.file.originalname,
        filepath: filepath,
        mimeType: req.file.mimetype,
        uploadedById: req.user!.id
      },
      include: {
        uploadedBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    await auditLog(req.user!.id, 'TEMPLATE_UPLOADED', {
      templateId: template.id,
      name: template.name,
      type: template.type,
      filename: req.file.originalname
    }, req);

    console.log(`✅ Template uploaded successfully: ${template.name} (${template.id})`);
    console.log(`📁 File stored at: ${filepath}`);

    res.status(201).json({ 
      message: 'Template uploaded successfully',
      template: {
        ...template,
        fileSizeMB: req.file.size ? (req.file.size / (1024 * 1024)).toFixed(2) + ' MB' : null
      }
    });
  } catch (error) {
    console.error('Template upload error:', error);
    res.status(500).json({ 
      message: 'Template upload failed', 
      error: process.env.NODE_ENV === 'development' ? error : undefined 
    });
  }
};

export const getTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const { type, active } = req.query;

    const where: any = {};
    
    if (type) where.type = type;
    if (active !== undefined) where.isActive = active === 'true';

    const templates = await prisma.documentTemplate.findMany({
      where,
      include: {
        uploadedBy: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format templates with file size info
    const formattedTemplates = templates.map(template => ({
      ...template,
      fileSizeMB: template.filepath ? 'Available' : null
    }));

    res.json({ templates: formattedTemplates });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch templates', 
      error: process.env.NODE_ENV === 'development' ? error : undefined 
    });
  }
};

export const getTemplateById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const template = await prisma.documentTemplate.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.json({ template });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch template', 
      error: process.env.NODE_ENV === 'development' ? error : undefined 
    });
  }
};

export const downloadTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const template = await prisma.documentTemplate.findUnique({
      where: { id }
    });

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    if (!template.isActive) {
      return res.status(403).json({ message: 'Template is no longer available' });
    }

    const filepath = path.resolve(template.filepath);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ message: 'Template file not found' });
    }

    // Log template download
    await auditLog(req.user!.id, 'TEMPLATE_DOWNLOADED', {
      templateId: id,
      templateName: template.name,
      templateType: template.type
    }, req);

    res.download(filepath, template.filename);
  } catch (error) {
    console.error('Template download error:', error);
    res.status(500).json({ 
      message: 'Template download failed', 
      error: process.env.NODE_ENV === 'development' ? error : undefined 
    });
  }
};

export const updateTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    // Check if template exists
    const existingTemplate = await prisma.documentTemplate.findUnique({
      where: { id }
    });

    if (!existingTemplate) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Check if user has permission to update (instructor or admin)
    if (req.user!.role !== 'ADMIN' && existingTemplate.uploadedById !== req.user!.id) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    const template = await prisma.documentTemplate.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isActive !== undefined && { isActive })
      },
      include: {
        uploadedBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    await auditLog(req.user!.id, 'TEMPLATE_UPDATED', {
      templateId: id,
      changes: { name, description, isActive }
    }, req);

    res.json({ 
      message: 'Template updated successfully',
      template 
    });
  } catch (error) {
    console.error('Template update error:', error);
    res.status(500).json({ 
      message: 'Template update failed', 
      error: process.env.NODE_ENV === 'development' ? error : undefined 
    });
  }
};

export const deleteTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if template exists
    const template = await prisma.documentTemplate.findUnique({
      where: { id }
    });

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Check if user has permission to delete (admin or template uploader)
    if (req.user!.role !== 'ADMIN' && template.uploadedById !== req.user!.id) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    // Delete file from filesystem
    if (fs.existsSync(template.filepath)) {
      fs.unlinkSync(template.filepath);
    }

    await prisma.documentTemplate.delete({ where: { id } });

    await auditLog(req.user!.id, 'TEMPLATE_DELETED', {
      templateId: id,
      templateName: template.name,
      templateType: template.type
    }, req);

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Template deletion error:', error);
    res.status(500).json({ 
      message: 'Failed to delete template', 
      error: process.env.NODE_ENV === 'development' ? error : undefined 
    });
  }
};
