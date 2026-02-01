import { useState, useEffect } from "react";
import {
  User,
  Lock,
  Bell,
  Shield,
  Camera,
  Save,
  X,
  Loader2,
  CheckCircle,
  Mail,
  Phone,
  Building2,
  MapPin,
  Palette,
  Sun,
  Moon,
  Monitor,
  SlidersHorizontal,
  HelpCircle,
  Eye,
  EyeOff,
  AlertCircle,
  Book,
} from "lucide-react";
import { settingsService } from "../../services/settingsService";
import TwoFactorSettings from "../../components/settings/TwoFactorSettings";
import EmailVerificationSettings from "../../components/settings/EmailVerificationSettings";
import LastLoginInfo from "../../components/settings/LastLoginInfo";
import PasswordStrengthMeter from "../../components/settings/PasswordStrengthMeter";
import toast from "react-hot-toast";

// External help links
const HELP_LINKS = {
  faq: "https://intrak.site/faq",
  supervisorGuide: "https://intrak.site/supervisor-guide",
  privacy: "https://intrak.site/privacy",
  supportEmail: "intraksystem@gmail.com",
};

import { useSupervisorContext } from "./SupervisorLayout";

const SupervisorSettings = () => {
  const { refreshUserData } = useSupervisorContext();
  const [activeTab, setActiveTab] = useState<
    "profile" | "password" | "appearance" | "notifications" | "preferences" | "supervisor" | "help"
  >("profile");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [helpModal, setHelpModal] = useState<"faq" | "guide" | "privacy" | null>(null);

  // Profile data
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
  });

  // Password data
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    attendanceAlerts: true,
    documentSubmissions: true,
    evaluationReminders: true,
  });

  // Preferences
  const [preferences, setPreferences] = useState({
    language: "en",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12hr",
    theme: "system",
  });

  // Supervisor settings
  const [supervisorSettings, setSupervisorSettings] = useState({
    autoApproveDocuments: false,
    requireManualReview: true,
    defaultEvaluationReminder: true,
  });

  useEffect(() => {
    loadUserData();
    loadProfilePhoto();
    loadTheme();
    loadSavedSettings();
  }, []);

  const loadTheme = () => {
    const savedTheme =
      (localStorage.getItem("theme") as "light" | "dark" | "system") ||
      "system";
    setTheme(savedTheme);
  };

  const loadSavedSettings = () => {
    const savedPreferences = localStorage.getItem("preferences");
    if (savedPreferences) {
      try {
        setPreferences(JSON.parse(savedPreferences));
      } catch (e) {
        console.error("Error loading preferences:", e);
      }
    }
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

  const loadUserData = async () => {
    try {
      setLoading(true);
      const userString = localStorage.getItem("user");
      if (userString) {
        const user = JSON.parse(userString);
        setProfileData({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          company: user.company || "",
          address: user.address || "",
        });
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      toast.error("Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  const loadProfilePhoto = async () => {
    try {
      const photo = await settingsService.getProfilePhoto();
      setProfilePhoto(photo);
    } catch (error) {
      console.log("No profile photo found");
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
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

      await settingsService.uploadProfilePhoto(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      const newPhoto = await settingsService.getProfilePhoto();

      setTimeout(() => {
        setProfilePhoto(newPhoto);
        setUploadingPhoto(false);
        setUploadProgress(0);
      }, 300);

      refreshUserData();
      setSaveSuccess(true);
    } catch (error) {
      console.error("Error uploading photo:", error);
      setUploadingPhoto(false);
      setUploadProgress(0);
      toast.error("Failed to upload photo");
    }
  };

  const handleDeletePhoto = async () => {
    if (
      !window.confirm("Are you sure you want to remove your profile photo?")
    ) {
      return;
    }

    try {
      await settingsService.deleteProfilePhoto();
      setProfilePhoto(null);
      refreshUserData();
      toast.success("Profile photo removed successfully");
    } catch (error) {
      console.error("Error deleting photo:", error);
      toast.error("Failed to remove photo");
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await settingsService.updateProfile({
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
      });

      // Update local storage
      const userString = localStorage.getItem("user");
      if (userString) {
        const user = JSON.parse(userString);
        localStorage.setItem(
          "user",
          JSON.stringify({ ...user, ...profileData })
        );
      }
      refreshUserData();

      setSaveSuccess(true);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      setSaving(true);
      await settingsService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });
      setSaveSuccess(true);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setSaving(true);
      // Save notification preferences to backend (API endpoint pending)
      setSaveSuccess(true);
    } catch (error) {
      console.error("Error saving notifications:", error);
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading settings...
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Success Modal */}
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-[#212124] rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm">
            <nav className="space-y-1.5 sm:space-y-2">
              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-3 rounded-md sm:rounded-lg transition-colors text-sm sm:text-base ${activeTab === "profile"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Profile</span>
              </button>
              <button
                onClick={() => setActiveTab("password")}
                className={`w-full flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-3 rounded-md sm:rounded-lg transition-colors text-sm sm:text-base ${activeTab === "password"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
              >
                <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Password</span>
              </button>
              <button
                onClick={() => setActiveTab("appearance")}
                className={`w-full flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-3 rounded-md sm:rounded-lg transition-colors text-sm sm:text-base ${activeTab === "appearance"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
              >
                <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Appearance</span>
              </button>
              <button
                onClick={() => setActiveTab("notifications")}
                className={`w-full flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-3 rounded-md sm:rounded-lg transition-colors text-sm sm:text-base ${activeTab === "notifications"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Notifications</span>
              </button>
              <button
                onClick={() => setActiveTab("preferences")}
                className={`w-full flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-3 rounded-md sm:rounded-lg transition-colors text-sm sm:text-base ${activeTab === "preferences"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
              >
                <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Preferences</span>
              </button>
              <button
                onClick={() => setActiveTab("supervisor")}
                className={`w-full flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-3 rounded-md sm:rounded-lg transition-colors text-sm sm:text-base ${activeTab === "supervisor"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
              >
                <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Supervisor</span>
              </button>
              <button
                onClick={() => setActiveTab("help")}
                className={`w-full flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-3 rounded-md sm:rounded-lg transition-colors text-sm sm:text-base ${activeTab === "help"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
              >
                <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Help & Support</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-[#212124] rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-4 sm:space-y-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  Profile Information
                </h2>

                {/* Profile Photo */}
                <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-6">
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-500 flex items-center justify-center relative">
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
                          {profilePhoto && <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover opacity-50" />}
                        </>
                      ) : profilePhoto ? (
                        <img
                          src={profilePhoto}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-xl sm:text-2xl lg:text-3xl font-semibold">
                          {profileData.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .substring(0, 2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-1.5 sm:mb-2">
                      Profile Photo
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <label className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-md sm:rounded-lg hover:bg-blue-700 cursor-pointer transition-colors text-xs sm:text-sm flex items-center justify-center sm:justify-start">
                        <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2" />
                        Upload Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                          disabled={uploadingPhoto}
                        />
                      </label>
                      {profilePhoto && (
                        <button
                          onClick={handleDeletePhoto}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 border border-red-300 text-red-600 rounded-md sm:rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-xs sm:text-sm flex items-center justify-center sm:justify-start"
                        >
                          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2" />
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            name: e.target.value,
                          })
                        }
                        className="w-full pl-9 sm:pl-10 pr-4 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md sm:rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            email: e.target.value,
                          })
                        }
                        className="w-full pl-9 sm:pl-10 pr-4 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md sm:rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      Phone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            phone: e.target.value,
                          })
                        }
                        className="w-full pl-9 sm:pl-10 pr-4 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md sm:rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      Company
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                      <input
                        type="text"
                        value={profileData.company}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            company: e.target.value,
                          })
                        }
                        className="w-full pl-9 sm:pl-10 pr-4 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md sm:rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        disabled
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <textarea
                      value={profileData.address}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          address: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full pl-9 sm:pl-10 pr-4 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md sm:rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center space-x-1.5 sm:space-x-2 px-4 sm:px-6 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-md sm:rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium w-full sm:w-auto justify-center sm:justify-start"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Password Tab */}
            {activeTab === "password" && (
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
                    <PasswordStrengthMeter password={passwordData.newPassword} />
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
                      className="w-full flex items-center justify-center space-x-2 sm:space-x-3 px-4 py-3 sm:px-6 sm:py-4 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-blue-600 text-white rounded-xl hover:from-blue-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
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

                <EmailVerificationSettings />
                <TwoFactorSettings />
                <LastLoginInfo />
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Notification Preferences
                </h2>

                <div className="space-y-4">
                  {Object.entries(notifications).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#212124] rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {key
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (str) => str.toUpperCase())}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Receive notifications for this category
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) =>
                            setNotifications({
                              ...notifications,
                              [key]: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveNotifications}
                    disabled={saving}
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span>Save Preferences</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === "appearance" && (
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
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-500 rounded-xl flex items-center justify-center">
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
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === "preferences" && (
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
                      localStorage.setItem("preferences", JSON.stringify(preferences));
                      toast.success("Preferences saved");
                    }}
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="w-5 h-5" />
                    <span>Save Preferences</span>
                  </button>
                </div>
              </div>
            )}

            {/* Supervisor Tab */}
            {activeTab === "supervisor" && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    Supervisor Settings
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Configure supervisor-specific settings
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#212124] rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Auto Approve Documents
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Automatically approve student documents
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={supervisorSettings.autoApproveDocuments}
                        onChange={(e) =>
                          setSupervisorSettings({
                            ...supervisorSettings,
                            autoApproveDocuments: e.target.checked,
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
                        Require Manual Review
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Require manual review for all submissions
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={supervisorSettings.requireManualReview}
                        onChange={(e) =>
                          setSupervisorSettings({
                            ...supervisorSettings,
                            requireManualReview: e.target.checked,
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
                        Default Evaluation Reminder
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Send reminders for pending evaluations
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={supervisorSettings.defaultEvaluationReminder}
                        onChange={(e) =>
                          setSupervisorSettings({
                            ...supervisorSettings,
                            defaultEvaluationReminder: e.target.checked,
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
                      toast.success("Supervisor settings saved");
                    }}
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="w-5 h-5" />
                    <span>Save Settings</span>
                  </button>
                </div>
              </div>
            )}

            {/* Help Tab */}
            {activeTab === "help" && (
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    Help & Support
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Get help and learn more about the portal
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* FAQ */}
                  <button
                    type="button"
                    onClick={() => setHelpModal("faq")}
                    className="text-left w-full rounded-xl border border-blue-700/40 dark:border-blue-600/40 bg-blue-900/30 hover:bg-blue-900/40 transition-colors p-4 sm:p-5"
                  >
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-600/30 flex items-center justify-center flex-shrink-0">
                        <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-300" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-white">FAQ</h3>
                        <p className="text-xs sm:text-sm text-gray-300">
                          Find answers to common questions
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Contact Support */}
                  <a
                    href={`mailto:${HELP_LINKS.supportEmail}`}
                    className="block rounded-xl border border-blue-700/40 dark:border-blue-600/40 bg-blue-900/30 hover:bg-blue-900/40 transition-colors p-4 sm:p-5"
                  >
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-600/30 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-blue-300" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-white">Contact Support</h3>
                        <p className="text-xs sm:text-sm text-gray-300">
                          Email: {HELP_LINKS.supportEmail}
                        </p>
                      </div>
                    </div>
                  </a>

                  {/* Supervisor Guide */}
                  <button
                    type="button"
                    onClick={() => setHelpModal("guide")}
                    className="text-left w-full rounded-xl border border-emerald-700/40 dark:border-emerald-600/40 bg-emerald-900/30 hover:bg-emerald-900/40 transition-colors p-4 sm:p-5"
                  >
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-600/30 flex items-center justify-center flex-shrink-0">
                        <Book className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-white">Supervisor Guide</h3>
                        <p className="text-xs sm:text-sm text-gray-300">
                          Learn how to use supervisor features
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Privacy Policy */}
                  <button
                    type="button"
                    onClick={() => setHelpModal("privacy")}
                    className="text-left w-full rounded-xl border border-amber-700/40 dark:border-amber-600/40 bg-amber-900/30 hover:bg-amber-900/40 transition-colors p-4 sm:p-5"
                  >
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-600/30 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-white">Privacy Policy</h3>
                        <p className="text-xs sm:text-sm text-gray-300">
                          Read our privacy terms
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                {/* App Information */}
                <div className="pt-2">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-200">App Information</h3>
                  <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-300">
                    <p>
                      <span className="text-gray-400">Version:</span> 1.0.0
                    </p>
                    <p>
                      <span className="text-gray-400">Last Updated:</span> December 2025
                    </p>
                    <p>
                      <span className="text-gray-400">License:</span> Educational Use
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
                <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-[#212124] max-h-[90vh] overflow-y-auto">
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
                      {helpModal === "guide" && "Supervisor Quick Guide"}
                      {helpModal === "privacy" && "Privacy Overview"}
                    </h3>
                    <div className="text-sm sm:text-base text-gray-600 dark:text-gray-300 space-y-4">
                      {helpModal === "faq" && (
                        <div>
                          <p>FAQ content will be available soon.</p>
                        </div>
                      )}
                      {helpModal === "guide" && (
                        <div>
                          <p>Supervisor guide content will be available soon.</p>
                        </div>
                      )}
                      {helpModal === "privacy" && (
                        <div>
                          <p>Privacy policy content will be available soon.</p>
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

export default SupervisorSettings;
