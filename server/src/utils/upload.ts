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
      // Create a general documents directory since we can't access studentId here
      const dir = path.join(uploadPath, 'documents', 'temp');
      
      await ensureNASDirectoryExists(dir);
      cb(null, dir);
    } catch (error) {
      console.error('Upload destination error:', error);
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