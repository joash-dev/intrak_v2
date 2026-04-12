import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getStoragePathWithFallback, invalidateNASCache } from '../config/nas';

const NAS_IO_ERRORS = ['EHOSTDOWN', 'EIO', 'ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENETUNREACH'];

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const { storagePath, isUsingFallback } = getStoragePathWithFallback();
      const dir = path.join(storagePath, 'documents', 'temp');
      await fs.promises.mkdir(dir, { recursive: true });
      cb(null, dir);

      if (isUsingFallback) {
        console.warn('[Upload] Using local fallback for temp upload directory');
      }
    } catch (error) {
      const code = (error as NodeJS.ErrnoException)?.code;
      if (code && NAS_IO_ERRORS.includes(code)) {
        console.warn(`[Upload] NAS write failed (${code}), retrying with local storage`);
        invalidateNASCache();
        try {
          const localDir = path.join(process.env.UPLOAD_PATH || './uploads', 'documents', 'temp');
          await fs.promises.mkdir(localDir, { recursive: true });
          cb(null, localDir);
          return;
        } catch (localErr) {
          console.error('[Upload] Local fallback also failed:', localErr);
          cb(localErr as Error, '');
          return;
        }
      }
      console.error('[Upload] Destination error:', error);
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