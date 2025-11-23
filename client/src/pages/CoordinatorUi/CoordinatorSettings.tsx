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
  //Upload,
  Palette,
  Monitor,
  Clock,
  Megaphone,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  settingsService,
  type UserProfile,
  type PasswordChangeData,
  type NotificationPreferences,
  type AppPreferences,
} from "../../services/settingsService";
import {
  coordinatorService,
  type CoordinatorSettings as CoordinatorSettingsResponse,
} from "../../services/coordinatorService";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface CoordinatorSettingsTabProps {
  onProfileUpdate?: () => void;
  onCoordinatorSettingsUpdate?: (settings: CoordinatorSettingsResponse) => void;
}

const CoordinatorSettingsTab = ({
  onProfileUpdate,
  onCoordinatorSettingsUpdate,
}: CoordinatorSettingsTabProps) => {
  const { t, i18n } = useTranslation();
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

  const [helpModal, setHelpModal] = useState<"faq" | "guide" | "privacy" | null>(
    null
  );

  const closeHelpModal = () => setHelpModal(null);

  // Coordinator-specific settings
  const [coordinatorSettings, setCoordinatorSettings] = useState<CoordinatorSettingsResponse>({
    autoApproveDocuments: false,
    requireDocumentReview: true,
    attendanceReminderTime: "09:00",
    defaultAnnouncementAudience: "ALL",
    enableBulkOperations: true,
    showAdvancedMetrics: false,
    notificationFrequency: "immediate",
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

    // Load saved profile photo from server
    try {
      const serverPhoto = await settingsService.getProfilePhoto();
      if (serverPhoto) {
        setProfilePhotoPreview(serverPhoto);
      }
    } catch (error) {
      console.error("Error loading profile photo in settings:", error);
    }

    const language = (appPrefs.language as string) || "en";
    i18n.changeLanguage(language);
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

  const loadCoordinatorSettings = async () => {
    try {
      const settings = await coordinatorService.getCoordinatorSettings();
      setCoordinatorSettings(settings);
      onCoordinatorSettingsUpdate?.(settings);
    } catch (error) {
      console.error("Error loading coordinator settings:", error);
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

      const updatedProfile = await settingsService.updateProfile({
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        emergencyContact: profileData.emergencyContact,
        emergencyName: profileData.emergencyName,
      });

      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const updatedUser = { ...currentUser, ...updatedProfile };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      window.dispatchEvent(
        new CustomEvent("profileUpdated", {
          detail: {
            user: updatedUser,
          },
        })
      );

      await loadUserData();

      // Notify parent component to refresh dashboard data
      if (onProfileUpdate) {
        onProfileUpdate();
      }

      setSaveSuccess(true);
      toast.success(t("settings.saved"));
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
      toast.success(t("settings.security.passwordChanged"));
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
    toast.success(t("settings.notifications.saved"));
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSavePreferences = () => {
    settingsService.saveAppPreferences(preferences);
    settingsService.applyTheme(preferences.theme);
    i18n.changeLanguage(preferences.language);
    setSaveSuccess(true);
    toast.success(t("settings.preferences.saved"));
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSaveCoordinatorSettings = async () => {
    try {
      setSaving(true);
      const updated = await coordinatorService.updateCoordinatorSettings(
        coordinatorSettings,
      );
      setCoordinatorSettings(updated);
      onCoordinatorSettingsUpdate?.(updated);
      setSaveSuccess(true);
      toast.success(t("settings.coordinator.saveSuccess"));
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error("Error saving coordinator settings:", error);
      toast.error(
        error?.response?.data?.message || t("errors.saveCoordinatorSettings"),
      );
    } finally {
      setSaving(false);
    }
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

      toast.success(t("settings.saved"));
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

      toast.success(t("settings.saved"));

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

  const sections = [
    { id: "profile", label: t("navigation.profile"), icon: User },
    { id: "security", label: t("navigation.security"), icon: Lock },
    { id: "notifications", label: t("navigation.notifications"), icon: Bell },
    { id: "appearance", label: t("navigation.appearance"), icon: Palette },
    { id: "preferences", label: t("navigation.preferences"), icon: Globe },
    { id: "coordinator", label: t("navigation.coordinator"), icon: Settings },
    { id: "help", label: t("navigation.help"), icon: HelpCircle },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{t("settings.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {saveSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-3xl border border-emerald-200 bg-white p-6 text-center shadow-2xl dark:border-emerald-800/60 dark:bg-gray-900">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
              <CheckCircle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-200">
              {t("settings.saved")}
            </h3>
            <p className="mt-2 text-sm text-emerald-600/80 dark:text-emerald-200/80">
              {t("general.updatedJustNow")}
            </p>
            <button
              onClick={() => setSaveSuccess(false)}
              className="mt-6 inline-flex items-center rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
            >
              {t("general.dismiss")}
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-2">
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors text-left ${activeSection === section.id
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
                    {t("settings.profile.title")}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("settings.profile.subtitle")}
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
                          <span>{t("settings.profile.uploading")}</span>
                        </div>
                      ) : (
                        t("settings.profile.changePhoto")
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
                      {t("settings.profile.photoHint")}
                    </p>
                    {profilePhotoPreview && (
                      <button
                        onClick={handleRemovePhoto}
                        className="mt-2 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                      >
                        {t("settings.profile.removePhoto")}
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("settings.profile.name")}
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
                      className={`w-full px-4 py-2 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 ${errors.name
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
                      {t("settings.profile.email")}
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
                      className={`w-full px-4 py-2 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 ${errors.email
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
                      {t("settings.profile.phone")}
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
                      className={`w-full px-4 py-2 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 ${errors.phone
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                        }`}
                      placeholder={t("general.optional")}
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
                    {t("settings.profile.emergencyTitle")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t("settings.profile.contactName")}
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
                        placeholder={t("general.optional")}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t("settings.profile.contactNumber")}
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
                        placeholder={t("general.optional")}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    <span>{t("settings.profile.saveProfile")}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeSection === "security" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    {t("settings.security.title")}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("settings.security.subtitle")}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("settings.security.currentPassword")}
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
                      {t("settings.security.newPassword")}
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
                      {t("settings.security.confirmPassword")}
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
                    {t("settings.security.twoFactorTitle")}
                  </h3>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {t("settings.security.enable2FA")}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {t("settings.security.twoFactorDescription")}
                        </p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium">
                      {t("settings.security.enableButton")}
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
                        <span>{t("settings.security.updating")}</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>{t("settings.security.updatePassword")}</span>
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
                    {t("settings.notifications.title")}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("settings.notifications.subtitle")}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {t("settings.notifications.documentApprovals")}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("settings.notifications.documentApprovalsHint")}
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
                        {t("settings.notifications.attendanceAlerts")}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("settings.notifications.attendanceAlertsHint")}
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
                        {t("settings.notifications.systemAnnouncements")}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("settings.notifications.systemAnnouncementsHint")}
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
                        {t("settings.notifications.pushNotifications")}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("settings.notifications.pushNotificationsHint")}
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
                    {t("settings.appearance.title")}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("settings.appearance.subtitle")}
                  </p>
                </div>

                {/* Theme Settings */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {t("settings.appearance.theme")}
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
                    {t("settings.preferences.title")}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("settings.preferences.subtitle")}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("settings.preferences.language")}
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        value={preferences.language}
                        onChange={(e) =>
                          setPreferences((prev) => ({
                            ...prev,
                            language: e.target.value as any,
                          }))
                        }
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="en">{t("language.english")}</option>
                        <option value="fil">{t("language.filipino")}</option>
                        <option value="es">{t("language.spanish")}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("settings.preferences.dateFormat")}
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        value={preferences.dateFormat}
                        onChange={(e) =>
                          setPreferences((prev) => ({
                            ...prev,
                            dateFormat: e.target.value,
                          }))
                        }
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="MM/DD/YYYY">{t("dateFormats.mmddyyyy")}</option>
                        <option value="DD/MM/YYYY">{t("dateFormats.ddmmyyyy")}</option>
                        <option value="YYYY-MM-DD">{t("dateFormats.yyyymmdd")}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("settings.preferences.timeFormat")}
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        value={preferences.timeFormat}
                        onChange={(e) =>
                          setPreferences((prev) => ({
                            ...prev,
                            timeFormat: e.target.value,
                          }))
                        }
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="12hr">{t("timeFormats.hour12")}</option>
                        <option value="24hr">{t("timeFormats.hour24")}</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSavePreferences}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>{t("settings.preferences.save")}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Coordinator Settings - NEW */}
            {activeSection === "coordinator" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    {t("settings.coordinator.title")}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("settings.coordinator.subtitle")}
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Document Management */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-purple-600" />
                      {t("settings.coordinator.document.title")}
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {t("settings.coordinator.document.autoApprove")}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t("settings.coordinator.document.autoApproveHint")}
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
                                requireDocumentReview: e.target.checked
                                  ? false
                                  : coordinatorSettings.requireDocumentReview,
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
                            {t("settings.coordinator.document.requireReview")}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t("settings.coordinator.document.requireReviewHint")}
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
                                autoApproveDocuments: e.target.checked
                                  ? false
                                  : coordinatorSettings.autoApproveDocuments,
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Announcement Settings */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Megaphone className="w-5 h-5 mr-2 text-amber-600" />
                      {t("settings.coordinator.announcement.title")}
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t("settings.coordinator.announcement.defaultAudience")}
                        </label>
                        <select
                          value={coordinatorSettings.defaultAnnouncementAudience}
                          onChange={(e) =>
                            setCoordinatorSettings({
                              ...coordinatorSettings,
                              defaultAnnouncementAudience: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="ALL">
                            {t("settings.coordinator.announcement.allUsers")}
                          </option>
                          <option value="STUDENTS">
                            {t("settings.coordinator.announcement.studentsOnly")}
                          </option>
                          <option value="COORDINATORS">
                            {t("settings.coordinator.announcement.coordinatorsOnly")}
                          </option>
                          <option value="INSTRUCTORS">
                            {t("settings.coordinator.announcement.instructorsOnly")}
                          </option>
                          <option value="INDUSTRY_PARTNERS">
                            {t("settings.coordinator.announcement.industryPartnersOnly")}
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* System Preferences */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <SlidersHorizontal className="w-5 h-5 mr-2 text-sky-600" />
                      {t("settings.coordinator.system.title")}
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {t("settings.coordinator.system.bulkOperations")}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t("settings.coordinator.system.bulkOperationsHint")}
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
                            {t("settings.coordinator.system.advancedMetrics")}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t("settings.coordinator.system.advancedMetricsHint")}
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
                          {t("settings.coordinator.system.notificationFrequency")}
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
                          <option value="immediate">
                            {t("settings.coordinator.system.frequencyImmediate")}
                          </option>
                          <option value="daily">
                            {t("settings.coordinator.system.frequencyDaily")}
                          </option>
                          <option value="weekly">
                            {t("settings.coordinator.system.frequencyWeekly")}
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Management */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Activity className="w-5 h-5 mr-2 text-green-600" />
                      {t("settings.coordinator.attendance.title")}
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t("settings.coordinator.attendance.reminderLabel")}
                        </label>
                        <div className="relative">
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
                          <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {t("settings.coordinator.attendance.reminderHint")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveCoordinatorSettings}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>{t("settings.coordinator.save")}</span>
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
                      Find answers to common questions
                    </p>
                  </button>

                  <a
                    href="mailto:intraksystem@gmail.com?subject=INTRAK%20Support%20Request"
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
                      Coordinator Guide
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Learn how to use coordinator features
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHelpModal("privacy")}
                    className="p-6 text-left bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <Shield className="w-8 h-8 text-yellow-600 mb-3" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Privacy Policy
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Read our privacy terms
                    </p>
                  </button>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      App Information
                    </h3>
                  </div>
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

      {helpModal && <HelpModalContent variant={helpModal} onClose={closeHelpModal} />}
    </div>
  );
};

export default CoordinatorSettingsTab;

const HelpModalContent: React.FC<{
  variant: "faq" | "guide" | "privacy";
  onClose: () => void;
}> = ({ variant, onClose }) => {
  const titles = {
    faq: "Frequently Asked Questions",
    guide: "Coordinator Quick Guide",
    privacy: "Privacy Overview",
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
              {variant === "faq" && "Quick answers to the most common coordinator questions."}
              {variant === "guide" && "Follow these steps to get the most out of the coordinator dashboard."}
              {variant === "privacy" && "A short summary of how INTRAK handles coordinator data."}
            </p>
          </div>

          {variant === "faq" && (
            <ul className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
              <li>
                <p className="font-semibold">How do I approve a company MOA?</p>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  Open the Document Review tab, filter by "MOA", review the submission, then choose Approve or
                  Request Changes with remarks.
                </p>
              </li>
              <li>
                <p className="font-semibold">Can I resend supervisor credentials?</p>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  Yes. In Company Management, open the company card and click "Create Supervisor Account" again to
                  trigger a new temporary password email.
                </p>
              </li>
              <li>
                <p className="font-semibold">Where can I monitor student progress?</p>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  Use the Student Management tab to view assignments, attendance, and evaluation scores, or drill into
                  the dashboard metrics for quick insights.
                </p>
              </li>
            </ul>
          )}

          {variant === "guide" && (
            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <div>
                <p className="font-semibold">1. Review your dashboard daily</p>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  The dashboard highlights urgent alerts, pending approvals, and recent activities so you always know
                  what needs attention first.
                </p>
              </div>
              <div>
                <p className="font-semibold">2. Manage companies and supervisors</p>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  Keep company records up-to-date, upload or approve MOAs, and provision supervisor accounts straight
                  from Company Management.
                </p>
              </div>
              <div>
                <p className="font-semibold">3. Automate document workflows</p>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  Configure auto-approval rules in Coordinator Settings to match your review process and reduce manual
                  tasks.
                </p>
              </div>
            </div>
          )}

          {variant === "privacy" && (
            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <p>
                INTRAK collects coordinator profile details, notification preferences, and audit logs to support
                compliance and communication.
              </p>
              <p>
                We do not share coordinator information outside the OJT management team. Access is role-restricted and
                monitored via audit trails.
              </p>
              <p>
                Need a full copy of the policy? Email us at intraksystem@gmail.com and we will send the latest PDF
                version.
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
