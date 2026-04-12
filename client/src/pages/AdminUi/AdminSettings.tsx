import { useState, useEffect, type ReactNode } from "react";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Camera,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  Palette,
  Sun,
  Moon,
  Monitor,
  Bell,
  Shield,
  Settings as SettingsIcon,
  Mail,
  HelpCircle,
  FileText,
  Database,
  Download,
  Upload,
  X,
  AlertTriangle,
  Info,
  RotateCcw,
  Eraser,
  Power,

} from "lucide-react";
import {
  settingsService,
  type AppPreferences,
} from "../../services/settingsService";
import {
  adminService,
  type NASBackupStatus,
  type SystemInfo,
  type SystemAlert,
} from "../../services/adminService";
import api from "../../services/api";
import toast from "react-hot-toast";
import { AdminSettingsSkeleton } from "../../components/LoadingStates/AdminSkeleton";
import TwoFactorSettings from "../../components/settings/TwoFactorSettings";
import EmailVerificationSettings from "../../components/settings/EmailVerificationSettings";
import LastLoginInfo from "../../components/settings/LastLoginInfo";
import PasswordStrengthMeter from "../../components/settings/PasswordStrengthMeter";
import AboutUsSection from "../../components/settings/AboutUsSection";
import { devLog } from "../../utils/devLog";

interface AdminProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  office?: string;
  profilePhoto?: string | null;
  role: string;
}

interface PasswordChange {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface SystemSettings {
  maintenanceMode: boolean;
  emailNotifications: boolean;
  systemAlerts: boolean;
  autoBackup: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
}

interface NotificationPreferences {
  emailSystemAlerts: boolean;
  emailUserActivity: boolean;
  emailMaintenance: boolean;
  pushNotifications: boolean;
}

interface NASClearPreview {
  available: boolean;
  reason?: string;
  mountPath: string;
  topLevelEntryCount: number;
  totalFiles: number;
  totalDirectories: number;
  totalSizeBytes: number;
  entries: Array<{
    name: string;
    type: "file" | "directory";
    files: number;
    directories: number;
    sizeBytes: number;
  }>;
  deletesFilesOnly?: boolean;
}

function SystemInformationPanel({ systemInfo }: { systemInfo: SystemInfo }) {
  const dbOnline = (systemInfo.databaseStatus ?? "online") === "online";
  const memPct = systemInfo.memoryUsage ?? 0;
  const memTone =
    memPct >= 95
      ? "text-red-600 dark:text-red-400"
      : memPct >= 85
        ? "text-amber-600 dark:text-amber-400"
        : "text-gray-900 dark:text-gray-100";
  const envLabel = (systemInfo.environment || "production").replace(/_/g, " ");

  const metricTile = (label: string, value: ReactNode) => (
    <div
      key={label}
      className="rounded-xl border border-gray-200/90 dark:border-gray-700 bg-white dark:bg-gray-900/40 px-4 py-3 shadow-sm"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <div className="mt-1.5 text-sm text-gray-900 dark:text-gray-100 break-words leading-snug">{value}</div>
    </div>
  );

  const resourceTiles: { label: string; value: ReactNode }[] = [
    {
      label: "Database status",
      value: (
        <span className={dbOnline ? "text-green-600 dark:text-green-400 font-medium" : "text-red-600 dark:text-red-400 font-medium"}>
          {dbOnline ? "Online" : "Offline"}
        </span>
      ),
    },
    { label: "System uptime", value: systemInfo.systemUptime || "—" },
    {
      label: "Memory",
      value: (
        <span className={memTone}>
          {memPct}%
          {systemInfo.usedMemory != null &&
          systemInfo.totalMemory != null &&
          systemInfo.totalMemory > 0 ? (
            <span className="block text-xs font-normal text-gray-600 dark:text-gray-400 mt-1">
              {systemInfo.usedMemory} GB / {systemInfo.totalMemory} GB
            </span>
          ) : null}
        </span>
      ),
    },
    {
      label: "Disk",
      value:
        systemInfo.usedDisk != null && systemInfo.totalDisk != null
          ? `${systemInfo.usedDisk} GB / ${systemInfo.totalDisk} GB (${systemInfo.diskUsage ?? 0}%)`
          : `${systemInfo.diskUsage ?? 0}%`,
    },
    {
      label: "Server load",
      value: (
        <>
          <span className="tabular-nums">{systemInfo.serverLoad ?? 0}%</span>
          {systemInfo.loadAverage1min != null && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
              Load avg · 1m {systemInfo.loadAverage1min}
              {systemInfo.loadAverage5min != null && ` · 5m ${systemInfo.loadAverage5min}`}
              {systemInfo.loadAverage15min != null && ` · 15m ${systemInfo.loadAverage15min}`}
            </p>
          )}
        </>
      ),
    },
    {
      label: "Database size",
      value: (
        <>
          {systemInfo.databaseSize || "—"}
          {systemInfo.databaseSizeBytes != null && (
            <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
              {Math.round(Number(systemInfo.databaseSizeBytes) / 1024 / 1024)} MB (raw)
            </span>
          )}
        </>
      ),
    },
  ];

  const appTiles: { label: string; value: ReactNode }[] = [
    {
      label: "Users & documents",
      value: (
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Users</p>
            <p className="tabular-nums text-base font-medium mt-0.5">{systemInfo.activeUsers ?? 0}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Documents</p>
            <p className="tabular-nums text-base font-medium mt-0.5">
              {systemInfo.totalDocuments?.toLocaleString() ?? 0}
            </p>
          </div>
        </div>
      ),
    },
    { label: "App version", value: systemInfo.version || "—" },
    { label: "Environment", value: <span className="uppercase tracking-wide">{envLabel}</span> },
    { label: "Platform", value: `${systemInfo.platform || "—"} · ${systemInfo.arch || "—"}` },
    { label: "Node.js", value: systemInfo.nodeVersion || "—" },
    {
      label: "Metrics refreshed",
      value: systemInfo.lastUpdated ? new Date(systemInfo.lastUpdated).toLocaleString() : "—",
    },
  ];

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 sm:p-5">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-5 flex items-center flex-wrap gap-2">
        <Database className="w-5 h-5 shrink-0 text-gray-600 dark:text-gray-400" />
        System Information
      </h3>

      <div className="space-y-8">
        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
            Availability & resources
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {resourceTiles.map(({ label, value }) => metricTile(label, value))}
          </div>
        </section>

        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
            Processor
          </p>
          <div className="rounded-xl border border-gray-200/90 dark:border-gray-700 bg-white dark:bg-gray-900/40 px-4 py-3 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">CPU</p>
            <div className="mt-1.5 text-sm text-gray-900 dark:text-gray-100 break-words leading-snug">
              <span className="break-words">{systemInfo.cpuModel || "—"}</span>
              {(systemInfo.cpuCount ?? 0) > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{systemInfo.cpuCount} cores</p>
              )}
            </div>
          </div>
        </section>

        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
            Application & host
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {appTiles.map(({ label, value }) => metricTile(label, value))}
          </div>
        </section>
      </div>
    </div>
  );
}

function getNasBackupHeadline(
  backup: NASBackupStatus,
): { text: string; color: "green" | "amber" | "red" | "gray" | "blue" } {
  if (backup.syncInProgress) {
    return { text: "Backup in progress — syncing files to NAS...", color: "blue" };
  }
  if (!backup.nasFeatureEnabled) {
    return { text: "NAS is disabled. Files are only stored on the server.", color: "amber" };
  }
  const run = backup.lastScheduled;
  if (!run) {
    return {
      text: "Waiting for first backup check. The server checks every 30 minutes automatically.",
      color: "gray",
    };
  }
  if (run.status === "completed" && run.summary === "up_to_date") {
    return { text: "All files are backed up. No new files needed copying.", color: "green" };
  }
  if (run.status === "completed" && run.summary === "files_copied") {
    const f = run.failed ?? 0;
    if (f > 0) {
      return {
        text: `Backup finished — ${run.synced} file(s) copied, but ${f} failed. Check server logs.`,
        color: "amber",
      };
    }
    return { text: `Backup complete — ${run.synced} file(s) copied to NAS successfully.`, color: "green" };
  }
  if (run.status === "skipped") {
    switch (run.skipReason) {
      case "nas_unavailable":
        return { text: "NAS is unreachable. Backup was skipped. Files stay on the server until the NAS is back.", color: "red" };
      case "auto_backup_disabled":
        return { text: "Automatic backup is turned off in your settings.", color: "amber" };
      case "sync_already_running":
        return { text: "A backup was already in progress when the next one was scheduled.", color: "gray" };
      default:
        return { text: "Backup was skipped.", color: "gray" };
    }
  }
  if (run.status === "error") {
    return { text: `Backup error: ${run.errorMessage || "Unknown error. Check server logs."}`, color: "red" };
  }
  return { text: "Backup status unknown.", color: "gray" };
}

function formatTimeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ${hrs % 24}h ago`;
}

const AdminSettings = () => {
  const [profile, setProfile] = useState<AdminProfile>({
    id: "",
    name: "",
    email: "",
    phone: "",
    department: "",
    office: "",
    profilePhoto: "",
    role: "ADMIN",
  });
  const [passwordData, setPasswordData] = useState<PasswordChange>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [emailVerifiedForPassword, setEmailVerifiedForPassword] = useState<boolean | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    emailNotifications: true,
    systemAlerts: true,
    autoBackup: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
  });
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    emailSystemAlerts: true,
    emailUserActivity: true,
    emailMaintenance: true,
    pushNotifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [systemStatus, setSystemStatus] = useState({
    database: "online",
    apiServer: "running",
    storage: 0,
    uptime: "—",
    activeUsers: 0,
    totalDocuments: 0,
    databaseSize: "—",
    diskUsageLabel: "",
    nasAvailable: false,
    nasStorage: null as SystemInfo['nasStorage'] | null,
  });
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    version: "2.1.3",
    lastUpdated: new Date().toISOString(),
    databaseSize: "—",
    activeUsers: 0,
    totalDocuments: 0,
    systemUptime: "—",
    serverLoad: 0,
    memoryUsage: 0,
    diskUsage: 0,
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [helpModal, setHelpModal] = useState<"faq" | "guide" | "privacy" | null>(
    null
  );
  // Email testing state
  const [emailTestEmail, setEmailTestEmail] = useState("");
  const [emailTesting, setEmailTesting] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<{
    type: "connection" | "send" | null;
    success: boolean;
    message: string;
  } | null>(null);
  const [nasPreviewLoading, setNasPreviewLoading] = useState(false);
  const [nasClearPreview, setNasClearPreview] = useState<NASClearPreview | null>(
    null
  );
  const [selectedNasTargets, setSelectedNasTargets] = useState<string[]>([]);

  // Settings sections for navigation
  const sections = [
    { id: "profile", label: "Profile Information", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "system", label: "System", icon: SettingsIcon },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "help", label: "Help & Support", icon: HelpCircle },
    { id: "about", label: "About Us", icon: Info },
  ];

  useEffect(() => {
    const initializeSettings = async () => {
      await loadProfile();
      loadTheme();
      await loadSystemSettings();
      loadSystemInfo();
      loadProfilePhoto();
    };

    initializeSettings();
  }, []);

  const closeHelpModal = () => setHelpModal(null);


  const loadProfilePhoto = async () => {
    try {
      const photoUrl = await settingsService.getProfilePhoto();
      if (photoUrl) {
        setProfilePhoto(photoUrl);
      }
    } catch (error) {
      devLog.log("No profile photo found");
    }
  };

  const loadTheme = () => {
    // Load theme from app preferences
    const appPrefs = settingsService.loadAppPreferences();
    const savedTheme =
      (appPrefs.theme as "light" | "dark" | "system") || "system";
    setTheme(savedTheme);

    // Apply the theme immediately
    settingsService.applyTheme(savedTheme === "system" ? "auto" : savedTheme);
  };

  const handleThemeChange = async (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);

    // Update app preferences
    const appPrefs = settingsService.loadAppPreferences();
    const updatedPrefs = {
      ...appPrefs,
      theme: (newTheme === "system" ? "auto" : newTheme) as
        | "light"
        | "dark"
        | "auto",
    };
    settingsService.saveAppPreferences(updatedPrefs);

    // Apply theme immediately
    settingsService.applyTheme(newTheme === "system" ? "auto" : newTheme);

    // Save theme to database
    try {
      await adminService.updateAdminSettings({ theme: newTheme });
    } catch (error) {
      devLog.error("Error saving theme to database:", error);
      // Don't show error toast for theme changes as it's not critical
    }

    toast.success(`Theme changed to ${newTheme}`);
  };

  const loadProfile = async () => {
    try {
      setLoading(true);

      // Load profile data from API
      const response = await adminService.getAdminProfile();
      const userData = response.user;

      setProfile({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone || "",
        department: userData.department || "",
        office: userData.office || "",
        profilePhoto: userData.profilePhoto || "",
        role: userData.role,
      });

      // Load profile photo if available
      if (userData.profilePhoto) {
        setProfilePhoto(userData.profilePhoto);
      } else {
        try {
          const photoUrl = await settingsService.getProfilePhoto();
          setProfilePhoto(photoUrl);
        } catch (error) {
          devLog.log("No profile photo found");
        }
      }

      try {
        const verified = await settingsService.getEmailVerificationStatus();
        setEmailVerifiedForPassword(verified);
      } catch {
        setEmailVerifiedForPassword(false);
      }
    } catch (error) {
      devLog.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const loadSystemSettings = async () => {
    try {
      // Load system settings from API
      const response = await adminService.getAdminSettings();
      const settings = response.adminSettings;

      setSystemSettings({
        maintenanceMode: settings.maintenanceMode,
        emailNotifications: settings.emailNotifications,
        systemAlerts: settings.systemAlerts,
        autoBackup: settings.autoBackup,
        sessionTimeout: settings.sessionTimeout,
        maxLoginAttempts: settings.maxLoginAttempts,
      });

      setNotifications({
        emailSystemAlerts: settings.emailSystemAlerts,
        emailUserActivity: settings.emailUserActivity,
        emailMaintenance: settings.emailMaintenance,
        pushNotifications: settings.pushNotifications,
      });

      // Set theme
      if (settings.theme) {
        setTheme(settings.theme as "light" | "dark" | "system");
      }
    } catch (error) {
      devLog.error("Error loading system settings:", error);
      // Fallback to localStorage if API fails
      const savedSettings = localStorage.getItem("adminSystemSettings");
      if (savedSettings) {
        setSystemSettings(JSON.parse(savedSettings));
      }
    }
  };

  const loadSystemInfo = async () => {
    try {
      devLog.log("Loading system information from API...");
      const systemInfoData = await adminService.getSystemInfo();
      setSystemInfo(systemInfoData);

      // Update system status with real data
      // Use NAS storage if available, otherwise use regular disk usage
      const storagePercent = systemInfoData.nasAvailable && systemInfoData.nasStorage
        ? systemInfoData.nasStorage.percentUsed
        : systemInfoData.diskUsage || 75;

      const diskUsageLabel =
        systemInfoData.nasAvailable && systemInfoData.nasStorage
          ? `${systemInfoData.nasStorage.used} / ${systemInfoData.nasStorage.total}`
          : systemInfoData.usedDisk !== undefined &&
              systemInfoData.totalDisk !== undefined &&
              systemInfoData.totalDisk > 0
            ? `${systemInfoData.usedDisk}GB / ${systemInfoData.totalDisk}GB`
            : "";

      setSystemStatus({
        database:
          systemInfoData.databaseStatus === "offline"
            ? "offline"
            : systemInfoData.databaseStatus === "unknown"
              ? "unknown"
              : "online",
        apiServer:
          systemInfoData.apiServerStatus === "unknown"
            ? "unknown"
            : systemInfoData.apiServerStatus === "down"
              ? "down"
              : "running",
        storage: storagePercent,
        uptime: systemInfoData.systemUptime || "15 days, 8 hours",
        activeUsers: systemInfoData.activeUsers || 156,
        totalDocuments: systemInfoData.totalDocuments || 1247,
        databaseSize: systemInfoData.databaseSize || "2.3 GB",
        diskUsageLabel,
        nasAvailable: systemInfoData.nasAvailable || false,
        nasStorage: systemInfoData.nasStorage || null,
      });

      // Update alerts
      setSystemAlerts(systemInfoData.alerts || []);

      devLog.log("System info loaded:", systemInfoData);
    } catch (error) {
      devLog.error("Error loading system information:", error);
      // Keep the default state if API fails
    }
  };

  const handleProfileUpdate = async () => {
    try {
      setSaving(true);
      setErrors({});

      // Validate required fields
      if (!profile.name.trim()) {
        setErrors({ name: "Full name is required" });
        return;
      }

      if (!profile.email.trim()) {
        setErrors({ email: "Email is required" });
        return;
      }

      if (!settingsService.validateEmail(profile.email)) {
        setErrors({ email: "Please enter a valid email address" });
        return;
      }

      if (profile.phone && !settingsService.validatePhone(profile.phone)) {
        setErrors({ phone: "Please enter a valid phone number" });
        return;
      }

      // Update profile using the admin service
      const response = await adminService.updateAdminProfile({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        department: profile.department,
        office: profile.office,
      });

      // Build updated profile information
      const updatedUser = {
        ...response.user,
        name: response.user.name || profile.name,
        email: response.user.email || profile.email,
        phone: response.user.phone ?? profile.phone,
        department: response.user.department ?? profile.department,
        office: response.user.office ?? profile.office,
      };

      // Update local state
      setProfile((prev) => ({
        ...prev,
        ...updatedUser,
      }));

      // Store updated profile in localStorage for immediate access
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...currentUser, ...updatedUser }));

      // Broadcast profile changes so other components refresh
      window.dispatchEvent(
        new CustomEvent("profileUpdated", {
          detail: {
            user: updatedUser,
          },
        })
      );

      // Reload profile photo to ensure it's up to date
      await loadProfilePhoto();

      setSaveSuccess(true);
      toast.success("Profile updated successfully");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      devLog.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (emailVerifiedForPassword !== true) {
      toast.error("Verify your email before changing your password.");
      return;
    }
    // Clear previous errors
    setErrors({});

    // Validate current password
    if (!passwordData.currentPassword.trim()) {
      setErrors({ currentPassword: "Current password is required" });
      return;
    }

    // Validate new password
    if (!passwordData.newPassword.trim()) {
      setErrors({ newPassword: "New password is required" });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setErrors({ newPassword: "Password must be at least 8 characters long" });
      return;
    }

    // Validate password confirmation
    if (!passwordData.confirmPassword.trim()) {
      setErrors({ confirmPassword: "Please confirm your new password" });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      return;
    }

    // Check if new password is the same as current password
    if (passwordData.currentPassword === passwordData.newPassword) {
      setErrors({
        newPassword: "New password must be different from current password",
      });
      return;
    }

    try {
      setSaving(true);
      setErrors({});

      devLog.log("🔐 Attempting to change password...");

      // Change password using the admin service
      const response = await adminService.changeAdminPassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      devLog.log("✅ Password change successful:", response);

      setSaveSuccess(true);
      toast.success("Password changed successfully");

      // Clear form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      devLog.error("❌ Error changing password:", error);
      devLog.error("Error details:", error);

      // Handle specific error cases
      if (
        error.message &&
        error.message.includes("Current password is incorrect")
      ) {
        setErrors({ currentPassword: "Current password is incorrect" });
        toast.error(
          "Current password is incorrect. Please check and try again."
        );
      } else if (
        error.message &&
        error.message.includes("New password must be different")
      ) {
        setErrors({
          newPassword: "New password must be different from current password",
        });
        toast.error(
          "New password must be different from your current password."
        );
      } else if (
        error.message &&
        error.message.includes("must be at least 8 characters")
      ) {
        setErrors({
          newPassword: "Password must be at least 8 characters long",
        });
        toast.error("New password must be at least 8 characters long.");
      } else {
        // Generic error handling
        const errorMessage =
          error.message || "Failed to change password. Please try again.";
        toast.error(errorMessage);
        setErrors({ general: errorMessage });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSystemSettingsUpdate = async () => {
    try {
      setSaving(true);

      // Update system settings using the admin service
      await adminService.updateAdminSettings({
        maintenanceMode: systemSettings.maintenanceMode,
        emailNotifications: systemSettings.emailNotifications,
        systemAlerts: systemSettings.systemAlerts,
        autoBackup: systemSettings.autoBackup,
        sessionTimeout: systemSettings.sessionTimeout,
        maxLoginAttempts: systemSettings.maxLoginAttempts,
      });

      setSaveSuccess(true);
      toast.success("System settings updated successfully");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      devLog.error("Error updating system settings:", error);
      toast.error(error.message || "Failed to update system settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSystemMaintenance = async () => {
    const newMaintenanceMode = !systemSettings.maintenanceMode;
    const action = newMaintenanceMode ? "enable" : "disable";

    if (
      confirm(
        `Are you sure you want to ${action} system maintenance mode?\n\n${newMaintenanceMode
          ? "⚠️ This will block ALL non-admin users from accessing the system via web interface and API.\n\nOnly administrators will be able to access the system during maintenance."
          : "✅ This will restore normal access for all users."
        }`
      )
    ) {
      try {
        setSaving(true);

        // Update the setting
        setSystemSettings((prev) => ({
          ...prev,
          maintenanceMode: newMaintenanceMode,
        }));

        // Save to backend
        await adminService.updateAdminSettings({
          maintenanceMode: newMaintenanceMode,
        });

        toast.success(
          `System maintenance mode ${newMaintenanceMode ? "enabled" : "disabled"
          } successfully!`,
          { duration: 5000 }
        );

        // Show additional info for maintenance mode
        if (newMaintenanceMode) {
          toast.success(
            "Maintenance mode is now active. All non-admin users will see a maintenance page.",
            { duration: 8000 }
          );
        }
      } catch (error: any) {
        devLog.error("Error updating maintenance mode:", error);
        toast.error("Failed to update maintenance mode. Please try again.");

        // Revert the setting on error
        setSystemSettings((prev) => ({
          ...prev,
          maintenanceMode: !newMaintenanceMode,
        }));
      } finally {
        setSaving(false);
      }
    }
  };

  const handleExportData = async () => {
    const toastId = toast.loading("Preparing export...");
    setSaving(true);

    try {
      const { blob, fileName } = await adminService.exportAdminSettings();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      toast.success("Settings exported successfully!", { id: toastId });
    } catch (error) {
      devLog.error("Error exporting admin settings:", error);
      const message =
        error instanceof Error ? error.message : "Failed to export settings";
      toast.error(message, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (
      file.type &&
      file.type !== "application/json" &&
      file.type !== "text/plain"
    ) {
      toast.error("Please select a valid JSON file");
      event.target.value = "";
      return;
    }

    const toastId = toast.loading("Importing settings...");
    setSaving(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        const payload = {
          systemSettings: parsed.systemSettings,
          notifications: parsed.notifications,
          profile: parsed.profile,
          appearance: parsed.appearance || {
            theme: parsed.theme,
          },
        };

        const response = await adminService.importAdminSettings(payload);
        const importedSettings = response.adminSettings;

        setSystemSettings({
          maintenanceMode: importedSettings.maintenanceMode,
          emailNotifications: importedSettings.emailNotifications,
          systemAlerts: importedSettings.systemAlerts,
          autoBackup: importedSettings.autoBackup,
          sessionTimeout: importedSettings.sessionTimeout,
          maxLoginAttempts: importedSettings.maxLoginAttempts,
        });

        setNotifications(response.notifications);

        const importedProfile = response.profile;
        if (importedProfile) {
          setProfile({
            id: importedProfile.id,
            name: importedProfile.name,
            email: importedProfile.email,
            phone: importedProfile.phone || "",
            department: importedProfile.department || "",
            office: importedProfile.office || "",
            profilePhoto: importedProfile.profilePhoto || "",
            role: importedProfile.role,
          });
          setProfilePhoto(importedProfile.profilePhoto || null);
        }

        if (importedSettings.theme) {
          const importedTheme = importedSettings.theme;
          setTheme(importedTheme);
          const appPrefs = settingsService.loadAppPreferences();
          const updatedPrefs: AppPreferences = {
            ...appPrefs,
            theme:
              importedTheme === "system" ? "auto" : importedTheme,
          };
          settingsService.saveAppPreferences(updatedPrefs);
          settingsService.applyTheme(
            importedTheme === "system" ? "auto" : importedTheme
          );
        }

        toast.success("Settings imported successfully!", { id: toastId });
      } catch (error) {
        devLog.error("Error importing admin settings:", error);
        const message =
          error instanceof Error ? error.message : "Invalid JSON file format";
        toast.error(message, { id: toastId });
      } finally {
        setSaving(false);
      }
    };

    reader.onerror = () => {
      toast.error("Failed to read the selected file", { id: toastId });
      setSaving(false);
    };

    reader.readAsText(file);

    // Reset the file input so the same file can be re-imported
    event.target.value = "";
  };

  const handleClearCache = async () => {
    try {
      setSaving(true);
      toast.loading("Clearing system cache...", { id: "cache" });

      await adminService.clearSystemCache();

      toast.success("System cache cleared successfully!", { id: "cache" });
    } catch (error) {
      toast.error("Cache clearing failed. Please try again.", { id: "cache" });
    } finally {
      setSaving(false);
    }
  };

  const handleSystemRestart = async () => {
    if (
      confirm(
        "Are you sure you want to restart the system? This will temporarily interrupt service."
      )
    ) {
      try {
        setSaving(true);
        toast.loading("Restarting system...", { id: "restart" });

        await adminService.restartSystem();

        toast.success(
          "Restart initiated. The service will reload shortly.",
          { id: "restart", duration: 5000 }
        );
      } catch (error) {
        toast.error("System restart failed. Please try again.", {
          id: "restart",
        });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleClearAllNASData = async () => {
    if (!nasClearPreview) {
      const continueWithoutPreview = confirm(
        "No NAS preview loaded yet. Generate preview first so you can review what will be deleted. Continue anyway?"
      );
      if (!continueWithoutPreview) return;
    }

    const deletingSelected = selectedNasTargets.length > 0;
    const confirmed = confirm(
      deletingSelected
        ? `This will permanently delete all FILES under ${selectedNasTargets.length} selected top-level folder(s) (folders stay). Continue?`
        : "This will permanently delete ALL FILES under the NAS storage path (folders stay, possibly empty). Continue?"
    );
    if (!confirmed) return;

    const secondConfirmed = confirm(
      "Final warning: only files are removed — directory names remain. This cannot be undone."
    );
    if (!secondConfirmed) return;

    try {
      setSaving(true);
      toast.loading("Removing NAS files...", { id: "nas-clear-all" });

      const result = await adminService.clearAllNASData(
        selectedNasTargets.length > 0 ? selectedNasTargets : undefined
      );
      const successMessage =
        result.failedItems > 0
          ? `NAS file cleanup partial: ${result.deletedItems} file(s) removed, ${result.failedItems} operation(s) failed.`
          : `NAS file cleanup done: ${result.deletedItems} file(s) removed (folders kept).`;

      toast.success(successMessage, { id: "nas-clear-all", duration: 6000 });
      setSelectedNasTargets([]);
      await handlePreviewClearAllNASData();
      await loadSystemInfo();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to clear NAS data.";
      toast.error(message, { id: "nas-clear-all" });
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewClearAllNASData = async () => {
    try {
      setNasPreviewLoading(true);
      toast.loading("Loading NAS delete preview...", { id: "nas-preview" });
      const preview = await adminService.getClearAllNASPreview();
      setNasClearPreview(preview);
      setSelectedNasTargets([]);
      if (preview.available) {
        toast.success("NAS preview loaded.", { id: "nas-preview" });
      } else {
        toast.error(preview.reason || "NAS preview unavailable.", {
          id: "nas-preview",
        });
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load NAS preview.";
      toast.error(message, { id: "nas-preview" });
    } finally {
      setNasPreviewLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
  };

  const toggleNasTarget = (name: string) => {
    setSelectedNasTargets((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
  };

  const selectAllNasTargets = () => {
    if (!nasClearPreview?.available) return;
    setSelectedNasTargets(nasClearPreview.entries.map((entry) => entry.name));
  };

  const clearNasTargetSelection = () => {
    setSelectedNasTargets([]);
  };

  const refreshSystemStatus = async () => {
    try {
      setSaving(true);
      toast.loading("Refreshing system status...", { id: "status" });

      // Load fresh system information from API
      await loadSystemInfo();

      toast.success("System status refreshed!", { id: "status" });
    } catch (error) {
      toast.error("Failed to refresh system status.", { id: "status" });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPG, PNG, or GIF)");
      return;
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      toast.error("File size must be less than 2MB");
      return;
    }

    try {
      setUploadingPhoto(true);

      // Upload to server
      const photoUrl = await settingsService.uploadProfilePhoto(file);
      setProfilePhoto(photoUrl);

      // Dispatch custom event to notify other components
      window.dispatchEvent(
        new CustomEvent("profilePhotoUpdated", {
          detail: { photoUrl },
        })
      );

      toast.success("Profile photo updated successfully!");

      // Reset the file input
      event.target.value = "";
    } catch (error) {
      devLog.error("Error uploading photo:", error);
      toast.error("Failed to upload photo. Please try again.");
      // Clear photo on error
      setProfilePhoto(null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleNotificationsUpdate = async () => {
    try {
      setSaving(true);

      // Update notification settings using the admin service
      await adminService.updateAdminSettings({
        emailSystemAlerts: notifications.emailSystemAlerts,
        emailUserActivity: notifications.emailUserActivity,
        emailMaintenance: notifications.emailMaintenance,
        pushNotifications: notifications.pushNotifications,
      });

      setSaveSuccess(true);
      toast.success("Notification preferences updated");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      devLog.error("Error updating notification settings:", error);
      toast.error(error.message || "Failed to update notification settings");
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setSaving(true);
      await settingsService.removeProfilePhoto();
      setProfilePhoto(null);

      // Dispatch custom event to notify other components of profile photo removal
      window.dispatchEvent(
        new CustomEvent("profilePhotoUpdated", {
          detail: { photoUrl: null },
        })
      );

      toast.success("Profile photo removed successfully");
    } catch (error) {
      devLog.error("Error removing photo:", error);
      toast.error("Failed to remove profile photo");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <AdminSettingsSkeleton />;
  }

  return (
    <div className="space-y-6 font-outfit">
      {/* Success Message */}
      {saveSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-3xl border border-emerald-200 bg-white p-6 text-center shadow-2xl dark:border-emerald-800/60 dark:bg-gray-900">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
              <CheckCircle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-200">
              Settings saved successfully!
            </h3>
            <p className="mt-2 text-sm text-emerald-600/80 dark:text-emerald-200/80">
              Your changes are now live.
            </p>
            <button
              onClick={() => setSaveSuccess(false)}
              className="mt-6 inline-flex items-center rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              {Object.entries(errors).map(([field, message]) => (
                <p
                  key={field}
                  className="text-sm text-red-800 dark:text-red-200 font-medium"
                >
                  {message}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-4 bg-white dark:bg-[#19191c] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-2">
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors text-left ${activeSection === section.id
                      ? "bg-purple-600 text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-sm">{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-[#19191c] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            {/* Profile Section */}
            {activeSection === "profile" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    Profile Information
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Update your personal information
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0">
                  <div className="relative">
                    <div className="w-24 h-24 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center overflow-hidden">
                      {profilePhoto ? (
                        <img
                          src={profilePhoto}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-12 h-12 text-purple-600 dark:text-purple-300" />
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg cursor-pointer transition-colors">
                      <Camera className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        disabled={uploadingPhoto}
                      />
                    </label>
                  </div>
                  <div>
                    <label className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium cursor-pointer transition-colors inline-flex items-center space-x-2">
                      {uploadingPhoto ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4" />
                          <span>Change Photo</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        disabled={uploadingPhoto}
                      />
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      JPG, PNG or GIF. Max size 2MB
                    </p>
                    {profilePhoto && (
                      <button
                        onClick={handleRemovePhoto}
                        className="mt-2 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>
                </div>

                {/* Profile Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => {
                        setProfile({ ...profile, name: e.target.value });
                        if (errors.name) {
                          setErrors({ ...errors, name: "" });
                        }
                      }}
                      className={`w-full px-4 py-2 border rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 ${errors.name
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                        }`}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => {
                        setProfile({ ...profile, email: e.target.value });
                        if (errors.email) {
                          setErrors({ ...errors, email: "" });
                        }
                      }}
                      className={`w-full px-4 py-2 border rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 ${errors.email
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                        }`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => {
                        setProfile({ ...profile, phone: e.target.value });
                        if (errors.phone) {
                          setErrors({ ...errors, phone: "" });
                        }
                      }}
                      className={`w-full px-4 py-2 border rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 ${errors.phone
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                        }`}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      value={profile.department}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          department: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Office Location
                    </label>
                    <input
                      type="text"
                      value={profile.office}
                      onChange={(e) =>
                        setProfile({ ...profile, office: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleProfileUpdate}
                    disabled={saving}
                    className="flex items-center space-x-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            )}

            {/* Security Section */}
            {activeSection === "security" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    Password & Security
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Keep your account protected
                  </p>
                </div>

                <EmailVerificationSettings
                  showTopSeparator={false}
                  onVerificationStatusChange={setEmailVerifiedForPassword}
                />

                {emailVerifiedForPassword === false && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20 max-w-xl">
                    <p className="text-sm text-amber-900 dark:text-amber-100">
                      <strong>Email verification required.</strong> Send a verification link above, then open it from
                      your inbox before you can update your password.
                    </p>
                  </div>
                )}

                <fieldset
                  disabled={emailVerifiedForPassword !== true}
                  className="min-w-0 space-y-4 max-w-xl border-0 p-0"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => {
                          setPasswordData({
                            ...passwordData,
                            currentPassword: e.target.value,
                          });
                          if (errors.currentPassword) {
                            setErrors({ ...errors, currentPassword: "" });
                          }
                        }}
                        className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 disabled:opacity-60 ${errors.currentPassword
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                          }`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {errors.currentPassword && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.currentPassword}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => {
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          });
                          if (errors.newPassword) {
                            setErrors({ ...errors, newPassword: "" });
                          }
                        }}
                        className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 disabled:opacity-60 ${errors.newPassword
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                          }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <PasswordStrengthMeter password={passwordData.newPassword} />
                    {errors.newPassword && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.newPassword}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => {
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          });
                          if (errors.confirmPassword) {
                            setErrors({ ...errors, confirmPassword: "" });
                          }
                        }}
                        className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 disabled:opacity-60 ${errors.confirmPassword
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                          }`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </fieldset>

                {/* Two-Factor Authentication Section */}
                <TwoFactorSettings />

                {/* Last Login Info Section */}
                <LastLoginInfo />

                {/* Disable 2FA Modal */}


                <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">

                  <button
                    type="button"
                    onClick={handlePasswordChange}
                    disabled={saving || emailVerifiedForPassword !== true}
                    className="flex items-center space-x-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* System Section */}
            {activeSection === "system" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    System Management
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Advanced system controls and maintenance
                  </p>
                </div>

                <div className="space-y-6">
                  {/* System Status */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                        <Database className="w-5 h-5 mr-2 text-green-600" />
                        System Status
                        {systemAlerts && systemAlerts.length > 0 && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                            {systemAlerts.length} {systemAlerts.length === 1 ? 'alert' : 'alerts'}
                          </span>
                        )}
                      </h3>
                      <button
                        onClick={refreshSystemStatus}
                        disabled={saving}
                        className="flex items-center space-x-2 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                      >
                        <SettingsIcon className="w-4 h-4" />
                        <span>Refresh</span>
                      </button>
                    </div>

                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden divide-y divide-gray-200 dark:divide-gray-700">
                      {/* Database (connection + PostgreSQL stats) */}
                      <div className="px-4 py-3.5 flex gap-3">
                        <div
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${systemStatus.database === "online"
                            ? "bg-green-500"
                            : systemStatus.database === "unknown"
                              ? "bg-amber-500"
                              : "bg-red-500"
                            }`}
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              Database
                            </span>
                            <span
                              className={`text-xs font-medium ${systemStatus.database === "online"
                                ? "text-green-700 dark:text-green-300"
                                : systemStatus.database === "unknown"
                                  ? "text-amber-700 dark:text-amber-300"
                                  : "text-red-700 dark:text-red-300"
                                }`}
                            >
                              {systemStatus.database === "online"
                                ? "Online"
                                : systemStatus.database === "unknown"
                                  ? "Status unknown"
                                  : "Offline"}
                            </span>
                          </div>
                          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
                            <div className="flex justify-between gap-3 sm:contents">
                              <dt className="text-gray-500 dark:text-gray-500">Size</dt>
                              <dd className="text-gray-900 dark:text-gray-100 sm:text-right">
                                {systemInfo.databaseSize || "—"}
                              </dd>
                            </div>
                            <div className="flex justify-between gap-3 sm:contents">
                              <dt className="text-gray-500 dark:text-gray-500">Users</dt>
                              <dd className="text-gray-900 dark:text-gray-100 sm:text-right tabular-nums">
                                {systemInfo.activeUsers ?? 0}
                              </dd>
                            </div>
                            <div className="flex justify-between gap-3 sm:contents sm:col-span-2">
                              <dt className="text-gray-500 dark:text-gray-500">Documents</dt>
                              <dd className="text-gray-900 dark:text-gray-100 sm:text-right tabular-nums">
                                {systemInfo.totalDocuments ?? 0}
                              </dd>
                            </div>
                          </dl>
                          <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                            PostgreSQL
                          </p>
                        </div>
                      </div>

                      {/* API Server */}
                      <div className="px-4 py-3.5 flex gap-3">
                        <div
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${systemStatus.apiServer === "running"
                            ? "bg-green-500"
                            : systemStatus.apiServer === "unknown"
                              ? "bg-amber-500"
                              : "bg-red-500"
                            }`}
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              API server
                            </span>
                            <span
                              className={`text-xs font-medium capitalize ${systemStatus.apiServer === "running"
                                ? "text-green-700 dark:text-green-300"
                                : systemStatus.apiServer === "unknown"
                                  ? "text-amber-700 dark:text-amber-300"
                                  : "text-red-700 dark:text-red-300"
                                }`}
                            >
                              {systemStatus.apiServer === "unknown" ? "Status unknown" : systemStatus.apiServer}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Application backend for this admin session
                          </p>
                        </div>
                      </div>

                      {/* Storage */}
                      <div className="px-4 py-3.5 flex gap-3">
                        <div
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${!systemStatus.nasAvailable
                            ? "bg-orange-500"
                            : systemStatus.storage > 80
                              ? "bg-red-500"
                              : systemStatus.storage > 60
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              Storage
                            </span>
                            {!systemStatus.nasAvailable && (
                              <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-800 dark:bg-orange-900/40 dark:text-orange-200">
                                Fallback
                              </span>
                            )}
                          </div>
                          {!systemStatus.nasAvailable && (
                            <p className="text-xs text-amber-800 dark:text-amber-200">
                              NAS offline — using local storage.
                            </p>
                          )}
                          <p
                            className={`text-sm ${!systemStatus.nasAvailable
                              ? "text-orange-800 dark:text-orange-200"
                              : systemStatus.storage > 80
                                ? "text-red-800 dark:text-red-200"
                                : systemStatus.storage > 60
                                  ? "text-yellow-800 dark:text-yellow-200"
                                  : "text-green-800 dark:text-green-200"
                              }`}
                          >
                            {systemStatus.storage > 0 || systemStatus.diskUsageLabel
                              ? `${systemStatus.storage}% used`
                              : "Usage not reported"}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                            {systemStatus.diskUsageLabel ? (
                              <>
                                {systemStatus.diskUsageLabel}
                                {systemStatus.nasAvailable && systemStatus.nasStorage ? (
                                  <span className="text-indigo-600 dark:text-indigo-400"> · NAS</span>
                                ) : (
                                  <span className="text-orange-700 dark:text-orange-300"> · Local</span>
                                )}
                              </>
                            ) : (
                              <>
                                Used/total not reported for this path.
                                {!systemStatus.nasAvailable &&
                                  " Configure NAS or refresh after metrics load."}
                              </>
                            )}
                          </p>
                          {systemInfo.nasAvailable && systemInfo.nasStorage && (
                            <div className="pt-1">
                              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                                <span>NAS volume</span>
                                <span className="tabular-nums">{systemInfo.nasStorage.percentUsed}%</span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                                <div
                                  className="h-1.5 rounded-full bg-indigo-500 transition-all"
                                  style={{ width: `${systemInfo.nasStorage.percentUsed}%` }}
                                />
                              </div>
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                                {systemInfo.nasStorage.used} / {systemInfo.nasStorage.total}
                                {systemInfo.nasStorage.free && ` · ${systemInfo.nasStorage.free} free`}
                              </p>
                            </div>
                          )}
                          {!systemInfo.nasAvailable && (
                            <div className="pt-1">
                              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                                <span>Local disk</span>
                                <span className="tabular-nums">{systemInfo.diskUsage ?? 0}%</span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                                <div
                                  className="h-1.5 rounded-full bg-emerald-500 transition-all"
                                  style={{ width: `${systemInfo.diskUsage ?? 0}%` }}
                                />
                              </div>
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                                {systemStatus.diskUsageLabel ||
                                  (systemInfo.usedDisk !== undefined && systemInfo.totalDisk !== undefined
                                    ? `${systemInfo.usedDisk} GB / ${systemInfo.totalDisk} GB`
                                    : "—")}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* NAS Backup Status — admin-friendly */}
                      {systemInfo.nasBackup && (() => {
                        const headline = getNasBackupHeadline(systemInfo.nasBackup);
                        const colorMap = {
                          green: { dot: "bg-green-500", text: "text-green-800 dark:text-green-200", bg: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" },
                          amber: { dot: "bg-amber-500", text: "text-amber-800 dark:text-amber-200", bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" },
                          red:   { dot: "bg-red-500",   text: "text-red-800 dark:text-red-200",     bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" },
                          blue:  { dot: "bg-blue-500",  text: "text-blue-800 dark:text-blue-200",   bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" },
                          gray:  { dot: "bg-gray-400",  text: "text-gray-700 dark:text-gray-300",   bg: "bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700" },
                        };
                        const c = colorMap[headline.color];
                        const lastRun = systemInfo.nasBackup.lastScheduled;
                        return (
                          <div className="px-4 py-3.5 space-y-3 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              NAS Backup
                            </span>

                            {/* Main status banner */}
                            <div className={`flex items-start gap-3 rounded-lg border p-3 ${c.bg}`}>
                              <div className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${c.dot} ${headline.color === "blue" ? "animate-pulse" : ""}`} />
                              <div className="min-w-0 flex-1">
                                <p className={`text-sm font-medium leading-snug ${c.text}`}>
                                  {headline.text}
                                </p>
                                {lastRun && (
                                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Last checked {formatTimeAgo(lastRun.finishedAt)} ({lastRun.durationSeconds}s)
                                  </p>
                                )}
                                {!lastRun && !systemInfo.nasBackup.syncInProgress && (
                                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    The server automatically checks every 30 minutes.
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Quick stats (only when there's data) */}
                            {lastRun && lastRun.status === "completed" && lastRun.summary === "files_copied" && (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                                <div className="rounded-md bg-gray-50 dark:bg-gray-800/50 py-2">
                                  <p className="text-lg font-bold text-gray-900 dark:text-white">{lastRun.synced ?? 0}</p>
                                  <p className="text-[10px] uppercase tracking-wide text-gray-500">Copied</p>
                                </div>
                                <div className="rounded-md bg-gray-50 dark:bg-gray-800/50 py-2">
                                  <p className="text-lg font-bold text-gray-900 dark:text-white">{lastRun.hashVerified ?? 0}</p>
                                  <p className="text-[10px] uppercase tracking-wide text-gray-500">Verified</p>
                                </div>
                                <div className="rounded-md bg-gray-50 dark:bg-gray-800/50 py-2">
                                  <p className={`text-lg font-bold ${(lastRun.failed ?? 0) > 0 ? "text-red-600" : "text-gray-900 dark:text-white"}`}>{lastRun.failed ?? 0}</p>
                                  <p className="text-[10px] uppercase tracking-wide text-gray-500">Failed</p>
                                </div>
                                <div className="rounded-md bg-gray-50 dark:bg-gray-800/50 py-2">
                                  <p className={`text-lg font-bold ${(lastRun.hashFailed ?? 0) > 0 ? "text-amber-600" : "text-gray-900 dark:text-white"}`}>{lastRun.hashFailed ?? 0}</p>
                                  <p className="text-[10px] uppercase tracking-wide text-gray-500">Hash Issues</p>
                                </div>
                              </div>
                            )}

                            {/* Backup schedule info */}
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Backup runs every 30 minutes. NAS health is checked every 2 minutes.
                            </p>
                          </div>
                        );
                      })()}

                      {/* Memory */}
                      <div className="px-4 py-3.5">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            Memory
                          </span>
                          <span className="text-xs tabular-nums text-gray-600 dark:text-gray-400">
                            {systemInfo.totalMemory != null && systemInfo.totalMemory > 0
                              ? `${systemInfo.memoryUsage ?? 0}%`
                              : "—"}
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className="h-1.5 rounded-full bg-blue-500 transition-all"
                            style={{
                              width: `${systemInfo.totalMemory != null && systemInfo.totalMemory > 0 ? (systemInfo.memoryUsage ?? 0) : 0}%`,
                            }}
                          />
                        </div>
                        <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-400">
                          {systemInfo.totalMemory != null && systemInfo.totalMemory > 0
                            ? `${systemInfo.usedMemory ?? 0} GB / ${systemInfo.totalMemory} GB`
                            : "Totals appear when system info loads from the server."}
                        </p>
                      </div>

                      {/* CPU */}
                      <div className="px-4 py-3.5">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            CPU
                          </span>
                          <span className="text-xs tabular-nums text-gray-600 dark:text-gray-400">
                            {(systemInfo.cpuCount ?? 0) > 0 ? `${systemInfo.serverLoad ?? 0}%` : "—"}
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className="h-1.5 rounded-full bg-violet-500 transition-all"
                            style={{
                              width: `${(systemInfo.cpuCount ?? 0) > 0 ? (systemInfo.serverLoad ?? 0) : 0}%`,
                            }}
                          />
                        </div>
                        <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-400">
                          {(systemInfo.cpuCount ?? 0) > 0
                            ? `${systemInfo.cpuModel || "Processor"} · ${systemInfo.cpuCount} cores · load avg ${systemInfo.loadAverage1min ?? "0.00"}`
                            : "CPU details load with system info from the API."}
                        </p>
                      </div>

                      {/* System / runtime */}
                      <div className="px-4 py-3.5">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          System
                        </span>
                        <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
                          <div className="flex justify-between gap-3 sm:contents">
                            <dt className="text-gray-500 dark:text-gray-500">Uptime</dt>
                            <dd className="text-gray-900 dark:text-gray-100 sm:text-right">
                              {systemInfo.systemUptime || "—"}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-3 sm:contents">
                            <dt className="text-gray-500 dark:text-gray-500">Version</dt>
                            <dd className="text-gray-900 dark:text-gray-100 sm:text-right">
                              {systemInfo.version || "—"}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-3 sm:contents sm:col-span-2">
                            <dt className="text-gray-500 dark:text-gray-500">Environment</dt>
                            <dd className="text-gray-900 dark:text-gray-100 sm:text-right capitalize">
                              {systemInfo.environment || "—"}
                            </dd>
                          </div>
                        </dl>
                        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-500 italic">
                          Runtime since last server restart
                        </p>
                      </div>
                    </div>

                    {/* System Alerts */}
                    {systemAlerts && systemAlerts.length > 0 && (
                      <div className="mt-5">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-2 text-yellow-600" />
                          System alerts ({systemAlerts.length})
                        </h4>
                        <ul className="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700 overflow-hidden">
                          {systemAlerts.map((alert: SystemAlert, index: number) => (
                            <li
                              key={index}
                              className={`flex gap-3 px-4 py-3 ${alert.type === "critical"
                                ? "border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20"
                                : alert.type === "warning"
                                  ? "border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20"
                                  : "border-l-4 border-l-blue-500 bg-blue-50/40 dark:bg-blue-950/20"
                                }`}
                            >
                              {alert.type === "critical" ? (
                                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                              ) : alert.type === "warning" ? (
                                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                              ) : (
                                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                              )}
                              <div className="min-w-0 flex-1">
                                <p
                                  className={`text-sm font-medium ${alert.type === "critical"
                                    ? "text-red-900 dark:text-red-100"
                                    : alert.type === "warning"
                                      ? "text-amber-900 dark:text-amber-100"
                                      : "text-blue-900 dark:text-blue-100"
                                    }`}
                                >
                                  {alert.message}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {alert.component.toUpperCase()} · {new Date(alert.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  </div>

                  {/* System Configuration */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <SettingsIcon className="w-5 h-5 mr-2 text-blue-600" />
                      System Configuration
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Maintenance Mode
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Temporarily disable system access
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setSystemSettings({
                              ...systemSettings,
                              maintenanceMode: !systemSettings.maintenanceMode,
                            })
                          }
                          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${systemSettings.maintenanceMode
                            ? "bg-red-600"
                            : "bg-gray-600"
                            }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 shrink-0 transform rounded-full bg-white shadow-sm transition-transform ${systemSettings.maintenanceMode
                              ? "translate-x-6"
                              : "translate-x-1"
                              }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Auto Backup
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Scheduled sync from local storage to NAS (when NAS is available)
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setSystemSettings({
                              ...systemSettings,
                              autoBackup: !systemSettings.autoBackup,
                            })
                          }
                          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${systemSettings.autoBackup
                            ? "bg-green-600"
                            : "bg-gray-600"
                            }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 shrink-0 transform rounded-full bg-white shadow-sm transition-transform ${systemSettings.autoBackup
                              ? "translate-x-6"
                              : "translate-x-1"
                              }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Session Timeout (minutes)
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Auto-logout after inactivity
                          </p>
                        </div>
                        <select
                          value={systemSettings.sessionTimeout}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              sessionTimeout: parseInt(e.target.value),
                            })
                          }
                          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={60}>1 hour</option>
                          <option value={120}>2 hours</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Max Login Attempts
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Before account lockout
                          </p>
                        </div>
                        <select
                          value={systemSettings.maxLoginAttempts}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              maxLoginAttempts: parseInt(e.target.value),
                            })
                          }
                          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          <option value={3}>3 attempts</option>
                          <option value={5}>5 attempts</option>
                          <option value={10}>10 attempts</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Maintenance Control */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <SettingsIcon className="w-5 h-5 mr-2 text-orange-600" />
                      Maintenance Control
                    </h3>

                    <div
                      className={`flex items-center justify-between p-4 rounded-lg border ${systemSettings.maintenanceMode
                        ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                        : "bg-emerald-50 dark:bg-emerald-900/15 border-emerald-200 dark:border-emerald-800"
                        }`}
                    >
                      <div>
                        <p
                          className={`text-sm font-medium ${systemSettings.maintenanceMode
                            ? "text-red-800 dark:text-red-200"
                            : "text-emerald-900 dark:text-emerald-200"
                            }`}
                        >
                          System Maintenance Mode
                        </p>
                        <p
                          className={`text-xs ${systemSettings.maintenanceMode
                            ? "text-red-600 dark:text-red-400"
                            : "text-emerald-700 dark:text-emerald-300"
                            }`}
                        >
                          {systemSettings.maintenanceMode
                            ? "Users may be blocked or see a maintenance message."
                            : "Production mode — end users have normal access."}
                        </p>
                      </div>
                      <button
                        onClick={handleSystemMaintenance}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${systemSettings.maintenanceMode
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-red-600 hover:bg-red-700 text-white"
                          }`}
                      >
                        {systemSettings.maintenanceMode ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </div>

                  {/* System Actions */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <SettingsIcon className="w-5 h-5 mr-2 text-purple-600" />
                      System Actions
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <button
                        onClick={handleClearCache}
                        disabled={saving}
                        className="flex items-center space-x-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg hover:shadow-md transition-shadow disabled:opacity-50"
                      >
                        <Eraser className="w-5 h-5 shrink-0 text-yellow-600" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                            Clear Cache
                          </p>
                          <p className="text-xs text-yellow-600 dark:text-yellow-400">
                            Clear system cache
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={handleSystemRestart}
                        disabled={saving}
                        className="flex items-center space-x-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:shadow-md transition-shadow disabled:opacity-50"
                      >
                        <Power className="w-5 h-5 shrink-0 text-red-600" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-red-800 dark:text-red-200">
                            Restart System
                          </p>
                          <p className="text-xs text-red-600 dark:text-red-400">
                            Restart system services
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => window.location.reload()}
                        className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <RotateCcw className="w-5 h-5 shrink-0 text-green-600" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-green-800 dark:text-green-200">
                            Refresh Page
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            Reload application
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* NAS storage — danger zone */}
                  <div className="border border-rose-300 dark:border-rose-800 rounded-lg p-4 bg-rose-50/60 dark:bg-rose-900/10">
                    <h3 className="text-lg font-semibold text-rose-900 dark:text-rose-200 mb-2 flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2 text-rose-600" />
                      NAS Danger Zone
                    </h3>
                    <p className="text-sm text-rose-700 dark:text-rose-300 mb-4">
                      Permanently delete <strong>files only</strong> under your NAS path. Folder names stay (they may be empty afterward). Use checkboxes to limit which top-level folders are cleaned.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={handlePreviewClearAllNASData}
                        disabled={saving || nasPreviewLoading}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-white dark:bg-rose-950/30 border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-200 rounded-lg text-sm font-medium transition-colors hover:bg-rose-100 dark:hover:bg-rose-900/30 disabled:opacity-50"
                      >
                        <Info className="w-4 h-4" />
                        <span>{nasPreviewLoading ? "Loading Preview..." : "Preview Deletions"}</span>
                      </button>
                      <button
                        onClick={handleClearAllNASData}
                        disabled={saving}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>
                          {selectedNasTargets.length > 0
                            ? `Remove files in selected (${selectedNasTargets.length})`
                            : "Remove all NAS files"}
                        </span>
                      </button>
                    </div>

                    {nasClearPreview && (
                      <div className="mt-4 rounded-lg border border-rose-200 dark:border-rose-800 bg-white/70 dark:bg-rose-950/20 p-3">
                        {!nasClearPreview.available && (
                          <p className="text-xs text-rose-700 dark:text-rose-300 mb-3">
                            {nasClearPreview.reason || "NAS preview unavailable."}
                          </p>
                        )}
                        <p className="text-xs text-rose-700 dark:text-rose-300 mb-2">
                          Path: <span className="font-medium">{nasClearPreview.mountPath}</span>
                        </p>
                        <p className="text-xs text-rose-700 dark:text-rose-300 mb-1">
                          Top-level: {nasClearPreview.topLevelEntryCount} | Files: {nasClearPreview.totalFiles} | Folders: {nasClearPreview.totalDirectories} | Size: {formatBytes(nasClearPreview.totalSizeBytes)}
                        </p>
                        <p className="text-xs text-rose-600/90 dark:text-rose-300/90 mb-3">
                          Clear removes files inside these paths only — directories are not deleted.
                        </p>
                        {nasClearPreview.available && nasClearPreview.entries.length > 0 && (
                          <div className="mb-3 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={selectAllNasTargets}
                              className="px-2.5 py-1 text-xs rounded border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-200 hover:bg-rose-100 dark:hover:bg-rose-900/30"
                            >
                              Select All
                            </button>
                            <button
                              type="button"
                              onClick={clearNasTargetSelection}
                              className="px-2.5 py-1 text-xs rounded border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-200 hover:bg-rose-100 dark:hover:bg-rose-900/30"
                            >
                              Clear Selection
                            </button>
                            <span className="text-xs text-rose-700 dark:text-rose-300">
                              Selected: {selectedNasTargets.length}
                            </span>
                          </div>
                        )}
                        <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                          {nasClearPreview.entries.length === 0 ? (
                            <p className="text-xs text-rose-600 dark:text-rose-300">No NAS entries found.</p>
                          ) : (
                            nasClearPreview.entries.map((entry) => (
                              <div
                                key={entry.name}
                                className="text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between gap-3"
                              >
                                <label className="truncate inline-flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedNasTargets.includes(entry.name)}
                                    onChange={() => toggleNasTarget(entry.name)}
                                    className="rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                                  />
                                  <span className="truncate">
                                    {entry.type === "directory" ? "DIR" : "FILE"} - {entry.name}
                                  </span>
                                </label>
                                <span className="shrink-0 opacity-80">
                                  {entry.type === "directory"
                                    ? `${entry.files} files, ${entry.directories} subfolders`
                                    : formatBytes(entry.sizeBytes)}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Data Management */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Download className="w-5 h-5 mr-2 text-blue-600" />
                      Data Management
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={handleExportData}
                        className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <Download className="w-5 h-5 text-blue-600" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Export Settings
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            Download your configuration
                          </p>
                        </div>
                      </button>

                      <label className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                        <Upload className="w-5 h-5 text-green-600" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-green-800 dark:text-green-200">
                            Import Settings
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            Upload configuration file
                          </p>
                        </div>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImportData}
                          className="hidden"
                          disabled={saving}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Email Testing Section */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center flex-wrap gap-2">
                        <Mail className="w-5 h-5 shrink-0 text-purple-600" />
                        Email Service Testing
                      </h3>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      Test your email service configuration and send a test email to verify everything is working correctly.
                    </p>

                    <div className="space-y-4">
                      {/* Test Connection Button */}
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                        <button
                          onClick={async () => {
                            try {
                              setEmailTesting(true);
                              setEmailTestResult(null);
                              const response = await api.get("/email/test");
                              setEmailTestResult({
                                type: "connection",
                                success: response.data.connected,
                                message: response.data.message || (response.data.error || "Email connection failed"),
                              });
                              if (response.data.connected) {
                                toast.success("Email connection successful!");
                              } else {
                                toast.error(response.data.message || response.data.error || "Email connection failed");
                              }
                            } catch (error: any) {
                              // Check if this is a token expiration error that's being handled by the interceptor
                              if (error.response?.status === 401 && error.response?.data?.message?.includes("Token expired")) {
                                // Token refresh is happening automatically, wait a bit and retry
                                await new Promise(resolve => setTimeout(resolve, 1000));
                                try {
                                  const retryResponse = await api.get("/email/test");
                                  const errorMessage = retryResponse.data.message || retryResponse.data.error || "Email connection failed";
                                  setEmailTestResult({
                                    type: "connection",
                                    success: retryResponse.data.connected,
                                    message: errorMessage,
                                  });
                                  if (retryResponse.data.connected) {
                                    toast.success("Email connection successful!");
                                  } else {
                                    toast.error(errorMessage);
                                  }
                                  return;
                                } catch (retryError: any) {
                                  // If retry also fails, show the error
                                }
                              }
                              const errorMessage = error.response?.data?.message || error.response?.data?.error || "Connection test failed. Please try again.";
                              setEmailTestResult({
                                type: "connection",
                                success: false,
                                message: errorMessage,
                              });
                              toast.error(errorMessage);
                            } finally {
                              setEmailTesting(false);
                            }
                          }}
                          disabled={emailTesting}
                          className="inline-flex w-full sm:w-auto shrink-0 justify-center items-center space-x-2 px-4 py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {emailTesting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Testing...</span>
                            </>
                          ) : (
                            <>
                              <SettingsIcon className="w-4 h-4" />
                              <span>Test Connection</span>
                            </>
                          )}
                        </button>

                        {emailTestResult?.type === "connection" && (
                          <div
                            className={`flex items-start gap-2 min-w-0 ${emailTestResult.success ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                              }`}
                          >
                            {emailTestResult.success ? (
                              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            ) : (
                              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            )}
                            <span className="text-sm font-medium break-words">
                              {emailTestResult.message}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Send Test Email */}
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Send Test Email
                        </label>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <input
                            type="email"
                            value={emailTestEmail}
                            onChange={(e) => setEmailTestEmail(e.target.value)}
                            placeholder="Enter email address to test"
                            className="w-full min-w-0 px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                          />
                          <button
                            onClick={async () => {
                              if (!emailTestEmail || !emailTestEmail.includes("@")) {
                                toast.error("Please enter a valid email address");
                                return;
                              }
                              try {
                                setEmailTesting(true);
                                setEmailTestResult(null);
                                const response = await api.post("/email/test-send", {
                                  email: emailTestEmail,
                                });
                                setEmailTestResult({
                                  type: "send",
                                  success: response.data.emailSent,
                                  message: response.data.message || (response.data.error || "Failed to send test email"),
                                });
                                if (response.data.emailSent) {
                                  toast.success("Test email sent successfully!");
                                } else {
                                  toast.error(response.data.message || response.data.error || "Failed to send test email");
                                }
                              } catch (error: any) {
                                // Check if this is a token expiration error that's being handled by the interceptor
                                if (error.response?.status === 401 && error.response?.data?.message?.includes("Token expired")) {
                                  // Token refresh is happening automatically, wait a bit and retry
                                  await new Promise(resolve => setTimeout(resolve, 1000));
                                  try {
                                    const retryResponse = await api.post("/email/test-send", {
                                      email: emailTestEmail,
                                    });
                                    const retryErrorMessage = retryResponse.data.message || retryResponse.data.error || "Failed to send test email";
                                    setEmailTestResult({
                                      type: "send",
                                      success: retryResponse.data.emailSent,
                                      message: retryErrorMessage,
                                    });
                                    if (retryResponse.data.emailSent) {
                                      toast.success("Test email sent successfully!");
                                    } else {
                                      toast.error(retryErrorMessage);
                                    }
                                    return;
                                  } catch (retryError: any) {
                                    // If retry also fails, show the error
                                  }
                                }
                                const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to send test email. Please try again.";
                                setEmailTestResult({
                                  type: "send",
                                  success: false,
                                  message: errorMessage,
                                });
                                toast.error(errorMessage);
                              } finally {
                                setEmailTesting(false);
                              }
                            }}
                            disabled={emailTesting || !emailTestEmail}
                            className="inline-flex w-full sm:w-auto shrink-0 justify-center items-center space-x-2 px-4 py-2.5 sm:py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {emailTesting ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Sending...</span>
                              </>
                            ) : (
                              <>
                                <Mail className="w-4 h-4" />
                                <span>Send Test Email</span>
                              </>
                            )}
                          </button>
                        </div>

                        {emailTestResult?.type === "send" && (
                          <div className={`flex items-start gap-2 p-3 rounded-lg min-w-0 ${emailTestResult.success
                            ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                            : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                            }`}>
                            {emailTestResult.success ? (
                              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            ) : (
                              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            )}
                            <span className="text-sm font-medium break-words">
                              {emailTestResult.message}
                            </span>
                          </div>
                        )}

                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          A test welcome email will be sent to the specified address. Check your inbox (and spam folder) after sending.
                        </p>
                      </div>
                    </div>
                  </div>

                  <SystemInformationPanel systemInfo={systemInfo} />

                  <div className="flex justify-end">
                    <button
                      onClick={handleSystemSettingsUpdate}
                      className="flex items-center space-x-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save System Settings</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Section */}
            {activeSection === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    Notification Preferences
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manage your notification settings
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      key: "emailSystemAlerts",
                      title: "System Alerts",
                      description:
                        "Get notified about system issues and maintenance",
                      enabled: notifications.emailSystemAlerts,
                    },
                    {
                      key: "emailUserActivity",
                      title: "User Activity",
                      description:
                        "Receive notifications about user actions and changes",
                      enabled: notifications.emailUserActivity,
                    },
                    {
                      key: "emailMaintenance",
                      title: "Maintenance Updates",
                      description:
                        "Get notified about scheduled maintenance windows",
                      enabled: notifications.emailMaintenance,
                    },
                    {
                      key: "pushNotifications",
                      title: "Push Notifications",
                      description: "Receive push notifications in browser",
                      enabled: notifications.pushNotifications,
                    },
                  ].map((notification) => (
                    <div
                      key={notification.key}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {notification.description}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notification.enabled}
                          onChange={(e) =>
                            setNotifications({
                              ...notifications,
                              [notification.key]: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleNotificationsUpdate}
                    className="flex items-center space-x-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Preferences</span>
                  </button>
                </div>
              </div>
            )}

            {/* Appearance Section */}
            {activeSection === "appearance" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    Appearance Settings
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Customize your interface appearance
                  </p>
                </div>

                {/* Theme Settings */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Theme Settings
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Choose your preferred theme appearance
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Light Theme */}
                    <button
                      onClick={() => handleThemeChange("light")}
                      className={`relative p-6 rounded-xl border-2 transition-all duration-200 ${theme === "light"
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                        }`}
                    >
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center">
                          <Sun className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">
                            Light
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Clean and bright interface
                          </p>
                        </div>
                      </div>
                      {theme === "light" && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="w-5 h-5 text-purple-600" />
                        </div>
                      )}
                    </button>

                    {/* Dark Theme */}
                    <button
                      onClick={() => handleThemeChange("dark")}
                      className={`relative p-6 rounded-xl border-2 transition-all duration-200 ${theme === "dark"
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                        }`}
                    >
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center">
                          <Moon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">
                            Dark
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Easy on the eyes
                          </p>
                        </div>
                      </div>
                      {theme === "dark" && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="w-5 h-5 text-purple-600" />
                        </div>
                      )}
                    </button>

                    {/* System Theme */}
                    <button
                      onClick={() => handleThemeChange("system")}
                      className={`relative p-6 rounded-xl border-2 transition-all duration-200 ${theme === "system"
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                        }`}
                    >
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                          <Monitor className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">
                            System
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Follow system preference
                          </p>
                        </div>
                      </div>
                      {theme === "system" && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="w-5 h-5 text-purple-600" />
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Help Section */}
            {activeSection === "help" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    Help & Support
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get help and learn more about the admin portal
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setHelpModal("faq")}
                    className="p-6 text-left bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <HelpCircle className="w-8 h-8 text-purple-600 mb-3" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      FAQ
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Find answers to common admin questions
                    </p>
                  </button>

                  <a
                    href="mailto:intraksystem@gmail.com?subject=INTRAK%20Admin%20Support%20Request"
                    className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <Mail className="w-8 h-8 text-blue-600 mb-3" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Contact Support
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Email: intraksystem@gmail.com
                    </p>
                  </a>

                  <button
                    type="button"
                    onClick={() => setHelpModal("guide")}
                    className="p-6 text-left bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <FileText className="w-8 h-8 text-green-600 mb-3" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Admin Guide
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Learn how to manage INTRAK at scale
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHelpModal("privacy")}
                    className="p-6 text-left bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <Shield className="w-8 h-8 text-yellow-600 mb-3" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Security & Privacy
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Review policies and compliance notes
                    </p>
                  </button>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    System Information
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p>
                      <span className="font-medium">Version:</span> 2.0.0
                    </p>
                    <p>
                      <span className="font-medium">Last Updated:</span> February
                      2026
                    </p>
                    <p>
                      <span className="font-medium">License:</span> Educational
                      Use
                    </p>
                    <p>
                      <span className="font-medium">Admin Level:</span> Super
                      Administrator
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* About Us Section */}
            {activeSection === "about" && <AboutUsSection />}
          </div>
        </div>
      </div>
      {
        helpModal && (
          <AdminHelpModalContent variant={helpModal} onClose={closeHelpModal} />
        )
      }
    </div >
  );
};

const AdminHelpModalContent = ({
  variant,
  onClose,
}: {
  variant: "faq" | "guide" | "privacy";
  onClose: () => void;
}) => {
  const titles = {
    faq: "Frequently Asked Questions",
    guide: "Administrator Quick Guide",
    privacy: "Security & Privacy Overview",
  } as const;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      style={{ marginTop: 0 }}
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          aria-label="Close help dialog"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="px-6 pb-6 pt-7 space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {titles[variant]}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {variant === "faq" &&
                "Quick answers to the most common administrator questions."}
              {variant === "guide" &&
                "Follow these steps to get the most out of the admin dashboard and controls."}
              {variant === "privacy" &&
                "A short summary of how INTRAK handles sensitive data and access controls."}
            </p>
          </div>

          {variant === "faq" && (
            <ul className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
              <li>
                <p className="font-semibold">
                  How do I create or reset admin accounts?
                </p>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  Use the User Management tab to provision new accounts or reset
                  credentials. The system automatically emails login
                  instructions.
                </p>
              </li>
              <li>
                <p className="font-semibold">
                  Where can I monitor system health?
                </p>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  Open Admin Settings → System to view live metrics, clear
                  cache, or restart services.
                </p>
              </li>
              <li>
                <p className="font-semibold">Can I roll back configuration?</p>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  Yes. Export your settings before making large changes. You can
                  re-import the JSON file to restore previous values.
                </p>
              </li>
            </ul>
          )}

          {variant === "guide" && (
            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <div>
                <p className="font-semibold">1. Start with the dashboard</p>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  Review alerts, recent activities, and pending requests daily
                  to keep the institution in sync.
                </p>
              </div>
              <div>
                <p className="font-semibold">2. Manage access & roles</p>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  Use User Management to add coordinators, instructors, and
                  supervisors. Always enforce secure passwords and refresh tokens
                  when roles change.
                </p>
              </div>
              <div>
                <p className="font-semibold">3. Protect your data</p>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  Export or archive admin settings when you need a copy.
                  Clear cache or restart backend services after major updates.
                  Use your database provider or standard DB backups for full recovery.
                </p>
              </div>
            </div>
          )}

          {variant === "privacy" && (
            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <div>
                <p className="font-semibold">Data retention</p>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  INTRAK stores academic and placement records in encrypted
                  databases hosted on Render. Full database backups are handled
                  by your hosting or DBA process, not inside this app.
                </p>
              </div>
              <div>
                <p className="font-semibold">Access controls</p>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  Only administrators can manage global settings. Coordinators,
                  instructors, and supervisors receive scoped permissions based
                  on their role.
                </p>
              </div>
              <div>
                <p className="font-semibold">Incident response</p>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  Enable system alerts to be notified of outages. Use the
                  Restart System action for planned maintenance and document any
                  changes in audit logs.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
