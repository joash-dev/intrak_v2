import { prisma } from '../config/database';

export interface NASRuntimeConfig {
  enabled: boolean;
  mountPath: string;
  host: string;
  username: string;
  password: string;
  shareName: string;
}

const CONFIG_KEY = 'nas_config';

const DEFAULT_NAS_CONFIG: NASRuntimeConfig = {
  enabled: process.env.USE_NAS === 'true',
  mountPath: process.env.NAS_PATH || '/mnt/nas/intrak',
  host: process.env.NAS_HOST || '',
  username: process.env.NAS_USERNAME || '',
  password: process.env.NAS_PASSWORD || '',
  shareName: process.env.NAS_SHARE_NAME || 'files',
};

const ensureRuntimeTable = async () => {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS system_runtime_config (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_by TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};

export const getNASRuntimeConfig = async (): Promise<NASRuntimeConfig> => {
  await ensureRuntimeTable();
  const rows = await prisma.$queryRawUnsafe<Array<{ value: NASRuntimeConfig }>>(
    `SELECT value FROM system_runtime_config WHERE key = $1 LIMIT 1`,
    CONFIG_KEY
  );

  if (!rows.length) {
    return DEFAULT_NAS_CONFIG;
  }

  const stored = rows[0].value;
  return {
    enabled: !!stored.enabled,
    mountPath: stored.mountPath || DEFAULT_NAS_CONFIG.mountPath,
    host: stored.host || '',
    username: stored.username || '',
    password: stored.password || '',
    shareName: stored.shareName || DEFAULT_NAS_CONFIG.shareName,
  };
};

export const saveNASRuntimeConfig = async (
  config: Partial<NASRuntimeConfig>,
  updatedBy: string
): Promise<NASRuntimeConfig> => {
  await ensureRuntimeTable();
  const current = await getNASRuntimeConfig();
  const merged: NASRuntimeConfig = {
    enabled: config.enabled ?? current.enabled,
    mountPath: config.mountPath || current.mountPath,
    host: config.host ?? current.host,
    username: config.username ?? current.username,
    // Keep existing password if empty string is sent from UI.
    password: config.password ? config.password : current.password,
    shareName: config.shareName || current.shareName,
  };

  await prisma.$executeRawUnsafe(
    `
    INSERT INTO system_runtime_config (key, value, updated_by, updated_at)
    VALUES ($1, $2::jsonb, $3, NOW())
    ON CONFLICT (key)
    DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = NOW()
    `,
    CONFIG_KEY,
    JSON.stringify(merged),
    updatedBy
  );

  return merged;
};

export const applyNASRuntimeConfigToEnv = (config: NASRuntimeConfig) => {
  process.env.USE_NAS = config.enabled ? 'true' : 'false';
  process.env.NAS_PATH = config.mountPath;
  process.env.NAS_HOST = config.host;
  process.env.NAS_USERNAME = config.username;
  process.env.NAS_PASSWORD = config.password;
  process.env.NAS_SHARE_NAME = config.shareName;
};

