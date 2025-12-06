import fs from 'fs';
import path from 'path';

export interface NASConfig {
  enabled: boolean;
  mountPath: string;
  host: string;
  username: string;
  password: string;
  shareName: string;
}

export const getNASConfig = (): NASConfig => {
  return {
    enabled: process.env.USE_NAS === 'true',
    mountPath: process.env.NAS_PATH || '/mnt/nas/intrak/documents',
    host: process.env.NAS_HOST || '192.168.1.100',
    username: process.env.NAS_USERNAME || 'nas_user',
    password: process.env.NAS_PASSWORD || 'nas_password',
    shareName: process.env.NAS_SHARE_NAME || 'documents'
  };
};

export const ensureNASDirectoryExists = async (dirPath: string): Promise<void> => {
  const nasConfig = getNASConfig();
  
  // Try to create directory, fallback to local if NAS unavailable
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  } catch (error: any) {
    // If NAS path fails, try local fallback
    if (nasConfig.enabled && dirPath.startsWith(nasConfig.mountPath)) {
      const localPath = dirPath.replace(nasConfig.mountPath, process.env.UPLOAD_PATH || './uploads');
      console.warn(`⚠️  Failed to create NAS directory, using local fallback: ${localPath}`);
      if (!fs.existsSync(localPath)) {
        fs.mkdirSync(localPath, { recursive: true });
      }
    } else {
      throw error;
    }
  }
};

export const getStoragePath = (): string => {
  const nasConfig = getNASConfig();
  
  return nasConfig.enabled 
    ? nasConfig.mountPath 
    : process.env.UPLOAD_PATH || './uploads';
};

/**
 * Get storage path with automatic fallback to local storage if NAS is unavailable
 * @returns Object with storagePath and isUsingFallback flag
 */
export const getStoragePathWithFallback = (): { storagePath: string; isUsingFallback: boolean } => {
  const nasConfig = getNASConfig();
  const localPath = process.env.UPLOAD_PATH || './uploads';
  
  if (!nasConfig.enabled) {
    return { storagePath: localPath, isUsingFallback: false };
  }
  
  // Check if NAS is actually available
  try {
    if (fs.existsSync(nasConfig.mountPath)) {
      // Test write access
      const testFile = path.join(nasConfig.mountPath, '.test_write');
      try {
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        return { storagePath: nasConfig.mountPath, isUsingFallback: false };
      } catch (error) {
        // NAS exists but not writable, fallback to local
        console.warn('⚠️  NAS mount point exists but not writable, falling back to local storage');
        return { storagePath: localPath, isUsingFallback: true };
      }
    }
  } catch (error) {
    // NAS mount point doesn't exist or error accessing it
    console.warn('⚠️  NAS mount point not accessible, falling back to local storage');
  }
  
  // Fallback to local storage
  return { storagePath: localPath, isUsingFallback: true };
};

export const validateNASConnection = async (): Promise<boolean> => {
  const nasConfig = getNASConfig();
  
  if (!nasConfig.enabled) {
    return true; // NAS not enabled, use local storage
  }
  
  try {
    // Check if mount point exists and is writable
    if (fs.existsSync(nasConfig.mountPath)) {
      // Test write access
      const testFile = path.join(nasConfig.mountPath, '.test_write');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      return true;
    }
    return false;
  } catch (error) {
    console.error('NAS connection validation failed:', error);
    return false;
  }
};

/**
 * Resolve file path - checks both NAS and local storage
 * Useful when NAS might be disconnected but files exist in local storage
 * @param storedPath The filepath stored in database
 * @returns Resolved filepath or null if not found
 */
export const resolveFilePath = (storedPath: string): string | null => {
  const nasConfig = getNASConfig();
  const localPath = process.env.UPLOAD_PATH || './uploads';
  
  // Normalize the path
  const normalizedPath = path.normalize(storedPath);
  
  // If absolute path, check if it exists
  if (path.isAbsolute(normalizedPath)) {
    if (fs.existsSync(normalizedPath)) {
      return normalizedPath;
    }
    
    // If NAS path but file not found, try local fallback
    if (nasConfig.enabled && normalizedPath.startsWith(nasConfig.mountPath)) {
      const localFallback = normalizedPath.replace(nasConfig.mountPath, localPath);
      if (fs.existsSync(localFallback)) {
        console.warn(`⚠️  File not found on NAS, using local fallback: ${localFallback}`);
        return localFallback;
      }
    }
    
    // If local path but file not found, try NAS (in case file was moved)
    if (normalizedPath.startsWith(localPath) && nasConfig.enabled) {
      const nasFallback = normalizedPath.replace(localPath, nasConfig.mountPath);
      if (fs.existsSync(nasFallback)) {
        console.warn(`⚠️  File not found locally, found on NAS: ${nasFallback}`);
        return nasFallback;
      }
    }
  }
  
  // Try relative paths
  const possiblePaths = [
    normalizedPath,
    path.resolve(process.cwd(), normalizedPath),
    path.resolve(process.cwd(), 'server', normalizedPath),
    path.resolve(__dirname, '../../', normalizedPath),
  ];
  
  // Add NAS and local paths
  if (nasConfig.enabled) {
    possiblePaths.push(path.resolve(nasConfig.mountPath, normalizedPath));
  }
  possiblePaths.push(path.resolve(localPath, normalizedPath));
  
  // Find first existing path
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      return possiblePath;
    }
  }
  
  return null;
};

/**
 * Sync files from local storage to NAS when NAS becomes available
 * This should be called when NAS reconnects
 */
export const syncLocalToNAS = async (): Promise<{ synced: number; failed: number }> => {
  const nasConfig = getNASConfig();
  const localPath = process.env.UPLOAD_PATH || './uploads';
  
  if (!nasConfig.enabled) {
    return { synced: 0, failed: 0 };
  }
  
  // Check if NAS is available
  const nasAvailable = await validateNASConnection();
  if (!nasAvailable) {
    console.log('⏳ NAS not available, skipping sync');
    return { synced: 0, failed: 0 };
  }
  
  let synced = 0;
  let failed = 0;
  
  try {
    // Sync documents
    const syncDirectory = async (localDir: string, nasDir: string) => {
      if (!fs.existsSync(localDir)) {
        return;
      }
      
      // Ensure NAS directory exists
      if (!fs.existsSync(nasDir)) {
        fs.mkdirSync(nasDir, { recursive: true });
      }
      
      const files = fs.readdirSync(localDir, { withFileTypes: true });
      
      for (const file of files) {
        const localFilePath = path.join(localDir, file.name);
        const nasFilePath = path.join(nasDir, file.name);
        
        if (file.isDirectory()) {
          // Recursively sync subdirectories
          await syncDirectory(localFilePath, nasFilePath);
        } else if (file.isFile()) {
          // Only sync if file doesn't exist on NAS
          if (!fs.existsSync(nasFilePath)) {
            try {
              fs.copyFileSync(localFilePath, nasFilePath);
              synced++;
              console.log(`✅ Synced: ${file.name}`);
            } catch (error) {
              failed++;
              console.error(`❌ Failed to sync ${file.name}:`, error);
            }
          }
        }
      }
    };
    
    // Sync documents directory
    const localDocsDir = path.join(localPath, 'documents');
    const nasDocsDir = path.join(nasConfig.mountPath, 'documents');
    if (fs.existsSync(localDocsDir)) {
      await syncDirectory(localDocsDir, nasDocsDir);
    }
    
    // Sync templates directory
    const localTemplatesDir = path.join(localPath, 'templates');
    const nasTemplatesDir = path.join(nasConfig.mountPath, 'templates');
    if (fs.existsSync(localTemplatesDir)) {
      await syncDirectory(localTemplatesDir, nasTemplatesDir);
    }
    
    // Sync profile photos directory
    const localPhotosDir = path.join(localPath, 'profile-photos');
    const nasPhotosDir = path.join(nasConfig.mountPath, 'profile-photos');
    if (fs.existsSync(localPhotosDir)) {
      await syncDirectory(localPhotosDir, nasPhotosDir);
    }
    
    if (synced > 0) {
      console.log(`✅ Sync complete: ${synced} files synced to NAS, ${failed} failed`);
    }
  } catch (error) {
    console.error('❌ Sync error:', error);
  }
  
  return { synced, failed };
};

/**
 * Create backup copy in local storage when saving to NAS
 * This ensures files are accessible even when NAS is disconnected
 * @param nasFilePath The file path on NAS
 * @param fileContent Buffer or path to file to backup
 * @returns Local backup path or null if backup failed
 */
export const createLocalBackup = (nasFilePath: string, fileContent: string | Buffer): string | null => {
  const nasConfig = getNASConfig();
  const localPath = process.env.UPLOAD_PATH || './uploads';
  
  // Only create backup if NAS is enabled and file is on NAS
  if (!nasConfig.enabled || !nasFilePath.startsWith(nasConfig.mountPath)) {
    return null;
  }
  
  try {
    // Convert NAS path to local backup path
    const localBackupPath = nasFilePath.replace(nasConfig.mountPath, localPath);
    const localBackupDir = path.dirname(localBackupPath);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(localBackupDir)) {
      fs.mkdirSync(localBackupDir, { recursive: true });
    }
    
    // Copy file to local backup
    if (typeof fileContent === 'string') {
      // If it's a file path, copy it
      fs.copyFileSync(fileContent, localBackupPath);
    } else {
      // If it's a buffer, write it
      fs.writeFileSync(localBackupPath, fileContent);
    }
    
    return localBackupPath;
  } catch (error) {
    console.warn(`⚠️  Failed to create local backup for ${nasFilePath}:`, error);
    return null;
  }
};
