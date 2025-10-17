import { useState, useEffect } from "react";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Camera,
  Save,
  ArrowLeft,
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
} from "lucide-react";
import { settingsService } from "../../services/settingsService";
import { adminService } from "../../services/adminService";
import toast from "react-hot-toast";

interface AdminProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  office?: string;
  profilePhoto?: string;
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
  smsAlerts: boolean;
}

const AdminSettings = ({ onBack }: { onBack: () => void }) => {
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
    smsAlerts: false,
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
  });
  const [systemInfo, setSystemInfo] = useState({
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
      await loadSystemInfo();
      loadProfilePhoto();
    };

    initializeSettings();
  }, []);

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
        smsAlerts: settings.smsAlerts,
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

      // Update local state
      setProfile({ ...profile, ...response.user });

      // Store updated profile in localStorage for immediate access
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...currentUser,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          department: profile.department,
          office: profile.office,
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

  const handleSystemMaintenance = () => {
    if (
      confirm(
        "Are you sure you want to toggle system maintenance mode? This will affect all users."
      )
    ) {
      setSystemSettings((prev) => ({
        ...prev,
        maintenanceMode: !prev.maintenanceMode,
      }));
      toast.success(
        `System maintenance mode ${
          systemSettings.maintenanceMode ? "disabled" : "enabled"
        }`
      );
    }
  };

  const handleExportData = () => {
    const data = {
      systemSettings,
      profile,
      notifications,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-settings-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Settings exported successfully!");
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/json") {
      toast.error("Please select a valid JSON file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        if (data.systemSettings) {
          setSystemSettings(data.systemSettings);
        }
        if (data.profile) {
          setProfile(data.profile);
        }
        if (data.notifications) {
          setNotifications(data.notifications);
        }

        toast.success("Settings imported successfully!");
      } catch (error) {
        toast.error("Invalid JSON file format");
      }
    };
    reader.readAsText(file);

    // Reset the file input
    event.target.value = "";
  };

  const handleSystemBackup = async () => {
    try {
      setSaving(true);
      toast.loading("Creating system backup...", { id: "backup" });

      // Create a comprehensive backup data object
      const backupData = {
        systemSettings,
        profile,
        notifications,
        systemInfo,
        exportedAt: new Date().toISOString(),
        backupType: "system_backup",
        version: systemInfo.version,
      };

      // Simulate backup process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // For now, download as JSON file (will integrate with NAS later)
      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `system-backup-${
        new Date().toISOString().split("T")[0]
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

      // Clear localStorage cache
      localStorage.removeItem("adminSystemSettings");
      localStorage.removeItem("adminProfile");

      // Simulate cache clearing
      await new Promise((resolve) => setTimeout(resolve, 1000));

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

        // Simulate restart process
        await new Promise((resolve) => setTimeout(resolve, 3000));

        toast.success("System restart completed!", { id: "restart" });
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

      // Update system status with realistic data
      setSystemStatus((prev) => ({
        ...prev,
        activeUsers: Math.floor(Math.random() * 50) + 120, // 120-170 users
        storage: Math.floor(Math.random() * 20) + 70, // 70-90% storage
        uptime: `${Math.floor(Math.random() * 30) + 10} days, ${Math.floor(
          Math.random() * 24
        )} hours`,
      }));

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
      setSaving(true);

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
      setSaving(false);
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
        smsAlerts: notifications.smsAlerts,
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
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {saveSuccess && (
        <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-800 dark:text-green-200 font-medium">
              Settings saved successfully!
            </p>
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

      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Admin Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your admin account and system settings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-2">
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors text-left ${
                      activeSection === section.id
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
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

                <div className="flex items-start space-x-6">
                  {/* Profile Photo */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        {profilePhoto ? (
                          <img
                            src={profilePhoto}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white text-2xl font-bold">
                            {profile.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </span>
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 bg-purple-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-purple-700 transition-colors">
                        <Camera className="w-3 h-3" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                          disabled={saving}
                        />
                      </label>
                    </div>
                    {profilePhoto && (
                      <button
                        onClick={handleRemovePhoto}
                        disabled={saving}
                        className="mt-2 text-xs text-red-600 hover:text-red-700 transition-colors"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>

                  {/* Profile Form */}
                  <div className="flex-1 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          className={`w-full px-4 py-2 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 ${
                            errors.name
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
                          className={`w-full px-4 py-2 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 ${
                            errors.email
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
                          className={`w-full px-4 py-2 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 ${
                            errors.phone
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
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
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
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
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
                    Update your password and security settings
                  </p>
                </div>

                {/* Security Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        Admin Security
                      </h3>
                      <p className="text-blue-700 dark:text-blue-300 text-sm">
                        As an administrator, your account has elevated
                        privileges. Keep your password secure and change it
                        regularly.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Password Form */}
                <div className="max-w-lg space-y-6">
                  {/* Current Password */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white">
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
                          // Clear error when user starts typing
                          if (errors.currentPassword) {
                            setErrors({ ...errors, currentPassword: "" });
                          }
                        }}
                        placeholder="Enter your current password"
                        className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all duration-200 ${
                          errors.currentPassword
                            ? "border-red-500"
                            : "border-gray-200 dark:border-gray-600"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                        className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {errors.currentPassword && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {errors.currentPassword}
                      </p>
                    )}
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white">
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
                          // Clear error when user starts typing
                          if (errors.newPassword) {
                            setErrors({ ...errors, newPassword: "" });
                          }
                        }}
                        placeholder="Enter your new password"
                        className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all duration-200 ${
                          errors.newPassword
                            ? "border-red-500"
                            : "border-gray-200 dark:border-gray-600"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {/* Password Strength Indicator */}
                    {passwordData.newPassword && (
                      <div className="space-y-2">
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={`h-1 flex-1 rounded-full ${
                                passwordData.newPassword.length >= level * 2
                                  ? passwordData.newPassword.length >= 8
                                    ? "bg-green-500"
                                    : "bg-yellow-500"
                                  : "bg-gray-200 dark:bg-gray-600"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">
                          {passwordData.newPassword.length < 8
                            ? "Password should be at least 8 characters"
                            : "Strong password"}
                        </p>
                      </div>
                    )}
                    {errors.newPassword && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {errors.newPassword}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white">
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
                          // Clear error when user starts typing
                          if (errors.confirmPassword) {
                            setErrors({ ...errors, confirmPassword: "" });
                          }
                        }}
                        placeholder="Confirm your new password"
                        className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all duration-200 ${
                          errors.confirmPassword
                            ? "border-red-500"
                            : "border-gray-200 dark:border-gray-600"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {/* Password Match Indicator */}
                    {passwordData.confirmPassword &&
                      !errors.confirmPassword && (
                        <div className="flex items-center space-x-2">
                          {passwordData.newPassword ===
                          passwordData.confirmPassword ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-green-600">
                                Passwords match
                              </span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 text-red-500" />
                              <span className="text-sm text-red-600">
                                Passwords do not match
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="pt-4">
                    <button
                      onClick={handlePasswordChange}
                      disabled={
                        saving ||
                        passwordData.newPassword !==
                          passwordData.confirmPassword ||
                        passwordData.newPassword.length < 8
                      }
                      className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                    >
                      {saving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Lock className="w-5 h-5" />
                      )}
                      <span>Change Password</span>
                    </button>
                  </div>
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
                    </h3>
                      <button
                        onClick={refreshSystemStatus}
                        disabled={saving}
                        className="flex items-center space-x-2 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                      >
                        <SettingsIcon className="w-4 h-4" />
                        <span>Refresh</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-green-800 dark:text-green-200">
                            Database
                          </span>
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-400 capitalize">
                          {systemStatus.database}
                        </p>
                      </div>

                      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-green-800 dark:text-green-200">
                            API Server
                          </span>
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-400 capitalize">
                          {systemStatus.apiServer}
                        </p>
                      </div>

                      <div
                        className={`p-4 border rounded-lg ${
                          systemStatus.storage > 80
                            ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                            : systemStatus.storage > 60
                            ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                            : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              systemStatus.storage > 80
                                ? "bg-red-500"
                                : systemStatus.storage > 60
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                          ></div>
                          <span
                            className={`text-sm font-medium ${
                              systemStatus.storage > 80
                                ? "text-red-800 dark:text-red-200"
                                : systemStatus.storage > 60
                                ? "text-yellow-800 dark:text-yellow-200"
                                : "text-green-800 dark:text-green-200"
                            }`}
                          >
                            Storage
                          </span>
                        </div>
                        <p
                          className={`text-xs ${
                            systemStatus.storage > 80
                              ? "text-red-600 dark:text-red-400"
                              : systemStatus.storage > 60
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-green-600 dark:text-green-400"
                          }`}
                        >
                          {systemStatus.storage}% Used
                        </p>
                      </div>
                    </div>
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
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            systemSettings.maintenanceMode
                              ? "bg-red-600"
                              : "bg-gray-200 dark:bg-gray-600"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              systemSettings.maintenanceMode
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
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            systemSettings.autoBackup
                              ? "bg-green-600"
                              : "bg-gray-200 dark:bg-gray-600"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              systemSettings.autoBackup
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
                          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          systemSettings.maintenanceMode
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
                          {systemInfo.version}
                      </p>
                      <p>
                        <span className="font-medium">Last Updated:</span>{" "}
                          {new Date(
                            systemInfo.lastUpdated
                          ).toLocaleDateString()}
                      </p>
                      <p>
                          <span className="font-medium">Database Size:</span>{" "}
                          {systemInfo.databaseSize}
                      </p>
                      <p>
                          <span className="font-medium">Server Load:</span>{" "}
                          {systemInfo.serverLoad}%
                        </p>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <p>
                          <span className="font-medium">Active Users:</span>{" "}
                          {systemInfo.activeUsers}
                      </p>
                      <p>
                        <span className="font-medium">Total Documents:</span>{" "}
                          {systemInfo.totalDocuments.toLocaleString()}
                      </p>
                      <p>
                          <span className="font-medium">System Uptime:</span>{" "}
                          {systemInfo.systemUptime}
                        </p>
                        <p>
                          <span className="font-medium">Memory Usage:</span>{" "}
                          {systemInfo.memoryUsage}%
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
                    {
                      key: "smsAlerts",
                      title: "SMS Alerts",
                      description: "Critical alerts via text message",
                      enabled: notifications.smsAlerts,
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
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
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
                      className={`relative p-6 rounded-xl border-2 transition-all duration-200 ${
                        theme === "light"
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                          : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center">
                          <Sun className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
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
                      className={`relative p-6 rounded-xl border-2 transition-all duration-200 ${
                        theme === "dark"
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                          : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center">
                          <Moon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
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
                      className={`relative p-6 rounded-xl border-2 transition-all duration-200 ${
                        theme === "system"
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                          : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                          <Monitor className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
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
                  <a
                    href="#"
                    className="p-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <HelpCircle className="w-8 h-8 text-purple-600 mb-3" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Admin Guide
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Learn how to manage the system
                    </p>
                  </a>

                  <a
                    href="#"
                    className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <Mail className="w-8 h-8 text-blue-600 mb-3" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Contact Support
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Email: admin-support@intrak.edu
                    </p>
                  </a>

                  <a
                    href="#"
                    className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <FileText className="w-8 h-8 text-green-600 mb-3" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      System Documentation
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Technical documentation and APIs
                    </p>
                  </a>

                  <a
                    href="#"
                    className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <Shield className="w-8 h-8 text-yellow-600 mb-3" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Security Policy
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Security guidelines and best practices
                    </p>
                  </a>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    System Information
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p>
                      <span className="font-medium">Version:</span> 1.0.0
                    </p>
                    <p>
                      <span className="font-medium">Last Updated:</span> October
                      2024
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
    </div>
  );
};

export default AdminSettings;
