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
  
  if (nasConfig.enabled) {
    // Check if NAS is mounted and accessible
    if (!fs.existsSync(nasConfig.mountPath)) {
      throw new Error(`NAS mount point not accessible: ${nasConfig.mountPath}`);
    }
    
    // Create directory structure if it doesn't exist
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  } else {
    // Local storage fallback
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
};

export const getStoragePath = (): string => {
  const nasConfig = getNASConfig();
  
  return nasConfig.enabled 
    ? nasConfig.mountPath 
    : process.env.UPLOAD_PATH || './uploads';
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
