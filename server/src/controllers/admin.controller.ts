import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import bcrypt from 'bcrypt';
import { auditLog } from '../services/audit.service';
import os from 'os';
import fs from 'fs';
import path from 'path';
import checkDiskSpace from 'check-disk-space';
import { prisma } from '../config/database';
import { getNASStorageMetrics, getLocalStorageMetrics, getAllStorageAlerts, StorageAlert } from '../services/storageMonitor.service';
import { getStoragePathWithFallback, syncLocalToNAS, validateNASConnection } from '../config/nas';
import { runIntegrityCheck } from '../services/fileIntegrity.service';
import {
  applyNASRuntimeConfigToEnv,
  getNASRuntimeConfig,
  NASRuntimeConfig,
  saveNASRuntimeConfig
} from '../services/nasRuntimeConfig.service';

// simple in-memory cache reference that can be cleared via admin actions
const globalCache = globalThis as { __appCache?: Record<string, unknown> };
if (!globalCache.__appCache) {
  globalCache.__appCache = {};
}

const DEFAULT_ADMIN_SETTINGS = {
  maintenanceMode: false,
  emailNotifications: true,
  systemAlerts: true,
  autoBackup: true,
  sessionTimeout: 30,
  maxLoginAttempts: 5,
  emailSystemAlerts: true,
  emailUserActivity: true,
  emailMaintenance: true,
  pushNotifications: true,
  theme: 'system',
};

const ensureAdminSettings = async (userId: string) => {
  let adminSettings = await prisma.adminSettings.findUnique({
    where: { userId },
  });

  if (!adminSettings) {
    adminSettings = await prisma.adminSettings.create({
      data: {
        userId,
        ...DEFAULT_ADMIN_SETTINGS,
      },
    });
  }

  return adminSettings;
};

const sanitizeAdminSettings = <T extends { [key: string]: unknown } | null>(settings: T) => {
  if (!settings || typeof settings !== 'object') {
    return settings;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { smsAlerts, ...rest } = settings as Record<string, unknown>;
  return rest as T;
};

const sanitizeNASRuntimeConfig = (config: NASRuntimeConfig) => ({
  enabled: config.enabled,
  mountPath: config.mountPath,
  host: config.host,
  username: config.username,
  shareName: config.shareName,
  hasPassword: !!config.password,
});

// Get admin profile
export const getAdminProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        profilePhoto: true,
        phone: true,
        department: true,
        office: true,
        createdAt: true,
        updatedAt: true,
        adminSettings: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'Admin profile not found' });
    }

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      message: 'Failed to fetch admin profile',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Update admin profile
export const updateAdminProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, email, phone, department, office } = req.body;

    // Verify user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: userId }
        }
      });

      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (department !== undefined) updateData.department = department;
    if (office !== undefined) updateData.office = office;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        profilePhoto: true,
        phone: true,
        department: true,
        office: true,
        updatedAt: true
      }
    });

    // Log the profile update
    await auditLog(userId, 'ADMIN_PROFILE_UPDATED', {
      updatedFields: Object.keys(updateData)
    }, req);

    res.json({
      message: 'Admin profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update admin profile error:', error);
    res.status(500).json({
      message: 'Failed to update admin profile',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Change admin password
export const changeAdminPassword = async (req: AuthRequest, res: Response) => {
  try {
    console.log('[Admin] Password change request received');
    console.log('[Admin] User from request:', req.user);
    console.log('[Admin] Request body:', { currentPassword: '***', newPassword: '***' });

    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword) {
      console.log('[Admin] No current password provided');
      return res.status(400).json({ message: 'Current password is required' });
    }

    if (!newPassword) {
      console.log('[Admin] No new password provided');
      return res.status(400).json({ message: 'New password is required' });
    }

    // Verify user is admin
    console.log('[Admin] Looking up user with ID:', userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, passwordHash: true, email: true }
    });

    if (!user) {
      console.log('[Admin] User not found with ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'ADMIN') {
      console.log('[Admin] User is not admin. Role:', user.role);
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    // Verify current password
    console.log('[Admin] Verifying current password for user:', user.email);
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isCurrentPasswordValid) {
      console.log('[Admin] Current password verification failed for user:', user.email);
      return res.status(400).json({
        message: 'Current password is incorrect. Please enter your current password correctly.'
      });
    }

    console.log('[Admin] Current password verified successfully for user:', user.email);

    // Validate new password
    if (newPassword.length < 8) {
      return res.status(400).json({
        message: 'New password must be at least 8 characters long'
      });
    }

    // Check if new password is the same as current password
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      return res.status(400).json({
        message: 'New password must be different from your current password'
      });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash }
    });

    console.log('[Admin] Password updated successfully for user:', user.email);

    // Log the password change
    await auditLog(userId, 'ADMIN_PASSWORD_CHANGED', {
      userEmail: user.email,
      timestamp: new Date().toISOString()
    }, req);

    res.json({
      message: 'Password changed successfully',
      success: true
    });
  } catch (error) {
    console.error('Change admin password error:', error);
    res.status(500).json({
      message: 'Failed to change password. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get admin settings
export const getAdminSettings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Verify user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const adminSettings = await ensureAdminSettings(userId);

    res.json({ adminSettings: sanitizeAdminSettings(adminSettings) });
  } catch (error) {
    console.error('Get admin settings error:', error);
    res.status(500).json({
      message: 'Failed to fetch admin settings',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Update admin settings
export const updateAdminSettings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      maintenanceMode,
      emailNotifications,
      systemAlerts,
      autoBackup,
      sessionTimeout,
      maxLoginAttempts,
      emailSystemAlerts,
      emailUserActivity,
      emailMaintenance,
      pushNotifications,
      theme
    } = req.body;

    // Verify user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    // Validate session timeout
    if (sessionTimeout && (sessionTimeout < 5 || sessionTimeout > 480)) {
      return res.status(400).json({ message: 'Session timeout must be between 5 and 480 minutes' });
    }

    // Validate max login attempts
    if (maxLoginAttempts && (maxLoginAttempts < 3 || maxLoginAttempts > 20)) {
      return res.status(400).json({ message: 'Max login attempts must be between 3 and 20' });
    }

    // Validate theme
    if (theme && !['light', 'dark', 'system'].includes(theme)) {
      return res.status(400).json({ message: 'Invalid theme value' });
    }

    const updateData: any = {};
    if (maintenanceMode !== undefined) updateData.maintenanceMode = maintenanceMode;
    if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;
    if (systemAlerts !== undefined) updateData.systemAlerts = systemAlerts;
    if (autoBackup !== undefined) updateData.autoBackup = autoBackup;
    if (sessionTimeout !== undefined) updateData.sessionTimeout = sessionTimeout;
    if (maxLoginAttempts !== undefined) updateData.maxLoginAttempts = maxLoginAttempts;
    if (emailSystemAlerts !== undefined) updateData.emailSystemAlerts = emailSystemAlerts;
    if (emailUserActivity !== undefined) updateData.emailUserActivity = emailUserActivity;
    if (emailMaintenance !== undefined) updateData.emailMaintenance = emailMaintenance;
    if (pushNotifications !== undefined) updateData.pushNotifications = pushNotifications;
    if (theme !== undefined) updateData.theme = theme;

    // Upsert admin settings
    const adminSettings = await prisma.adminSettings.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        maintenanceMode: maintenanceMode ?? false,
        emailNotifications: emailNotifications ?? true,
        systemAlerts: systemAlerts ?? true,
        autoBackup: autoBackup ?? true,
        sessionTimeout: sessionTimeout ?? 30,
        maxLoginAttempts: maxLoginAttempts ?? 5,
        emailSystemAlerts: emailSystemAlerts ?? true,
        emailUserActivity: emailUserActivity ?? true,
        emailMaintenance: emailMaintenance ?? true,
        pushNotifications: pushNotifications ?? true,
        theme: theme ?? 'system'
      }
    });

    // Log the settings update
    await auditLog(userId, 'ADMIN_SETTINGS_UPDATED', {
      updatedFields: Object.keys(updateData)
    }, req);

    res.json({
      message: 'Admin settings updated successfully',
      adminSettings: sanitizeAdminSettings(adminSettings)
    });
  } catch (error) {
    console.error('Update admin settings error:', error);
    res.status(500).json({
      message: 'Failed to update admin settings',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

export const exportAdminSettingsFile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const [adminSettings, profile] = await Promise.all([
      ensureAdminSettings(userId),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          department: true,
          office: true,
          role: true,
          profilePhoto: true,
        },
      }),
    ]);

    const exportPayload = {
      generatedAt: new Date().toISOString(),
      profile,
      systemSettings: {
        maintenanceMode: adminSettings.maintenanceMode,
        emailNotifications: adminSettings.emailNotifications,
        systemAlerts: adminSettings.systemAlerts,
        autoBackup: adminSettings.autoBackup,
        sessionTimeout: adminSettings.sessionTimeout,
        maxLoginAttempts: adminSettings.maxLoginAttempts,
      },
      notifications: {
        emailSystemAlerts: adminSettings.emailSystemAlerts,
        emailUserActivity: adminSettings.emailUserActivity,
        emailMaintenance: adminSettings.emailMaintenance,
        pushNotifications: adminSettings.pushNotifications,
      },
      appearance: {
        theme: adminSettings.theme ?? 'system',
      },
      meta: {
        version: process.env.npm_package_version || null,
        exportedBy: profile?.email,
      },
    };

    const filename = `admin-settings-${new Date().toISOString().split('T')[0]}.json`;
    const buffer = Buffer.from(JSON.stringify(exportPayload, null, 2));

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);

    await auditLog(userId, 'ADMIN_SETTINGS_EXPORTED', { filename }, req);
  } catch (error) {
    console.error('Export admin settings error:', error);
    res.status(500).json({
      message: 'Failed to export admin settings',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

export const importAdminSettingsFile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { systemSettings, notifications, profile, appearance } = req.body || {};

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    if (!systemSettings && !notifications && !profile && !appearance) {
      return res.status(400).json({ message: 'No settings payload provided for import.' });
    }

    const toBoolean = (value: unknown) =>
      typeof value === 'boolean' ? value : undefined;

    const toNumber = (value: unknown) => {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === 'string') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
      return undefined;
    };

    const getTheme = (): string | undefined => {
      const candidate = appearance?.theme ?? (req.body?.theme as string | undefined);
      if (typeof candidate === 'string' && ['light', 'dark', 'system'].includes(candidate)) {
        return candidate;
      }
      return undefined;
    };

    const importedTheme = getTheme();

    const result = await prisma.$transaction(async (tx) => {
      const adminSettings = await tx.adminSettings.upsert({
        where: { userId },
        update: {
          ...(toBoolean(systemSettings?.maintenanceMode) !== undefined && {
            maintenanceMode: systemSettings.maintenanceMode,
          }),
          ...(toBoolean(systemSettings?.emailNotifications) !== undefined && {
            emailNotifications: systemSettings.emailNotifications,
          }),
          ...(toBoolean(systemSettings?.systemAlerts) !== undefined && {
            systemAlerts: systemSettings.systemAlerts,
          }),
          ...(toBoolean(systemSettings?.autoBackup) !== undefined && {
            autoBackup: systemSettings.autoBackup,
          }),
          ...(toNumber(systemSettings?.sessionTimeout) !== undefined && {
            sessionTimeout: toNumber(systemSettings.sessionTimeout),
          }),
          ...(toNumber(systemSettings?.maxLoginAttempts) !== undefined && {
            maxLoginAttempts: toNumber(systemSettings.maxLoginAttempts),
          }),
          ...(toBoolean(notifications?.emailSystemAlerts) !== undefined && {
            emailSystemAlerts: notifications.emailSystemAlerts,
          }),
          ...(toBoolean(notifications?.emailUserActivity) !== undefined && {
            emailUserActivity: notifications.emailUserActivity,
          }),
          ...(toBoolean(notifications?.emailMaintenance) !== undefined && {
            emailMaintenance: notifications.emailMaintenance,
          }),
          ...(toBoolean(notifications?.pushNotifications) !== undefined && {
            pushNotifications: notifications.pushNotifications,
          }),
          ...(importedTheme && { theme: importedTheme }),
        },
        create: {
          userId,
          maintenanceMode:
            toBoolean(systemSettings?.maintenanceMode) ??
            DEFAULT_ADMIN_SETTINGS.maintenanceMode,
          emailNotifications:
            toBoolean(systemSettings?.emailNotifications) ??
            DEFAULT_ADMIN_SETTINGS.emailNotifications,
          systemAlerts:
            toBoolean(systemSettings?.systemAlerts) ??
            DEFAULT_ADMIN_SETTINGS.systemAlerts,
          autoBackup:
            toBoolean(systemSettings?.autoBackup) ??
            DEFAULT_ADMIN_SETTINGS.autoBackup,
          sessionTimeout:
            toNumber(systemSettings?.sessionTimeout) ??
            DEFAULT_ADMIN_SETTINGS.sessionTimeout,
          maxLoginAttempts:
            toNumber(systemSettings?.maxLoginAttempts) ??
            DEFAULT_ADMIN_SETTINGS.maxLoginAttempts,
          emailSystemAlerts:
            toBoolean(notifications?.emailSystemAlerts) ??
            DEFAULT_ADMIN_SETTINGS.emailSystemAlerts,
          emailUserActivity:
            toBoolean(notifications?.emailUserActivity) ??
            DEFAULT_ADMIN_SETTINGS.emailUserActivity,
          emailMaintenance:
            toBoolean(notifications?.emailMaintenance) ??
            DEFAULT_ADMIN_SETTINGS.emailMaintenance,
          pushNotifications:
            toBoolean(notifications?.pushNotifications) ??
            DEFAULT_ADMIN_SETTINGS.pushNotifications,
          theme: importedTheme ?? DEFAULT_ADMIN_SETTINGS.theme,
        },
      });

      let updatedProfile = null as
        | {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          department: string | null;
          office: string | null;
          role: string;
          profilePhoto: string | null;
        }
        | null;

      if (profile && typeof profile === 'object') {
        const profileData: Record<string, string | null> = {};

        if (typeof profile.name === 'string') {
          profileData.name = profile.name;
        }
        if (typeof profile.email === 'string') {
          profileData.email = profile.email;
        }
        if (typeof profile.phone === 'string' || profile.phone === null) {
          profileData.phone = profile.phone ?? null;
        }
        if (typeof profile.department === 'string' || profile.department === null) {
          profileData.department = profile.department ?? null;
        }
        if (typeof profile.office === 'string' || profile.office === null) {
          profileData.office = profile.office ?? null;
        }

        if (Object.keys(profileData).length > 0) {
          updatedProfile = await tx.user.update({
            where: { id: userId },
            data: profileData,
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              department: true,
              office: true,
              role: true,
              profilePhoto: true,
            },
          });
        }
      }

      return { adminSettings, profile: updatedProfile };
    });

    await auditLog(
      userId,
      'ADMIN_SETTINGS_IMPORTED',
      {
        importedSections: Object.entries({ systemSettings, notifications, profile, appearance })
          .filter(([_, value]) => value !== undefined)
          .map(([key]) => key),
      },
      req
    );

    res.json({
      message: 'Settings imported successfully',
      adminSettings: sanitizeAdminSettings(result.adminSettings),
      profile: result.profile,
      notifications: {
        emailSystemAlerts: result.adminSettings.emailSystemAlerts,
        emailUserActivity: result.adminSettings.emailUserActivity,
        emailMaintenance: result.adminSettings.emailMaintenance,
        pushNotifications: result.adminSettings.pushNotifications,
      },
    });
  } catch (error) {
    console.error('Import admin settings error:', error);
    res.status(500).json({
      message: 'Failed to import admin settings',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Get all instructors for assignment dropdown
export const getInstructors = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Verify user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    // Get all active instructors
    const instructors = await prisma.user.findMany({
      where: {
        role: 'INSTRUCTOR',
        active: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        active: true,
        _count: {
          select: {
            studentsAssigned: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ instructors });
  } catch (error) {
    console.error('Get instructors error:', error);
    res.status(500).json({
      message: 'Failed to fetch instructors',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get admin dashboard data
export const getAdminDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Verify user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    // Get dashboard statistics
    const [
      totalStudents,
      activeStudents,
      totalCompanies,
      totalCoordinators,
      totalInstructors,
      totalIndustryPartners,
      pendingDocuments,
      recentActivities
    ] = await Promise.all([
      prisma.student.count(),
      prisma.student.count({ where: { user: { active: true } } }),
      prisma.company.count(),
      prisma.user.count({ where: { role: 'COORDINATOR', active: true } }),
      prisma.user.count({ where: { role: 'INSTRUCTOR', active: true } }),
      prisma.user.count({ where: { role: 'INDUSTRY_PARTNER', active: true } }),
      prisma.document.count({ where: { status: 'PENDING' } }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          action: true,
          meta: true,
          createdAt: true,
          user: {
            select: { name: true }
          }
        }
      })
    ]);

    const dashboardData = {
      stats: {
        totalStudents,
        activeStudents,
        totalCompanies,
        totalCoordinators,
        totalInstructors,
        totalIndustryPartners,
        pendingDocuments,
        pendingAttendance: 0, // This would need to be calculated based on attendance logic
        systemUptime: "99.9%",
        recentRegistrations: 0, // This would need to be calculated based on recent user registrations
        monthlyActiveUsers: 0 // This would need to be calculated based on user activity
      },
      recentActivities: recentActivities.map(activity => ({
        id: activity.id,
        type: activity.action,
        description: `${activity.action.replace(/_/g, ' ').toLowerCase()}`,
        timestamp: activity.createdAt.toISOString(),
        user: activity.user.name,
        metadata: activity.meta
      }))
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({
      message: 'Failed to fetch admin dashboard data',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get system information
export const getSystemInfo = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Verify user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    // Get real system information
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = Math.round((usedMemory / totalMemory) * 100);

    // Get CPU information
    const cpuInfo = os.cpus();
    const cpuModel = cpuInfo[0]?.model || 'Unknown';
    const cpuCount = cpuInfo.length;

    // Get system uptime
    const uptimeSeconds = os.uptime();
    const uptimeDays = Math.floor(uptimeSeconds / (24 * 60 * 60));
    const uptimeHours = Math.floor((uptimeSeconds % (24 * 60 * 60)) / (60 * 60));
    const systemUptime = `${uptimeDays} days, ${uptimeHours} hours`;

    // Get NAS storage metrics (preferred) or local storage fallback
    const nasMetrics = await getNASStorageMetrics();
    const localMetrics = await getLocalStorageMetrics();

    // Use NAS storage if available, otherwise use local storage, fallback to root filesystem
    let storageMetrics = nasMetrics;
    let diskUsage = 0;
    let totalDiskGiB = 0;
    let usedDiskGiB = 0;
    let nasAvailable = false;
    let nasStorage = null;

    if (nasMetrics && nasMetrics.available) {
      // Use NAS storage
      storageMetrics = nasMetrics;
      diskUsage = nasMetrics.percentUsed;
      totalDiskGiB = Number((nasMetrics.total / 1024 / 1024 / 1024).toFixed(2));
      usedDiskGiB = Number((nasMetrics.used / 1024 / 1024 / 1024).toFixed(2));
      nasAvailable = true;
      nasStorage = {
        total: nasMetrics.totalFormatted,
        used: nasMetrics.usedFormatted,
        free: nasMetrics.freeFormatted,
        percentUsed: nasMetrics.percentUsed,
        path: nasMetrics.path
      };
    } else if (localMetrics && localMetrics.available) {
      // Use local storage
      storageMetrics = localMetrics;
      diskUsage = localMetrics.percentUsed;
      totalDiskGiB = Number((localMetrics.total / 1024 / 1024 / 1024).toFixed(2));
      usedDiskGiB = Number((localMetrics.used / 1024 / 1024 / 1024).toFixed(2));
    } else {
      // Fallback to root filesystem check
      try {
        const diskPath = os.platform() === 'win32' ? 'C:' : '/';
        const disk = await checkDiskSpace(diskPath);
        if (disk && disk.size > 0) {
          totalDiskGiB = Number((disk.size / 1024 / 1024 / 1024).toFixed(2));
          const freeGiB = Number((disk.free / 1024 / 1024 / 1024).toFixed(2));
          usedDiskGiB = Number((totalDiskGiB - freeGiB).toFixed(2));
          diskUsage = Math.min(
            100,
            Math.max(0, Math.round(((disk.size - disk.free) / disk.size) * 100))
          );
        }
      } catch (diskError) {
        console.warn('Could not calculate disk usage:', diskError);
        // fallback to previous behavior
        diskUsage = 75;
      }
    }

    // Get database information
    const [
      totalUsers,
      totalDocuments,
      activeUsers,
      actualDbSize
    ] = await Promise.all([
      prisma.user.count(),
      prisma.document.count(),
      prisma.user.count({ where: { active: true } }),
      // Get actual database size from PostgreSQL
      prisma.$queryRaw<Array<{ size: bigint }>>`
        SELECT pg_database_size(current_database()) as size
      `.then(result => result[0]?.size || BigInt(0)).catch(() => BigInt(0))
    ]);

    // Convert bytes to MB/GB
    const dbSizeBytes = Number(actualDbSize);
    const dbSizeMB = Math.round((dbSizeBytes / 1024 / 1024) * 100) / 100;
    const dbSizeGB = Math.round((dbSizeBytes / 1024 / 1024 / 1024) * 100) / 100;
    const dbSizeFormatted = dbSizeGB >= 1
      ? `${dbSizeGB} GB`
      : `${dbSizeMB} MB`;

    // Get server load (simplified). On Windows loadavg is [0,0,0]; avoid divide-by-zero.
    const loadAverage = os.loadavg();
    const rawLoad = cpuCount > 0 ? (loadAverage[0] * 100) / cpuCount : 0;
    const serverLoad = Math.round(rawLoad);
    const loadAverage1min = loadAverage[0].toFixed(2);
    const loadAverage5min = loadAverage[1].toFixed(2);
    const loadAverage15min = loadAverage[2].toFixed(2);

    // Check database connectivity
    let databaseStatus = 'online';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (dbError) {
      databaseStatus = 'offline';
      console.error('Database connectivity check failed:', dbError);
    }

    // Get storage alerts
    const storageAlerts = await getAllStorageAlerts();

    // Check for database alerts
    const alerts: StorageAlert[] = [...storageAlerts];
    if (databaseStatus === 'offline') {
      alerts.push({
        type: 'critical',
        message: 'Database is offline. System functionality may be limited.',
        component: 'database',
        timestamp: new Date().toISOString()
      });
    }

    // Check if API server is responsive
    const apiServerStatus = 'running'; // Since we're responding to this request

    const systemInfo = {
      version: process.env.npm_package_version || '2.1.3',
      lastUpdated: new Date().toISOString(),
      databaseSize: dbSizeFormatted,
      databaseSizeBytes: dbSizeBytes,
      activeUsers: totalUsers,
      totalDocuments,
      systemUptime,
      serverLoad: Math.min(serverLoad, 100), // Cap at 100%
      memoryUsage: memoryUsagePercent,
      diskUsage,
      databaseStatus,
      apiServerStatus,
      totalMemory: Number((totalMemory / 1024 / 1024 / 1024).toFixed(2)), // GB
      freeMemory: Number((freeMemory / 1024 / 1024 / 1024).toFixed(2)), // GB
      usedMemory: Number((usedMemory / 1024 / 1024 / 1024).toFixed(2)), // GB
      totalDisk: totalDiskGiB,
      usedDisk: usedDiskGiB,
      cpuModel,
      cpuCount,
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      // Load average details
      loadAverage1min,
      loadAverage5min,
      loadAverage15min,
      // NAS storage metrics
      nasAvailable,
      nasStorage,
      // Storage alerts
      alerts
    };

    res.json({ systemInfo });
  } catch (error) {
    console.error('Get system info error:', error);
    res.status(500).json({
      message: 'Failed to fetch system information',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

export const getNASConfig = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const config = await getNASRuntimeConfig();
    applyNASRuntimeConfigToEnv(config);
    const { storagePath, isUsingFallback } = getStoragePathWithFallback();


    res.json({
      nasConfig: sanitizeNASRuntimeConfig(config),
      runtime: {
        storagePath,
        isUsingFallback
      }
    });
  } catch (error) {
    console.error('Get NAS config error:', error);
    res.status(500).json({
      message: 'Failed to fetch NAS configuration',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

export const updateNASConfig = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const {
      enabled,
      mountPath,
      host,
      username,
      password,
      shareName,
    } = req.body || {};

    if (mountPath && typeof mountPath !== 'string') {
      return res.status(400).json({ message: 'Invalid mountPath' });
    }
    if (host && typeof host !== 'string') {
      return res.status(400).json({ message: 'Invalid host' });
    }
    if (username && typeof username !== 'string') {
      return res.status(400).json({ message: 'Invalid username' });
    }
    if (password && typeof password !== 'string') {
      return res.status(400).json({ message: 'Invalid password' });
    }
    if (shareName && typeof shareName !== 'string') {
      return res.status(400).json({ message: 'Invalid shareName' });
    }

    const config = await saveNASRuntimeConfig({
      enabled: enabled === undefined ? undefined : !!enabled,
      mountPath,
      host,
      username,
      password,
      shareName,
    }, userId);

    applyNASRuntimeConfigToEnv(config);


    res.json({
      message: 'NAS configuration updated',
      nasConfig: sanitizeNASRuntimeConfig(config)
    });
  } catch (error) {
    console.error('Update NAS config error:', error);
    res.status(500).json({
      message: 'Failed to update NAS configuration',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

export const testNASConfigConnection = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const config = await getNASRuntimeConfig();
    applyNASRuntimeConfigToEnv(config);
    const isConnected = await validateNASConnection();
    const { storagePath, isUsingFallback } = getStoragePathWithFallback();


    res.json({
      connected: isConnected,
      message: isConnected
        ? 'NAS connection is active and writable'
        : 'NAS is not connected. Check host mount and credentials.',
      runtime: {
        storagePath,
        isUsingFallback
      }
    });
  } catch (error) {
    console.error('Test NAS config error:', error);
    res.status(500).json({
      connected: false,
      message: 'Failed to test NAS connection',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

export const syncNASFromLocal = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const config = await getNASRuntimeConfig();
    applyNASRuntimeConfigToEnv(config);
    const syncResult = await syncLocalToNAS();


    res.json({
      message: `Sync complete. ${syncResult.synced} file(s) synced, ${syncResult.failed} failed, ${syncResult.hashVerified} hash-verified.`,
      ...syncResult
    });
  } catch (error) {
    console.error('Sync NAS config error:', error);
    res.status(500).json({
      message: 'Failed to sync local files to NAS',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

/**
 * Run a full NAS vs Local file integrity check.
 * Compares every file by size and MD5 hash; returns a detailed report.
 */
export const runNASIntegrityCheck = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    console.log(`[Integrity] Check triggered by admin ${userId}`);
    const report = await runIntegrityCheck();

    res.json({
      message: `Integrity check complete. ${report.totalFiles} files checked.`,
      report,
    });
  } catch (error) {
    console.error('Integrity check error:', error);
    res.status(500).json({
      message: 'Failed to run integrity check',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Check maintenance mode status (public endpoint)
export const checkMaintenanceStatus = async (req: Request, res: Response) => {
  try {
    const adminSettings = await prisma.adminSettings.findFirst({
      where: {
        maintenanceMode: true
      },
      select: {
        maintenanceMode: true,
        updatedAt: true
      }
    });

    const isMaintenanceMode = !!adminSettings;

    res.json({
      maintenanceMode: isMaintenanceMode,
      message: isMaintenanceMode
        ? 'System is currently under maintenance'
        : 'System is operational',
      lastUpdated: adminSettings?.updatedAt || null
    });
  } catch (error) {
    console.error('Error checking maintenance status:', error);
    res.status(500).json({
      message: 'Failed to check maintenance status',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Emergency disable maintenance mode (public endpoint for emergencies)
export const emergencyDisableMaintenance = async (req: Request, res: Response) => {
  try {
    console.log('[Admin] Emergency maintenance mode disable requested');

    // Update all admin settings to disable maintenance mode
    await prisma.adminSettings.updateMany({
      where: {
        maintenanceMode: true
      },
      data: {
        maintenanceMode: false
      }
    });

    res.json({
      message: 'Maintenance mode has been disabled successfully',
      success: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error disabling maintenance mode:', error);
    res.status(500).json({
      message: 'Failed to disable maintenance mode',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

export const clearSystemCache = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    globalCache.__appCache = {};

    // Reset Prisma connection to clear prepared statements/cached metadata
    await prisma.$disconnect();
    await prisma.$connect();

    res.json({
      message: 'System cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Clear system cache error:', error);
    res.status(500).json({
      message: 'Failed to clear system cache',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

export const previewClearAllNASData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const config = await getNASRuntimeConfig();
    applyNASRuntimeConfigToEnv(config);

    if (!config.enabled) {
      return res.json({
        available: false,
        reason: 'NAS is currently disabled.',
        mountPath: config.mountPath || '',
        topLevelEntryCount: 0,
        totalFiles: 0,
        totalDirectories: 0,
        totalSizeBytes: 0,
        entries: []
      });
    }

    const isConnected = await validateNASConnection();
    if (!isConnected) {
      return res.json({
        available: false,
        reason: 'NAS is not connected or not writable. Cannot generate preview.',
        mountPath: config.mountPath || '',
        topLevelEntryCount: 0,
        totalFiles: 0,
        totalDirectories: 0,
        totalSizeBytes: 0,
        entries: []
      });
    }

    const mountPath = path.resolve(config.mountPath);
    const parsedRoot = path.parse(mountPath).root;
    if (!mountPath || mountPath === parsedRoot) {
      return res.json({
        available: false,
        reason: 'Unsafe NAS mount path. Refusing to scan root directory.',
        mountPath: mountPath || '',
        topLevelEntryCount: 0,
        totalFiles: 0,
        totalDirectories: 0,
        totalSizeBytes: 0,
        entries: []
      });
    }

    if (!fs.existsSync(mountPath)) {
      return res.json({
        available: false,
        reason: 'NAS mount path does not exist.',
        mountPath,
        topLevelEntryCount: 0,
        totalFiles: 0,
        totalDirectories: 0,
        totalSizeBytes: 0,
        entries: []
      });
    }

    const collectStats = (targetPath: string) => {
      let files = 0;
      let directories = 0;
      let sizeBytes = 0;
      const stack = [targetPath];

      while (stack.length > 0) {
        const current = stack.pop()!;
        const items = fs.readdirSync(current, { withFileTypes: true });
        for (const item of items) {
          const itemPath = path.join(current, item.name);
          if (item.isDirectory()) {
            directories++;
            stack.push(itemPath);
          } else if (item.isFile()) {
            files++;
            try {
              sizeBytes += fs.statSync(itemPath).size;
            } catch {
              // Ignore files that fail stat and continue scan.
            }
          }
        }
      }

      return { files, directories, sizeBytes };
    };

    const topEntries = fs.readdirSync(mountPath, { withFileTypes: true });
    const entries = topEntries.map((entry) => {
      const entryPath = path.join(mountPath, entry.name);
      if (entry.isDirectory()) {
        const stats = collectStats(entryPath);
        return {
          name: entry.name,
          type: 'directory' as const,
          files: stats.files,
          directories: stats.directories,
          sizeBytes: stats.sizeBytes
        };
      }

      let sizeBytes = 0;
      try {
        sizeBytes = fs.statSync(entryPath).size;
      } catch {
        // ignore stat failures
      }
      return {
        name: entry.name,
        type: 'file' as const,
        files: 1,
        directories: 0,
        sizeBytes
      };
    });

    const totals = entries.reduce((acc, entry) => {
      acc.files += entry.files;
      acc.directories += entry.directories + (entry.type === 'directory' ? 1 : 0);
      acc.sizeBytes += entry.sizeBytes;
      return acc;
    }, { files: 0, directories: 0, sizeBytes: 0 });

    res.json({
      available: true,
      mountPath,
      topLevelEntryCount: entries.length,
      totalFiles: totals.files,
      totalDirectories: totals.directories,
      totalSizeBytes: totals.sizeBytes,
      entries: entries.sort((a, b) => a.name.localeCompare(b.name))
    });
  } catch (error) {
    console.error('Preview clear NAS data error:', error);
    res.status(500).json({
      message: 'Failed to generate NAS clear preview',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

export const clearAllNASData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const rawTargets = Array.isArray(req.body?.targets) ? req.body.targets : [];

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const config = await getNASRuntimeConfig();
    applyNASRuntimeConfigToEnv(config);

    if (!config.enabled) {
      return res.status(400).json({ message: 'NAS is currently disabled.' });
    }

    const isConnected = await validateNASConnection();
    if (!isConnected) {
      return res.status(400).json({
        message: 'NAS is not connected or not writable. Aborting clear operation.'
      });
    }

    const mountPath = path.resolve(config.mountPath);
    const parsedRoot = path.parse(mountPath).root;
    if (!mountPath || mountPath === parsedRoot) {
      return res.status(400).json({
        message: 'Unsafe NAS mount path. Refusing to clear root directory.'
      });
    }

    if (!fs.existsSync(mountPath)) {
      return res.status(404).json({ message: 'NAS mount path does not exist.' });
    }

    const allEntries = fs.readdirSync(mountPath, { withFileTypes: true });
    const hasTargetFilter = rawTargets.length > 0;
    const requestedTargets = rawTargets
      .filter((target: unknown): target is string => typeof target === 'string')
      .map((target) => target.trim())
      .filter((target) => target.length > 0);

    if (hasTargetFilter) {
      const invalidTargets = requestedTargets.filter((target) =>
        target === '.' ||
        target === '..' ||
        target.includes('/') ||
        target.includes('\\')
      );
      if (invalidTargets.length > 0) {
        return res.status(400).json({
          message: 'Invalid target paths. Only top-level NAS entry names are allowed.'
        });
      }
    }

    const requestedSet = new Set(requestedTargets);
    const entries = hasTargetFilter
      ? allEntries.filter((entry) => requestedSet.has(entry.name))
      : allEntries;

    if (hasTargetFilter && entries.length === 0) {
      return res.status(400).json({
        message: 'None of the selected NAS targets were found.'
      });
    }

    let deletedItems = 0;
    let failedItems = 0;
    const failedNames: string[] = [];
    const deletedNames: string[] = [];

    for (const entry of entries) {
      const entryPath = path.join(mountPath, entry.name);
      try {
        fs.rmSync(entryPath, { recursive: true, force: true });
        deletedItems++;
        deletedNames.push(entry.name);
      } catch (error) {
        failedItems++;
        failedNames.push(entry.name);
      }
    }

    await auditLog(userId, 'ADMIN_CLEAR_ALL_NAS_DATA', {
      mountPath,
      mode: hasTargetFilter ? 'selected' : 'all',
      requestedTargets: hasTargetFilter ? requestedTargets : undefined,
      deletedItems,
      failedItems,
      deletedNames: deletedNames.slice(0, 50),
      failedNames: failedNames.slice(0, 20)
    }, req);

    res.json({
      message: failedItems > 0
        ? 'NAS clear completed with partial failures.'
        : 'All NAS data has been cleared successfully.',
      mode: hasTargetFilter ? 'selected' : 'all',
      requestedTargets,
      mountPath,
      deletedItems,
      failedItems,
      deletedNames,
      failedNames
    });
  } catch (error) {
    console.error('Clear all NAS data error:', error);
    res.status(500).json({
      message: 'Failed to clear NAS data',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

export const restartSystem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    res.json({
      message: 'System restart initiated. The service will restart momentarily.',
      timestamp: new Date().toISOString()
    });

    // Give the response a moment to flush before exiting
    setTimeout(() => {
      console.log('[Admin] Restart requested by admin. Exiting process to trigger restart.');
      process.exit(0);
    }, 500);
  } catch (error) {
    console.error('Restart system error:', error);
    res.status(500).json({
      message: 'Failed to initiate system restart',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};
