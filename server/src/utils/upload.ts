import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getStoragePath, ensureNASDirectoryExists } from '../config/nas';

const uploadPath = getStoragePath();

// Ensure upload directory exists
ensureNASDirectoryExists(uploadPath).catch(console.error);

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const rawStudentId = String(req.body?.studentId ?? '').trim();

      // Validate and sanitize studentId to prevent path traversal
      const validIdPattern = /^[A-Za-z0-9_-]+$/;
      if (!rawStudentId || !validIdPattern.test(rawStudentId)) {
        return cb(new Error('Invalid studentId'), '');
      }

      const baseDir = path.join(uploadPath, 'documents');
      const targetDir = path.join(baseDir, rawStudentId);

      const resolvedBase = path.resolve(baseDir);
      const resolvedTarget = path.resolve(targetDir);

      // Ensure the target directory stays within the base directory
      if (!(resolvedTarget === resolvedBase || resolvedTarget.startsWith(resolvedBase + path.sep))) {
        return cb(new Error('Invalid upload path'), '');
      }

      await ensureNASDirectoryExists(resolvedTarget);
      cb(null, resolvedTarget);
    } catch (error) {
      cb(error as Error, '');
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedMimes = (process.env.ALLOWED_MIMETYPES || 
    'application/pdf,image/jpeg,image/png').split(',');
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
  }
});