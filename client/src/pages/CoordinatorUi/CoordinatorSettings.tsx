import { useState, useEffect } from "react";
import {
  User,
  Lock,
  Bell,
  Moon,
  Sun,
  Globe,
  Calendar,
  HelpCircle,
  Shield,
  Mail,
  Phone,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  Camera,
  Loader2,
  AlertCircle,
  FileText,
  Settings,
  Activity,
  Download,
  Upload,
  Palette,
  Monitor,
} from "lucide-react";
import {
  settingsService,
  type UserProfile,
  type PasswordChangeData,
  type NotificationPreferences,
  type AppPreferences,
} from "../../services/settingsService";
import toast from "react-hot-toast";

interface CoordinatorSettingsTabProps {
  onProfileUpdate?: () => void;
}

const CoordinatorSettingsTab = ({
  onProfileUpdate,
}: CoordinatorSettingsTabProps) => {
  const [activeSection, setActiveSection] = useState("profile");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(
    null
  );

  // Form states
  const [profileData, setProfileData] = useState<UserProfile>({
    id: "",
    name: "",
    email: "",
    phone: "",
    emergencyContact: "",
    emergencyName: "",
  });

  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notifications, setNotifications] = useState<NotificationPreferences>({
    emailDocuments: true,
    emailAttendance: true,
    emailAnnouncements: true,
    pushNotifications: true,
    smsAlerts: false,
  });

  const [preferences, setPreferences] = useState<AppPreferences>({
    language: "en",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12hr",
    theme: "auto",
  });

  // Coordinator-specific settings
  const [coordinatorSettings, setCoordinatorSettings] = useState({
    autoApproveDocuments: false,
    requireDocumentReview: true,
    attendanceReminderTime: "09:00",
    defaultAnnouncementAudience: "ALL",
    enableBulkOperations: true,
    showAdvancedMetrics: false,
    notificationFrequency: "immediate", // immediate, daily, weekly
  });

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
    loadPreferences();
    loadCoordinatorSettings();
  }, []);

  // Cleanup preview URL on unmount (only for object URLs, not base64)
  useEffect(() => {
    return () => {
      if (profilePhotoPreview && profilePhotoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(profilePhotoPreview);
      }
    };
  }, [profilePhotoPreview]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const userProfile = await settingsService.getCurrentUserProfile();
      setProfileData({
        ...userProfile,
        name: userProfile.name,
      });

      // Load profile photo from server
      try {
        const serverPhoto = await settingsService.getProfilePhoto();
        if (serverPhoto) {
          setProfilePhotoPreview(serverPhoto);
        }
      } catch (error) {
        console.error("Error loading profile photo in settings:", error);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      toast.error("Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  const loadPreferences = async () => {
    const notificationPrefs = settingsService.loadNotificationPreferences();
    const appPrefs = settingsService.loadAppPreferences();

    setNotifications(notificationPrefs);
    setPreferences(appPrefs);

    // Load theme from preferences
    const savedTheme =
      (appPrefs.theme as "light" | "dark" | "system") || "system";
    setTheme(savedTheme);

    // Apply the theme immediately
    settingsService.applyTheme(savedTheme === "system" ? "auto" : savedTheme);

    // Load saved profile photo from server
    try {
      const serverPhoto = await settingsService.getProfilePhoto();
      if (serverPhoto) {
        setProfilePhotoPreview(serverPhoto);
      }
    } catch (error) {
      console.error("Error loading profile photo in settings:", error);
    }
  };

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);

    // Update preferences
    const updatedPreferences = {
      ...preferences,
      theme: newTheme,
    };
    setPreferences(updatedPreferences);

    // Save to localStorage
    settingsService.saveAppPreferences(updatedPreferences);

    // Apply theme immediately
    settingsService.applyTheme(newTheme === "system" ? "auto" : newTheme);
  };

  const loadCoordinatorSettings = () => {
    // Load coordinator-specific settings from localStorage
    const saved = localStorage.getItem("coordinatorSettings");
    if (saved) {
      try {
        setCoordinatorSettings(JSON.parse(saved));
      } catch (error) {
        console.error("Error loading coordinator settings:", error);
      }
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setErrors({});

      // Validate email
      if (!settingsService.validateEmail(profileData.email)) {
        setErrors({ email: "Please enter a valid email address" });
        return;
      }

      // Validate phone if provided
      if (
        profileData.phone &&
        !settingsService.validatePhone(profileData.phone)
      ) {
        setErrors({ phone: "Please enter a valid phone number" });
        return;
      }

      await settingsService.updateProfile({
        name: profileData.name,
        email: profileData.email,
      });

      // Reload user data to get the latest information
      await loadUserData();

      // Update localStorage with new user data
      const updatedUserData = await settingsService.getCurrentUserProfile();
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const updatedUser = { ...currentUser, ...updatedUserData };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      // Notify parent component to refresh dashboard data
      if (onProfileUpdate) {
        onProfileUpdate();
      }

      setSaveSuccess(true);
      toast.success("Profile updated successfully");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setSaving(true);
      setErrors({});

      // Validate passwords
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setErrors({ confirmPassword: "Passwords do not match" });
        return;
      }

      const passwordValidation = settingsService.validatePassword(
        passwordData.newPassword
      );
      if (!passwordValidation.isValid) {
        setErrors({ newPassword: passwordValidation.errors.join(", ") });
        return;
      }

      await settingsService.changePassword(passwordData);

      setSaveSuccess(true);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success("Password changed successfully");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = () => {
    settingsService.saveNotificationPreferences(notifications);
    setSaveSuccess(true);
    toast.success("Notification preferences saved");
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSavePreferences = () => {
    settingsService.saveAppPreferences(preferences);
    settingsService.applyTheme(preferences.theme);
    setSaveSuccess(true);
    toast.success("Preferences saved");
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSaveCoordinatorSettings = () => {
    localStorage.setItem(
      "coordinatorSettings",
      JSON.stringify(coordinatorSettings)
    );
    setSaveSuccess(true);
    toast.success("Coordinator settings saved");
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleRemovePhoto = async () => {
    try {
      await settingsService.removeProfilePhoto();
      setProfilePhotoPreview(null);

      // Dispatch custom event to notify other components
      window.dispatchEvent(
        new CustomEvent("profilePhotoUpdated", {
          detail: { photoUrl: null },
        })
      );

      toast.success("Profile photo removed successfully!");
    } catch (error) {
      console.error("Error removing photo:", error);
      toast.error("Failed to remove profile photo");
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
      setProfilePhotoPreview(photoUrl);

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
      // Clear preview on error
      setProfilePhotoPreview(null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleExportData = () => {
    // Export coordinator data
    const exportData = {
      profile: profileData,
      settings: coordinatorSettings,
      preferences: preferences,
      notifications: notifications,
      exportDate: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `coordinator-settings-${
      new Date().toISOString().split("T")[0]
    }.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success("Settings exported successfully!");
  };

  const sections = [
    { id: "profile", label: "Profile Information", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "preferences", label: "Preferences", icon: Globe },
    { id: "coordinator", label: "Coordinator Settings", icon: Settings },
    { id: "help", label: "Help & Support", icon: HelpCircle },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
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
            {/* Profile Information - Same as Student */}
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

                {/* Profile Picture */}
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-24 h-24 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center overflow-hidden">
                      {profilePhotoPreview ? (
                        <img
                          src={profilePhotoPreview}
                          alt="Profile preview"
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
                    <label className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium cursor-pointer transition-colors inline-block">
                      {uploadingPhoto ? (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading...</span>
                        </div>
                      ) : (
                        "Change Photo"
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
                    {profilePhotoPreview && (
                      <button
                        onClick={handleRemovePhoto}
                        className="mt-2 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          name: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-2 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 ${
                        errors.name
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          email: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-2 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 ${
                        errors.email
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone || ""}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          phone: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-2 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 ${
                        errors.phone
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      placeholder="Optional"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Emergency Contact
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Contact Name
                      </label>
                      <input
                        type="text"
                        value={profileData.emergencyName || ""}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            emergencyName: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                        placeholder="Optional"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Contact Number
                      </label>
                      <input
                        type="tel"
                        value={profileData.emergencyContact || ""}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            emergencyContact: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    className="flex items-center space-x-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            )}

            {/* Security - Same as Student */}
            {activeSection === "security" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    Security Settings
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manage your password and security preferences
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            currentPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                      />
                      <button
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
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                      />
                      <button
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
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Two-Factor Authentication
                  </h3>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Enable 2FA
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Add an extra layer of security
                        </p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium">
                      Enable
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleChangePassword}
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

            {/* Notifications - Enhanced for Coordinator */}
            {activeSection === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    Notification Preferences
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Choose how you want to be notified
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Document Approvals
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Get notified when documents are approved or rejected
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.emailDocuments}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            emailDocuments: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Attendance Alerts
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Get notified about attendance issues and anomalies
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.emailAttendance}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            emailAttendance: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        System Announcements
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Important system updates and maintenance notices
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.emailAnnouncements}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            emailAnnouncements: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Push Notifications
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Receive push notifications in browser
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.pushNotifications}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            pushNotifications: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        SMS Alerts
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Critical updates via text message
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.smsAlerts}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            smsAlerts: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveNotifications}
                    className="flex items-center space-x-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Preferences</span>
                  </button>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
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
                            Follows system preference
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

                <div className="flex justify-end">
                  <button
                    onClick={handleSavePreferences}
                    className="flex items-center space-x-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            )}

            {/* Preferences - Same as Student */}
            {activeSection === "preferences" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    General Preferences
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Customize your portal experience
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Globe className="w-4 h-4 inline mr-1" />
                      Language
                    </label>
                    <select
                      value={preferences.language}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          language: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="en">English</option>
                      <option value="fil">Filipino</option>
                      <option value="es">Spanish</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Date Format
                    </label>
                    <select
                      value={preferences.dateFormat}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          dateFormat: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Time Format
                    </label>
                    <select
                      value={preferences.timeFormat}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          timeFormat: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="12hr">12 Hour (AM/PM)</option>
                      <option value="24hr">24 Hour</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSavePreferences}
                    className="flex items-center space-x-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Preferences</span>
                  </button>
                </div>
              </div>
            )}

            {/* Coordinator Settings - NEW */}
            {activeSection === "coordinator" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    Coordinator Settings
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manage coordinator-specific preferences and workflows
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Document Management */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-purple-600" />
                      Document Management
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Auto-approve Documents
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Automatically approve documents that meet criteria
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={coordinatorSettings.autoApproveDocuments}
                            onChange={(e) =>
                              setCoordinatorSettings({
                                ...coordinatorSettings,
                                autoApproveDocuments: e.target.checked,
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Require Document Review
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            All documents must be manually reviewed
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={coordinatorSettings.requireDocumentReview}
                            onChange={(e) =>
                              setCoordinatorSettings({
                                ...coordinatorSettings,
                                requireDocumentReview: e.target.checked,
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Management */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Activity className="w-5 h-5 mr-2 text-green-600" />
                      Attendance Management
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Attendance Reminder Time
                        </label>
                        <input
                          type="time"
                          value={coordinatorSettings.attendanceReminderTime}
                          onChange={(e) =>
                            setCoordinatorSettings({
                              ...coordinatorSettings,
                              attendanceReminderTime: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Time to send daily attendance reminders
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Announcement Settings */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Bell className="w-5 h-5 mr-2 text-blue-600" />
                      Announcement Settings
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Default Announcement Audience
                        </label>
                        <select
                          value={
                            coordinatorSettings.defaultAnnouncementAudience
                          }
                          onChange={(e) =>
                            setCoordinatorSettings({
                              ...coordinatorSettings,
                              defaultAnnouncementAudience: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="ALL">All Users</option>
                          <option value="STUDENTS">Students Only</option>
                          <option value="COORDINATORS">
                            Coordinators Only
                          </option>
                          <option value="INSTRUCTORS">Instructors Only</option>
                          <option value="INDUSTRY_PARTNERS">
                            Industry Partners Only
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* System Preferences */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Settings className="w-5 h-5 mr-2 text-orange-600" />
                      System Preferences
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Enable Bulk Operations
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Allow bulk approval/rejection of documents
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={coordinatorSettings.enableBulkOperations}
                            onChange={(e) =>
                              setCoordinatorSettings({
                                ...coordinatorSettings,
                                enableBulkOperations: e.target.checked,
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Show Advanced Metrics
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Display detailed analytics and reports
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={coordinatorSettings.showAdvancedMetrics}
                            onChange={(e) =>
                              setCoordinatorSettings({
                                ...coordinatorSettings,
                                showAdvancedMetrics: e.target.checked,
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Notification Frequency
                        </label>
                        <select
                          value={coordinatorSettings.notificationFrequency}
                          onChange={(e) =>
                            setCoordinatorSettings({
                              ...coordinatorSettings,
                              notificationFrequency: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="immediate">Immediate</option>
                          <option value="daily">Daily Summary</option>
                          <option value="weekly">Weekly Summary</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveCoordinatorSettings}
                    className="flex items-center space-x-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Coordinator Settings</span>
                  </button>
                </div>
              </div>
            )}

            {/* Help & Support - Same as Student */}
            {activeSection === "help" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    Help & Support
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get help and learn more about the portal
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a
                    href="#"
                    className="p-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <HelpCircle className="w-8 h-8 text-purple-600 mb-3" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      FAQ
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Find answers to common questions
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
                      Email: support@intrak.edu
                    </p>
                  </a>

                  <a
                    href="#"
                    className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <FileText className="w-8 h-8 text-green-600 mb-3" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Coordinator Guide
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Learn how to use coordinator features
                    </p>
                  </a>

                  <a
                    href="#"
                    className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <Shield className="w-8 h-8 text-yellow-600 mb-3" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Privacy Policy
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Read our privacy terms
                    </p>
                  </a>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    App Information
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

export default CoordinatorSettingsTab;
