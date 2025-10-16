import { Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';

// File type validation
export const validateFileType = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next();
  }

  const allowedMimes = (process.env.ALLOWED_MIMETYPES || 
    'application/pdf,image/jpeg,image/png').split(',');
  
  if (!allowedMimes.includes(req.file.mimetype)) {
    // Delete the uploaded file if it's invalid
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({ 
      message: 'Invalid file type. Only PDF, JPG, and PNG files are allowed.' 
    });
  }

  next();
};

// File size validation
export const validateFileSize = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next();
  }

  const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default
  
  if (req.file.size > maxSize) {
    // Delete the uploaded file if it's too large
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({ 
      message: `File size exceeds limit. Maximum size is ${maxSize / (1024 * 1024)}MB.` 
    });
  }

  next();
};

// Scan file for malicious content (basic check)
export const scanFileContent = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next();
  }

  try {
    const fileBuffer = fs.readFileSync(req.file.path);
    const fileContent = fileBuffer.toString('utf8', 0, Math.min(1024, fileBuffer.length)); // Read first 1KB
    
    // Check for potentially malicious content
    const maliciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload/i,
      /onerror/i,
      /eval\(/i,
      /document\.cookie/i,
      /window\.location/i
    ];

    for (const pattern of maliciousPatterns) {
      if (pattern.test(fileContent)) {
        // Delete the uploaded file if malicious content is detected
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ 
          message: 'File contains potentially malicious content and cannot be uploaded.' 
        });
      }
    }

    next();
  } catch (error) {
    console.error('File content scan error:', error);
    next(); // Continue if scan fails
  }
};

// Rate limiting for file uploads
export const uploadRateLimit = multer({
  limits: {
    files: 1, // Only one file per request
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB
  },
  fileFilter: (req, file, cb: FileFilterCallback) => {
    // Additional file filter for security
    const allowedMimes = (process.env.ALLOWED_MIMETYPES || 
      'application/pdf,image/jpeg,image/png').split(',');
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      // Do not pass Error instance to avoid type issues; reject file
      cb(null, false);
    }
  }
});

// Clean up temporary files on error
export const cleanupOnError = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // If response indicates an error, clean up uploaded file
    if (res.statusCode >= 400 && req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (error) {
        console.error('Failed to cleanup file:', error);
      }
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};
