import { useState, useEffect } from "react";
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

} from "lucide-react";
import {
  settingsService,
  type AppPreferences,
} from "../../services/settingsService";
import { adminService, type SystemInfo, type SystemAlert } from "../../services/adminService";
import api from "../../services/api";
import toast from "react-hot-toast";
import { AdminSettingsSkeleton } from "../../components/LoadingStates/AdminSkeleton";
import TwoFactorSettings from "../../components/settings/TwoFactorSettings";

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
    storage: 75,
    uptime: "15 days, 8 hours",
    activeUsers: 156,
    totalDocuments: 1247,
    databaseSize: "2.3 GB",
    diskUsageLabel: "0 / 0 GB",
    nasAvailable: false,
    nasStorage: null as SystemInfo['nasStorage'] | null,
  });
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    version: "2.1.3",
    lastUpdated: new Date().toISOString(),
    databaseSize: "2.3 GB",
    activeUsers: 156,
    totalDocuments: 1247,
    systemUptime: "15 days, 8 hours",
    serverLoad: 45,
    memoryUsage: 68,
    diskUsage: 75,
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

  // Settings sections for navigation
  const sections = [
    { id: "profile", label: "Profile Information", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "system", label: "System", icon: SettingsIcon },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "help", label: "Help & Support", icon: HelpCircle },
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
      console.log("No profile photo found");
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
      console.error("Error saving theme to database:", error);
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
          console.log("No profile photo found");
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
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
      console.error("Error loading system settings:", error);
      // Fallback to localStorage if API fails
      const savedSettings = localStorage.getItem("adminSystemSettings");
      if (savedSettings) {
        setSystemSettings(JSON.parse(savedSettings));
      }
    }
  };

  const loadSystemInfo = async () => {
    try {
      console.log("Loading system information from API...");
      const systemInfoData = await adminService.getSystemInfo();
      setSystemInfo(systemInfoData);

      // Update system status with real data
      // Use NAS storage if available, otherwise use regular disk usage
      const storagePercent = systemInfoData.nasAvailable && systemInfoData.nasStorage
        ? systemInfoData.nasStorage.percentUsed
        : systemInfoData.diskUsage || 75;

      const diskUsageLabel = systemInfoData.nasAvailable && systemInfoData.nasStorage
        ? `${systemInfoData.nasStorage.used} / ${systemInfoData.nasStorage.total}`
        : systemInfoData.usedDisk !== undefined && systemInfoData.totalDisk !== undefined
          ? `${systemInfoData.usedDisk}GB / ${systemInfoData.totalDisk}GB`
          : "0 / 0 GB";

      setSystemStatus({
        database: systemInfoData.databaseStatus || "online",
        apiServer: systemInfoData.apiServerStatus || "running",
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

      console.log("System info loaded:", systemInfoData);
    } catch (error) {
      console.error("Error loading system information:", error);
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
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
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

      console.log("🔐 Attempting to change password...");

      // Change password using the admin service
      const response = await adminService.changeAdminPassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      console.log("✅ Password change successful:", response);

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
      console.error("❌ Error changing password:", error);
      console.error("Error details:", error);

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
      console.error("Error updating system settings:", error);
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
        console.error("Error updating maintenance mode:", error);
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
      console.error("Error exporting admin settings:", error);
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
        console.error("Error importing admin settings:", error);
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

  const handleSystemBackup = async () => {
    try {
      setSaving(true);
      toast.loading("Creating system backup...", { id: "backup" });

      const blob = await adminService.createSystemBackup();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `system-backup-${new Date().toISOString().split("T")[0]
        }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("System backup completed and downloaded!", {
        id: "backup",
      });
    } catch (error) {
      toast.error("Backup failed. Please try again.", { id: "backup" });
    } finally {
      setSaving(false);
    }
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
      console.error("Error uploading photo:", error);
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
      console.error("Error updating notification settings:", error);
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
      console.error("Error removing photo:", error);
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
          <div className="bg-white dark:bg-[#19191c] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-2">
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

                <div className="space-y-4 max-w-xl">
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
                        className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 ${errors.currentPassword
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
                        className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 ${errors.newPassword
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
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Must be at least 8 characters with uppercase, lowercase,
                      and numbers
                    </p>
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
                        className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 ${errors.confirmPassword
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
                </div>

                {/* Two-Factor Authentication Section */}
                <TwoFactorSettings />

                {/* Disable 2FA Modal */}


                <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">

                  <button
                    onClick={handlePasswordChange}
                    disabled={saving}
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div
                        className={`p-4 border rounded-lg ${systemStatus.database === "online"
                          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                          : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                          }`}
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <div
                            className={`w-3 h-3 rounded-full animate-pulse ${systemStatus.database === "online"
                              ? "bg-green-500"
                              : "bg-red-500"
                              }`}
                          ></div>
                          <span
                            className={`text-sm font-medium ${systemStatus.database === "online"
                              ? "text-green-800 dark:text-green-200"
                              : "text-red-800 dark:text-red-200"
                              }`}
                          >
                            Database
                          </span>
                        </div>
                        <p
                          className={`text-xs capitalize ${systemStatus.database === "online"
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                            }`}
                        >
                          {systemStatus.database}
                        </p>
                      </div>

                      <div
                        className={`p-4 border rounded-lg ${systemStatus.apiServer === "running"
                          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                          : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                          }`}
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <div
                            className={`w-3 h-3 rounded-full animate-pulse ${systemStatus.apiServer === "running"
                              ? "bg-green-500"
                              : "bg-red-500"
                              }`}
                          ></div>
                          <span
                            className={`text-sm font-medium ${systemStatus.apiServer === "running"
                              ? "text-green-800 dark:text-green-200"
                              : "text-red-800 dark:text-red-200"
                              }`}
                          >
                            API Server
                          </span>
                        </div>
                        <p
                          className={`text-xs capitalize ${systemStatus.apiServer === "running"
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                            }`}
                        >
                          {systemStatus.apiServer}
                        </p>
                      </div>

                      <div
                        className={`p-4 border rounded-lg ${!systemStatus.nasAvailable
                          ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                          : systemStatus.storage > 80
                            ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                            : systemStatus.storage > 60
                              ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                              : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                          }`}
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <div
                            className={`w-3 h-3 rounded-full ${!systemStatus.nasAvailable
                              ? "bg-orange-500 animate-pulse"
                              : systemStatus.storage > 80
                                ? "bg-red-500"
                                : systemStatus.storage > 60
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }`}
                          ></div>
                          <span
                            className={`text-sm font-medium ${!systemStatus.nasAvailable
                              ? "text-orange-800 dark:text-orange-200"
                              : systemStatus.storage > 80
                                ? "text-red-800 dark:text-red-200"
                                : systemStatus.storage > 60
                                  ? "text-yellow-800 dark:text-yellow-200"
                                  : "text-green-800 dark:text-green-200"
                              }`}
                          >
                            Storage
                          </span>
                          {!systemStatus.nasAvailable && (
                            <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 rounded">
                              Fallback Mode
                            </span>
                          )}
                        </div>
                        {!systemStatus.nasAvailable && (
                          <div className="mb-2 p-2.5 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-lg text-xs text-orange-800 dark:text-orange-200 leading-relaxed">
                            ⚠️ NAS Offline - Using Local Storage
                          </div>
                        )}
                        <p
                          className={`text-xs ${!systemStatus.nasAvailable
                            ? "text-orange-600 dark:text-orange-400"
                            : systemStatus.storage > 80
                              ? "text-red-600 dark:text-red-400"
                              : systemStatus.storage > 60
                                ? "text-yellow-600 dark:text-yellow-400"
                                : "text-green-600 dark:text-green-400"
                            }`}
                        >
                          {systemStatus.storage}% Used
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {systemStatus.diskUsageLabel}
                            {systemStatus.nasAvailable && systemStatus.nasStorage ? (
                              <span className="ml-1 text-blue-600 dark:text-blue-400 font-medium">
                                (NAS)
                              </span>
                            ) : (
                              <span className="ml-1 text-orange-600 dark:text-orange-400 font-medium">
                                (Local Fallback)
                              </span>
                            )}
                          </div>
                        </p>
                      </div>
                    </div>

                    {/* System Alerts */}
                    {systemAlerts && systemAlerts.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-semibold text-white mb-3 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-2 text-yellow-600" />
                          System Alerts ({systemAlerts.length})
                        </h4>
                        <div className="space-y-2">
                          {systemAlerts.map((alert: SystemAlert, index: number) => (
                            <div
                              key={index}
                              className={`p-3 border rounded-lg ${alert.type === 'critical'
                                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                : alert.type === 'warning'
                                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                }`}
                            >
                              <div className="flex items-start space-x-2">
                                {alert.type === 'critical' ? (
                                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                                ) : alert.type === 'warning' ? (
                                  <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                                ) : (
                                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={`text-sm font-medium ${alert.type === 'critical'
                                      ? 'text-red-800 dark:text-red-200'
                                      : alert.type === 'warning'
                                        ? 'text-yellow-800 dark:text-yellow-200'
                                        : 'text-blue-800 dark:text-blue-200'
                                      }`}
                                  >
                                    {alert.message}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {alert.component.toUpperCase()} • {new Date(alert.timestamp).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Detailed System Metrics */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Memory Usage Card */}
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Memory Usage
                          </span>
                          <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                            {systemInfo.memoryUsage || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mb-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${systemInfo.memoryUsage || 0}%`,
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          {systemInfo.usedMemory || 0}GB / {systemInfo.totalMemory || 0}GB
                        </p>
                        <p className="text-xs text-blue-500 dark:text-blue-500 mt-1 italic">
                          RAM allocated for system processes
                        </p>
                      </div>

                      {/* CPU Load Card */}
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                            CPU Load
                          </span>
                          <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                            {systemInfo.serverLoad || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2 mb-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${systemInfo.serverLoad || 0}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-purple-600 dark:text-purple-400">
                          {systemInfo.cpuModel || "Unknown"} ({systemInfo.cpuCount || 0} cores)
                        </p>
                        <p className="text-xs text-purple-500 dark:text-purple-500 mt-1 italic">
                          Processor utilization (1min avg: {systemInfo.loadAverage1min || "0.00"})
                        </p>
                      </div>

                      {/* Database Card */}
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-green-800 dark:text-green-200">
                            Database
                          </span>
                          <span className="text-xs text-green-600 dark:text-green-400 font-semibold">
                            {systemInfo.databaseStatus === 'online' ? '✓ Online' : '✗ Offline'}
                          </span>
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-400 mb-1">
                          Size: {systemInfo.databaseSize || '0 MB'}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          Users: {systemInfo.activeUsers || 0} | Docs: {systemInfo.totalDocuments || 0}
                        </p>
                        <p className="text-xs text-green-500 dark:text-green-500 mt-1 italic">
                          PostgreSQL database storage
                        </p>
                      </div>

                      {/* System Uptime Card */}
                      <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                            System Uptime
                          </span>
                          <span className="text-xs text-orange-600 dark:text-orange-400 font-semibold">
                            {systemInfo.systemUptime || "0 days, 0 hours"}
                          </span>
                        </div>
                        <p className="text-xs text-orange-600 dark:text-orange-400">
                          Version: {systemInfo.version || "2.1.3"}
                        </p>
                        <p className="text-xs text-orange-600 dark:text-orange-400">
                          Environment: {systemInfo.environment || "production"}
                        </p>
                        <p className="text-xs text-orange-500 dark:text-orange-500 mt-1 italic">
                          Server runtime since last restart
                        </p>
                      </div>
                    </div>

                    {/* Storage Information */}
                    {systemInfo.nasAvailable && systemInfo.nasStorage && (
                      <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
                            NAS Storage
                          </span>
                          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                            {systemInfo.nasStorage.percentUsed}% Used
                          </span>
                        </div>
                        <div className="w-full bg-indigo-200 dark:bg-indigo-800 rounded-full h-2 mb-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${systemInfo.nasStorage.percentUsed}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400">
                          {systemInfo.nasStorage.used} / {systemInfo.nasStorage.total}
                          {systemInfo.nasStorage.free && ` (${systemInfo.nasStorage.free} free)`}
                        </p>
                        <p className="text-xs text-indigo-500 dark:text-indigo-500 mt-1 italic">
                          Network Attached Storage for documents and files
                        </p>
                      </div>
                    )}

                    {/* Disk Usage (if NAS not available) */}
                    {!systemInfo.nasAvailable && (
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                            Disk Usage
                          </span>
                          <span className="text-xs text-gray-700 dark:text-gray-400 font-semibold">
                            {systemInfo.diskUsage || 0}% Used
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 mb-2">
                          <div
                            className="bg-green-500 dark:bg-gray-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${systemInfo.diskUsage || 0}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {systemStatus.diskUsageLabel || (systemInfo.usedDisk !== undefined && systemInfo.totalDisk !== undefined
                            ? `${systemInfo.usedDisk}GB / ${systemInfo.totalDisk}GB`
                            : 'N/A')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">
                          Local server disk storage
                        </p>
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
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Maintenance Mode
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Temporarily disable system access
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            setSystemSettings({
                              ...systemSettings,
                              maintenanceMode: !systemSettings.maintenanceMode,
                            })
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${systemSettings.maintenanceMode
                            ? "bg-red-600"
                            : "bg-gray-600"
                            }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${systemSettings.maintenanceMode
                              ? "translate-x-6"
                              : "translate-x-1"
                              }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Auto Backup
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Automatically backup system data
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            setSystemSettings({
                              ...systemSettings,
                              autoBackup: !systemSettings.autoBackup,
                            })
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${systemSettings.autoBackup
                            ? "bg-green-600"
                            : "bg-gray-600"
                            }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${systemSettings.autoBackup
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

                    <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-red-800 dark:text-red-200">
                          System Maintenance Mode
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400">
                          {systemSettings.maintenanceMode
                            ? "System is currently in maintenance mode"
                            : "System is running normally"}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <button
                        onClick={handleSystemBackup}
                        disabled={saving}
                        className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:shadow-md transition-shadow disabled:opacity-50"
                      >
                        <Database className="w-5 h-5 text-blue-600" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Create Backup
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            Backup system data
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={handleClearCache}
                        disabled={saving}
                        className="flex items-center space-x-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg hover:shadow-md transition-shadow disabled:opacity-50"
                      >
                        <SettingsIcon className="w-5 h-5 text-yellow-600" />
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
                        <SettingsIcon className="w-5 h-5 text-red-600" />
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
                        <SettingsIcon className="w-5 h-5 text-green-600" />
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
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                        <Mail className="w-5 h-5 mr-2 text-purple-600" />
                        Email Service Testing
                      </h3>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      Test your email service configuration and send a test email to verify everything is working correctly.
                    </p>

                    <div className="space-y-4">
                      {/* Test Connection Button */}
                      <div className="flex items-center space-x-4">
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
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                          <div className={`flex items-center space-x-2 ${emailTestResult.success ? "text-green-600" : "text-red-600"
                            }`}>
                            {emailTestResult.success ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : (
                              <AlertCircle className="w-5 h-5" />
                            )}
                            <span className="text-sm font-medium">
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
                        <div className="flex items-center space-x-3">
                          <input
                            type="email"
                            value={emailTestEmail}
                            onChange={(e) => setEmailTestEmail(e.target.value)}
                            placeholder="Enter email address to test"
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
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
                            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                          <div className={`flex items-center space-x-2 p-3 rounded-lg ${emailTestResult.success
                            ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                            : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                            }`}>
                            {emailTestResult.success ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : (
                              <AlertCircle className="w-5 h-5" />
                            )}
                            <span className="text-sm font-medium">
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

                  {/* System Information */}

                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Database className="w-5 h-5 mr-2 text-gray-600" />
                      System Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <p>
                          <span className="font-medium">Version:</span>{" "}
                          {systemInfo.version || "2.1.3"}
                        </p>
                        <p>
                          <span className="font-medium">Last Updated:</span>{" "}
                          {systemInfo.lastUpdated
                            ? new Date(systemInfo.lastUpdated).toLocaleString()
                            : "N/A"}
                        </p>
                        <p>
                          <span className="font-medium">Database Size:</span>{" "}
                          {systemInfo.databaseSize || "0 MB"}
                          {systemInfo.databaseSizeBytes && (
                            <span className="text-xs text-gray-500 ml-1">
                              ({Math.round(systemInfo.databaseSizeBytes / 1024 / 1024)} MB)
                            </span>
                          )}
                        </p>
                        <p>
                          <span className="font-medium">Database Status:</span>{" "}
                          <span className={systemInfo.databaseStatus === 'online' ? 'text-green-600' : 'text-red-600'}>
                            {systemInfo.databaseStatus === 'online' ? '✓ Online' : '✗ Offline'}
                          </span>
                        </p>
                        <p>
                          <span className="font-medium">Server Load:</span>{" "}
                          {systemInfo.serverLoad || 0}%
                          {systemInfo.loadAverage1min && (
                            <span className="text-xs text-gray-500 ml-1">
                              (1min: {systemInfo.loadAverage1min}, 5min: {systemInfo.loadAverage5min}, 15min: {systemInfo.loadAverage15min})
                            </span>
                          )}
                        </p>
                        <p>
                          <span className="font-medium">CPU:</span>{" "}
                          {systemInfo.cpuModel || "Unknown"} ({systemInfo.cpuCount || 0} cores)
                        </p>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <p>
                          <span className="font-medium">Active Users:</span>{" "}
                          {systemInfo.activeUsers || 0}
                        </p>
                        <p>
                          <span className="font-medium">Total Documents:</span>{" "}
                          {systemInfo.totalDocuments?.toLocaleString() || 0}
                        </p>
                        <p>
                          <span className="font-medium">System Uptime:</span>{" "}
                          {systemInfo.systemUptime || "0 days, 0 hours"}
                        </p>
                        <p>
                          <span className="font-medium">Memory Usage:</span>{" "}
                          {systemInfo.memoryUsage || 0}%
                          {systemInfo.usedMemory !== undefined && systemInfo.totalMemory !== undefined && (
                            <span className="text-xs text-gray-500 ml-1">
                              ({systemInfo.usedMemory}GB / {systemInfo.totalMemory}GB)
                            </span>
                          )}
                        </p>
                        <p>
                          <span className="font-medium">Disk Usage:</span>{" "}
                          {systemInfo.usedDisk !== undefined &&
                            systemInfo.totalDisk !== undefined
                            ? `${systemInfo.usedDisk}GB / ${systemInfo.totalDisk}GB (${systemInfo.diskUsage || 0}%)`
                            : `${systemInfo.diskUsage || 0}%`}
                        </p>
                        <p>
                          <span className="font-medium">Platform:</span>{" "}
                          {systemInfo.platform || "Unknown"} ({systemInfo.arch || "Unknown"})
                        </p>
                        <p>
                          <span className="font-medium">Node.js:</span>{" "}
                          {systemInfo.nodeVersion || "Unknown"}
                        </p>
                        <p>
                          <span className="font-medium">Environment:</span>{" "}
                          <span className="uppercase">{systemInfo.environment || "production"}</span>
                        </p>
                      </div>
                    </div>
                  </div>

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
                  <h3 className="text-lg font-semibold text-white mb-4">
                    System Information
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p>
                      <span className="font-medium">Version:</span> 1.0.0
                    </p>
                    <p>
                      <span className="font-medium">Last Updated:</span> December
                      2025
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
                  Open Admin Settings → System to view live metrics, trigger
                  backups, clear cache, or restart services.
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
                  Schedule backups from System Actions and store them securely.
                  Clear cache or restart backend services after major updates.
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
                  databases hosted on Render. Backups are generated manually via
                  the System tab.
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
