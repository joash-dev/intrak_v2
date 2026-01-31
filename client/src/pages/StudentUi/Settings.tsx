import { useState, useEffect } from "react";
import {
  User,
  Lock,
  Bell,
  Moon,
  Sun,
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
  Palette,
  Monitor,
  SlidersHorizontal,
  Book,
  X,
} from "lucide-react";
import { useOutletContext } from "react-router-dom";
import TwoFactorSettings from "../../components/settings/TwoFactorSettings";
import Skeleton from "../../components/Skeleton";
import {
  settingsService,
  type UserProfile,
  type PasswordChangeData,
  type NotificationPreferences,
  type AppPreferences,
} from "../../services/settingsService";
import toast from "react-hot-toast";

const StudentSettingsTab = () => {
  const { refreshStudentData } = useOutletContext<{ refreshStudentData: () => void }>() || { refreshStudentData: () => { } };

  const [activeSection, setActiveSection] = useState<
    "profile" | "password" | "appearance" | "notifications" | "preferences" | "student" | "help"
  >("profile");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(
    null
  );
  const [helpModal, setHelpModal] = useState<"faq" | "guide" | "privacy" | null>(null);

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
    theme: "system",
  });

  const [studentSettings, setStudentSettings] = useState({
    autoSubmitAttendance: false,
    requireConfirmation: true,
    defaultWeeklyReportReminder: true,
  });

  // Help links
  const HELP_LINKS = {
    faq: "https://intrak.site/faq",
    studentGuide: "https://intrak.site/student-guide",
    privacy: "https://intrak.site/privacy",
    supportEmail: "intraksystem@gmail.com",
  };

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
    loadPreferences();
    loadTheme();
  }, []);

  const loadTheme = () => {
    const savedTheme =
      (localStorage.getItem("theme") as "light" | "dark" | "system") ||
      "system";
    setTheme(savedTheme);
  };

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    // Apply theme immediately
    if (newTheme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefersDark);
    } else {
      document.documentElement.classList.toggle("dark", newTheme === "dark");
    }

    toast.success(`Theme changed to ${newTheme}`);
  };

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

    // Set theme from preferences
    const savedTheme = appPrefs.theme === "auto" ? "system" : (appPrefs.theme as "light" | "dark" | "system");
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

    // Apply the saved theme on load
    settingsService.applyTheme(appPrefs.theme);
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

      // Update localStorage with new user data immediately
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const updatedUser = { ...currentUser, ...updatedProfile };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      // Dispatch event for specialized components
      window.dispatchEvent(
        new CustomEvent("profileUpdated", {
          detail: {
            user: updatedUser,
          },
        })
      );

      // Reload local state to verify
      await loadUserData();

      // Notify parent component to refresh dashboard data
      if (refreshStudentData) {
        refreshStudentData();
      }

      setSaveSuccess(true);
      // toast.success("Profile updated successfully"); // Removed toast in favor of modal
      // setTimeout(() => setSaveSuccess(false), 3000); // Let user dismiss modal
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
    const updatedPreferences = {
      ...preferences,
      theme: theme,
    };
    settingsService.saveAppPreferences(updatedPreferences);
    settingsService.applyTheme(updatedPreferences.theme);
    setPreferences(updatedPreferences);
    setSaveSuccess(true);
    toast.success("Preferences saved");
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleRemovePhoto = async () => {
    try {
      // Remove from server
      await settingsService.removeProfilePhoto();
      setProfilePhotoPreview(null);

      toast.success("Profile photo removed successfully!");

      // Notify parent component to refresh dashboard
      if (refreshStudentData) {
        refreshStudentData();
      }
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

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast.error("File size must be less than 5MB");
      return;
    }

    try {
      setUploadingPhoto(true);
      setUploadProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Upload to server
      const photoUrl = await settingsService.uploadProfilePhoto(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      setTimeout(() => {
        setProfilePhotoPreview(photoUrl);
        setUploadingPhoto(false);
        setUploadProgress(0);
      }, 300);

      toast.success("Profile photo updated successfully!");

      // Notify parent component to refresh dashboard
      if (refreshStudentData) {
        refreshStudentData();
      }

      // Reset the file input
      event.target.value = "";
    } catch (error: any) {
      console.error("Error uploading photo:", error);
      setUploadingPhoto(false);
      setUploadProgress(0);
      if (error.response?.status === 413) {
        toast.error("File is too large. Please upload an image smaller than 5MB.");
      } else {
        toast.error("Failed to upload photo. Please try again.");
      }
      // Clear preview on error
      setProfilePhotoPreview(null);
    }
  };

  const sections = [
    { id: "profile", label: "Profile", icon: User },
    { id: "password", label: "Password", icon: Lock },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "preferences", label: "Preferences", icon: Monitor },
    { id: "student", label: "Student", icon: SlidersHorizontal },
    { id: "help", label: "Help & Support", icon: HelpCircle },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation Skeleton */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-[#212124] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-2">
            <div className="space-y-1">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="flex items-center space-x-3 px-4 py-3">
                  <Skeleton className="w-5 h-5 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Settings Content Skeleton */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-[#212124] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            {/* Header Skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>

            {/* Profile Picture Skeleton */}
            <div className="flex items-center space-x-4">
              <Skeleton className="w-24 h-24 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-10 w-32 rounded-xl" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>

            {/* Form Fields Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message Modal */}
      {saveSuccess && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-3xl border border-emerald-200 bg-white p-6 text-center shadow-2xl dark:border-emerald-800/60 dark:bg-gray-900">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
              <CheckCircle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-200">
              Settings Saved
            </h3>
            <p className="mt-2 text-sm text-emerald-600/80 dark:text-emerald-200/80">
              Your profile has been updated successfully.
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
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg p-4">
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
          <div className="bg-white dark:bg-[#212124] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-2">
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id as typeof activeSection)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-left ${activeSection === section.id
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
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
          <div className="bg-white dark:bg-[#212124] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            {/* Profile Information */}
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
                    <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center overflow-hidden relative">
                      {uploadingPhoto ? (
                        <>
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                            <div className="text-white text-sm font-bold">{uploadProgress}%</div>
                          </div>
                          <svg className="absolute inset-0 w-full h-full -rotate-90 z-20">
                            <circle
                              cx="50%"
                              cy="50%"
                              r="45%"
                              fill="none"
                              stroke="rgba(255,255,255,0.3)"
                              strokeWidth="4"
                            />
                            <circle
                              cx="50%"
                              cy="50%"
                              r="45%"
                              fill="none"
                              stroke="white"
                              strokeWidth="4"
                              strokeLinecap="round"
                              strokeDasharray={`${uploadProgress * 2.83} 283`}
                              className="transition-all duration-200"
                            />
                          </svg>
                          {profilePhotoPreview && <img src={profilePhotoPreview} alt="Profile" className="w-full h-full object-cover opacity-50" />}
                        </>
                      ) : profilePhotoPreview ? (
                        <img
                          src={profilePhotoPreview}
                          alt="Profile preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-12 h-12 text-blue-600 dark:text-blue-300" />
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg cursor-pointer transition-colors">
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
                    <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium cursor-pointer transition-colors inline-block">
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
                      JPG, PNG or GIF. Max size 5MB
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
                      className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${errors.name
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
                      className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${errors.email
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
                      className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${errors.phone
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
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            )}

            {/* Password */}
            {activeSection === "password" && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    Password & Security
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Update your password and security settings
                  </p>
                </div>

                {/* Security Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 sm:p-6">
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="flex-shrink-0">
                      <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-blue-900 dark:text-blue-100 mb-1.5 sm:mb-2">
                        Password Security
                      </h3>
                      <p className="text-blue-700 dark:text-blue-300 text-xs sm:text-sm">
                        Keep your account secure by using a strong password with
                        at least 8 characters, including numbers and special
                        characters.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Password Form */}
                <div className="space-y-4 sm:space-y-6">
                  {/* Current Password */}
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
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
                        placeholder="Enter your current password"
                        className="w-full px-3 py-2 sm:px-4 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-[#212124] dark:text-white transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                        className="absolute right-3 top-2.5 sm:right-4 sm:top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : (
                          <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
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
                        placeholder="Enter your new password"
                        className="w-full px-3 py-2 sm:px-4 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-[#212124] dark:text-white transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-2.5 sm:right-4 sm:top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : (
                          <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
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
                              className={`h-1 flex-1 rounded-full ${passwordData.newPassword.length >= level * 2
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
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          })
                        }
                        placeholder="Confirm your new password"
                        className="w-full px-3 py-2 sm:px-4 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-[#212124] dark:text-white transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-2.5 sm:right-4 sm:top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : (
                          <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                      </button>
                    </div>
                    {/* Password Match Indicator */}
                    {passwordData.confirmPassword && (
                      <div className="flex items-center space-x-2">
                        {passwordData.newPassword ===
                          passwordData.confirmPassword ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                            <span className="text-xs sm:text-sm text-green-600">
                              Passwords match
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
                            <span className="text-xs sm:text-sm text-red-600">
                              Passwords do not match
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="pt-4">
                    <button
                      onClick={handleChangePassword}
                      disabled={
                        saving ||
                        passwordData.newPassword !==
                        passwordData.confirmPassword ||
                        passwordData.newPassword.length < 8
                      }
                      className="w-full flex items-center justify-center space-x-2 sm:space-x-3 px-4 py-3 sm:px-6 sm:py-4 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      ) : (
                        <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                      <span>Update Password</span>
                    </button>
                  </div>
                </div>

                <TwoFactorSettings />
              </div>
            )}

            {/* Notifications */}
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
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#212124] rounded-lg">
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
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#212124] rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Attendance Reminders
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Reminder to log your daily attendance
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
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#212124] rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Announcements
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Important updates from coordinators
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
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#212124] rounded-lg">
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
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#212124] rounded-lg">
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
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveNotifications}
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Preferences</span>
                  </button>
                </div>
              </div>
            )}

            {/* Appearance */}
            {activeSection === "appearance" && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    Appearance Settings
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Customize your interface appearance
                  </p>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-1.5 sm:mb-2">
                      Theme Settings
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                      Choose your preferred theme appearance
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                    {/* Light Theme */}
                    <button
                      onClick={() => handleThemeChange("light")}
                      className={`relative p-4 sm:p-6 rounded-xl border-2 transition-all duration-200 ${theme === "light"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                        }`}
                    >
                      <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center">
                          <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">Light</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Bright theme</p>
                        </div>
                      </div>
                      {theme === "light" && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        </div>
                      )}
                    </button>

                    {/* Dark Theme */}
                    <button
                      onClick={() => handleThemeChange("dark")}
                      className={`relative p-4 sm:p-6 rounded-xl border-2 transition-all duration-200 ${theme === "dark"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                        }`}
                    >
                      <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center">
                          <Moon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">Dark</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Dark theme</p>
                        </div>
                      </div>
                      {theme === "dark" && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        </div>
                      )}
                    </button>

                    {/* System Theme */}
                    <button
                      onClick={() => handleThemeChange("system")}
                      className={`relative p-4 sm:p-6 rounded-xl border-2 transition-all duration-200 ${theme === "system"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                        }`}
                    >
                      <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                          <Monitor className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">System</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Follow system</p>
                        </div>
                      </div>
                      {theme === "system" && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSavePreferences}
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            )}

            {/* Preferences */}
            {activeSection === "preferences" && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    App Preferences
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Language and format settings
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      Language
                    </label>
                    <select
                      value={preferences.language}
                      onChange={(e) =>
                        setPreferences({ ...preferences, language: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#212124] dark:text-white"
                    >
                      <option value="en">English</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      Date Format
                    </label>
                    <select
                      value={preferences.dateFormat}
                      onChange={(e) =>
                        setPreferences({ ...preferences, dateFormat: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#212124] dark:text-white"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      Time Format
                    </label>
                    <select
                      value={preferences.timeFormat}
                      onChange={(e) =>
                        setPreferences({ ...preferences, timeFormat: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#212124] dark:text-white"
                    >
                      <option value="12hr">12 Hour</option>
                      <option value="24hr">24 Hour</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      handleSavePreferences();
                    }}
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="w-5 h-5" />
                    <span>Save Preferences</span>
                  </button>
                </div>
              </div>
            )}

            {/* Student Tab */}
            {activeSection === "student" && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    Student Settings
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Configure student-specific settings
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#212124] rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Auto Submit Attendance
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Automatically submit attendance logs
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={studentSettings.autoSubmitAttendance}
                        onChange={(e) =>
                          setStudentSettings({
                            ...studentSettings,
                            autoSubmitAttendance: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#212124] rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Require Confirmation
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Require confirmation before submitting documents
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={studentSettings.requireConfirmation}
                        onChange={(e) =>
                          setStudentSettings({
                            ...studentSettings,
                            requireConfirmation: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#212124] rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Weekly Report Reminder
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Send reminders for weekly report submissions
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={studentSettings.defaultWeeklyReportReminder}
                        onChange={(e) =>
                          setStudentSettings({
                            ...studentSettings,
                            defaultWeeklyReportReminder: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      toast.success("Student settings saved");
                    }}
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="w-5 h-5" />
                    <span>Save Settings</span>
                  </button>
                </div>
              </div>
            )}

            {/* Help & Support */}
            {activeSection === "help" && (
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    Help & Support
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Get help and learn more about the portal
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* FAQ */}
                  <button
                    type="button"
                    onClick={() => setHelpModal("faq")}
                    className="p-6 text-left bg-blue-50 dark:bg-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <HelpCircle className="w-8 h-8 text-blue-600 mb-3" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      FAQ
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Find answers to common questions
                    </p>
                  </button>

                  {/* Contact Support */}
                  <a
                    href={`mailto:${HELP_LINKS.supportEmail}`}
                    className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <Mail className="w-8 h-8 text-blue-600 mb-3" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Contact Support
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Email: {HELP_LINKS.supportEmail}
                    </p>
                  </a>

                  {/* Student Guide */}
                  <button
                    type="button"
                    onClick={() => setHelpModal("guide")}
                    className="p-6 text-left bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <Book className="w-8 h-8 text-emerald-600 mb-3" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Student Guide
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Learn how to use student features
                    </p>
                  </button>

                  {/* Privacy Policy */}
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

                {/* App Information */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    App Information
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p>
                      <span className="font-medium">Version:</span> 1.0.0
                    </p>
                    <p>
                      <span className="font-medium">Last Updated:</span> December 2025
                    </p>
                    <p>
                      <span className="font-medium">License:</span> Educational Use
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Help Modal */}
            {helpModal && (
              <div
                className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-3 sm:px-4 py-4 sm:py-6"
                style={{ marginTop: 0 }}
              >
                <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-gray-900 max-h-[90vh] overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => setHelpModal(null)}
                    className="absolute right-3 top-3 sm:right-4 sm:top-4 rounded-full p-1.5 sm:p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                  <div className="p-4 sm:p-6">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
                      {helpModal === "faq" && "Frequently Asked Questions"}
                      {helpModal === "guide" && "Student Quick Guide"}
                      {helpModal === "privacy" && "Privacy Overview"}
                    </h3>
                    <div className="text-sm sm:text-base text-gray-600 dark:text-gray-300 space-y-4">
                      {helpModal === "faq" && (
                        <ul className="space-y-4">
                          <li>
                            <p className="font-semibold text-gray-900 dark:text-white">How do I upload my documents?</p>
                            <p className="mt-1">
                              Navigate to the "Documents" tab, select the document type you wish to upload, and drag and drop your file or click to browse.
                            </p>
                          </li>
                          <li>
                            <p className="font-semibold text-gray-900 dark:text-white">How is my attendance tracked?</p>
                            <p className="mt-1">
                              Your attendance is logged daily. You can view your attendance history and total hours in the "Attendance" tab.
                            </p>
                          </li>
                          <li>
                            <p className="font-semibold text-gray-900 dark:text-white">Can I update my profile information?</p>
                            <p className="mt-1">
                              Yes, go to the "Settings" tab and select "Profile" to update your personal details and contact information.
                            </p>
                          </li>
                        </ul>
                      )}
                      {helpModal === "guide" && (
                        <div className="space-y-4">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">1. Complete Your Profile</p>
                            <p className="mt-1">
                              Ensure all your personal and academic details are up to date in the Settings &gt; Profile section.
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">2. Upload Required Documents</p>
                            <p className="mt-1">
                              Submit all necessary internship documents (e.g., MOA, Medical Certificate) via the Documents tab for approval.
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">3. Monitor Your Progress</p>
                            <p className="mt-1">
                              Regularly check your dashboard for announcements, task updates, and your accumulated internship hours.
                            </p>
                          </div>
                        </div>
                      )}
                      {helpModal === "privacy" && (
                        <div className="space-y-3">
                          <p>
                            INTRAK values your privacy. We collect only the necessary information to manage your internship program effectively.
                          </p>
                          <p>
                            Your data, including personal details and internship records, is shared only with authorized coordinators and your assigned supervisor.
                          </p>
                          <p>
                            We do not share your information with third parties without your consent, except as required by university policy or law.
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                            For a full copy of our privacy policy, please contact the system administrator.
                          </p>
                        </div>
                      )}
                    </div>
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

export default StudentSettingsTab;
