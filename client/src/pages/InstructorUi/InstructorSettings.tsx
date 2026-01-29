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
  FileText,
  Megaphone,
  SlidersHorizontal,
  HelpCircle,
  Mail,
  Shield,
  Book,
  X as CloseIcon,
} from "lucide-react";
// External help links (update these to your live URLs when available)
const HELP_LINKS = {
  faq: "https://intrak.site/faq",
  coordinatorGuide: "https://intrak.site/coordinator-guide",
  privacy: "https://intrak.site/privacy",
  supportEmail: "intraksystem@gmail.com",
};
import { settingsService } from "../../services/settingsService";
import TwoFactorSettings from "../../components/settings/TwoFactorSettings";
import toast from "react-hot-toast";

interface InstructorProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  office?: string;
  profilePhoto?: string;
}

interface PasswordChange {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const InstructorSettings = () => {
  const [profile, setProfile] = useState<InstructorProfile>({
    id: "",
    name: "",
    email: "",
    phone: "",
    department: "",
    office: "",
    profilePhoto: "",
  });
  const [passwordData, setPasswordData] = useState<PasswordChange>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "profile" | "password" | "notifications" | "appearance" | "preferences" | "instructor" | "help"
  >("profile");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [notifications, setNotifications] = useState({
    emailDocuments: true,
    emailAttendance: true,
    emailAnnouncements: true,
    pushNotifications: true,
  });
  const [preferences, setPreferences] = useState({
    language: "en",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12hr",
    theme: "system",
  });
  const [instructorSettings, setInstructorSettings] = useState({
    autoApproveDocuments: true,
    requireManualReview: false,
    defaultAnnouncementAudience: "All Users",
  });
  const [helpModal, setHelpModal] = useState<"faq" | "guide" | "privacy" | null>(null);

  // Settings sections for navigation
  const sections = [
    { id: "profile", label: "Profile", icon: User },
    { id: "password", label: "Password", icon: Lock },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "notifications", label: "Notifications", icon: AlertCircle },
    { id: "preferences", label: "Preferences", icon: Monitor },
    { id: "instructor", label: "Instructor", icon: SlidersHorizontal },
    { id: "help", label: "Help & Support", icon: AlertCircle },
  ];

  useEffect(() => {
    loadProfile();
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
    try {
      const notif = settingsService.loadNotificationPreferences?.();
      if (notif) {
        setNotifications({
          emailDocuments: !!notif.emailDocuments,
          emailAttendance: !!notif.emailAttendance,
          emailAnnouncements: !!notif.emailAnnouncements,
          pushNotifications: !!notif.pushNotifications,
        });
      }
    } catch { }

    try {
      const app = settingsService.loadAppPreferences?.();
      if (app) {
        setPreferences({
          language: app.language || "en",
          dateFormat: app.dateFormat || "MM/DD/YYYY",
          timeFormat: app.timeFormat || "12hr",
          theme: (app.theme as any) || "system",
        });
      }
    } catch { }

    try {
      const instr = settingsService.loadInstructorSettings();
      if (instr) {
        setInstructorSettings({
          autoApproveDocuments: !!instr.autoApproveDocuments,
          requireManualReview: !!instr.requireManualReview,
          defaultAnnouncementAudience:
            instr.defaultAnnouncementAudience || "All Users",
        });
      }
    } catch { }
  };

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    // Apply theme to document
    const root = document.documentElement;
    if (newTheme === "system") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      root.classList.toggle("dark", prefersDark);
    } else {
      root.classList.toggle("dark", newTheme === "dark");
    }

    toast.success(`Theme changed to ${newTheme}`);

    // Keep app preferences in sync so Login page and other areas respect choice
    try {
      setPreferences((prev) => {
        const updated = { ...prev, theme: newTheme };
        settingsService.saveAppPreferences?.(updated as any);
        return updated;
      });
    } catch { }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      // Load profile data from localStorage
      const userData = localStorage.getItem("user");
      const user = userData ? JSON.parse(userData) : {};

      const mockProfile: InstructorProfile = {
        id: user.id || "1",
        name: user.name || "Instructor",
        email: user.email || "instructor@university.edu",
        phone: user.phone || "+63 912 345 6789",
        department: user.department || "Computer Engineering",
        office: "Engineering Building, Room 201",
        profilePhoto: "",
      };

      setProfile(mockProfile);

      // Load profile photo if available
      try {
        const photoUrl = await settingsService.getProfilePhoto();
        if (photoUrl) {
          setProfilePhoto(photoUrl);
        }
      } catch (error) {
        console.log("No profile photo found");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
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

      // Update profile using the settings service
      const updatedProfile = await settingsService.updateProfile({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
      });

      // Update local state
      setProfile({ ...profile, ...updatedProfile });

      // Store updated profile in localStorage for immediate access
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...currentUser,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
        })
      );

      // Notify the rest of the app about immediate user detail changes
      try {
        window.dispatchEvent(
          new CustomEvent("userUpdated", {
            detail: {
              user: {
                name: profile.name,
                email: profile.email,
                phone: profile.phone,
              }
            },
          })
        );
        window.dispatchEvent(
          new CustomEvent("profileUpdated", {
            detail: {
              user: {
                name: profile.name,
                email: profile.email,
                phone: profile.phone,
              }
            },
          })
        );
      } catch { }

      // Reload profile photo to ensure it's up to date
      try {
        const photoUrl = await settingsService.getProfilePhoto();
        if (photoUrl) {
          setProfilePhoto(photoUrl);
        }
      } catch (photoError) {
        console.log("No profile photo found");
      }

      setSaveSuccess(true);
      toast.success("Profile updated successfully");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setErrors({ newPassword: "Password must be at least 8 characters long" });
      return;
    }

    try {
      setSaving(true);
      setErrors({});

      // Call the real API to change password
      await settingsService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });

      setSaveSuccess(true);
      toast.success("Password changed successfully");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error("Error changing password:", error);
      const errorMessage = error.message || "Failed to change password";
      toast.error(errorMessage);

      // Set specific field errors if available
      if (errorMessage.includes("Current password is incorrect")) {
        setErrors({ currentPassword: "Current password is incorrect" });
      } else if (errorMessage.includes("at least 8 characters")) {
        setErrors({
          newPassword: "Password must be at least 8 characters long",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    try {
      setSaving(true);

      // Upload to server
      const photoUrl = await settingsService.uploadProfilePhoto(file);
      setProfilePhoto(photoUrl);

      // Dispatch custom event to notify other components of profile photo change
      window.dispatchEvent(
        new CustomEvent("profilePhotoUpdated", {
          detail: { photoUrl },
        })
      );

      toast.success("Profile photo updated successfully");
    } catch (error: any) {
      console.error("Error uploading photo:", error);
      if (error.response?.status === 413) {
        toast.error("File is too large. Please upload an image smaller than 5MB.");
      } else {
        toast.error("Failed to upload profile photo");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setSaving(true);

      // Remove from server
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
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-screen dark:bg-[#19191c]">
      {/* Success Modal */}
      {saveSuccess && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setSaveSuccess(false)}
          />
          <div className="relative z-10 w-full max-w-md">
            <div className="bg-white dark:bg-[#212124] rounded-2xl shadow-xl border border-green-200 dark:border-green-900/40 overflow-hidden">
              <div className="p-4 sm:p-6 md:p-8 text-center">
                <div className="mx-auto mb-3 sm:mb-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 sm:w-7 sm:h-7 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
                  Settings saved successfully
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Your preferences were updated just now.
                </p>
                <div className="mt-4 sm:mt-6">
                  <button
                    onClick={() => setSaveSuccess(false)}
                    className="inline-flex items-center justify-center px-4 py-2 sm:px-5 sm:py-2.5 text-sm sm:text-base rounded-full bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg p-3 sm:p-4">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
            <div>
              {Object.entries(errors).map(([field, message]) => (
                <p
                  key={field}
                  className="text-xs sm:text-sm text-red-800 dark:text-red-200 font-medium"
                >
                  {message}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-[#212124] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-1.5 sm:p-2">
            <nav className="space-y-0.5 sm:space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveTab(section.id as any)}
                    className={`w-full flex items-center space-x-2 sm:space-x-3 px-2 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors text-left ${activeTab === section.id
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="font-medium text-xs sm:text-sm">{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-[#212124] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    Profile Information
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Update your personal information
                  </p>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  {/* Profile Photo - Top Left with side controls */}
                  <div className="w-full flex items-center">
                    <div className="relative mr-3 sm:mr-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        {profilePhoto ? (
                          <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white text-lg sm:text-xl md:text-2xl font-bold">
                            {profile.name.split(" ").map((n) => n[0]).join("")}
                          </span>
                        )}
                      </div>
                      <label className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 sm:p-1.5 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                        <Camera className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={saving} />
                      </label>
                    </div>
                    <div className="flex flex-col">
                      {/* Hidden input triggered by the Change Photo button */}
                      <input
                        id="profile-photo-input"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        disabled={saving}
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById("profile-photo-input")?.click()}
                        disabled={saving}
                        className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Change Photo
                      </button>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        JPG, PNG or GIF. Max size 5MB
                      </p>
                      {profilePhoto && (
                        <button
                          onClick={handleRemovePhoto}
                          disabled={saving}
                          className="mt-1 text-xs sm:text-sm text-red-600 hover:text-red-700 transition-colors"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Profile Form - Stacked */}
                  <div className="space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
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
                          className={`w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white ${errors.name
                            ? "border-red-500"
                            : "border-gray-200 dark:border-gray-600"
                            }`}
                        />
                        {errors.name && (
                          <p className="mt-1 text-xs sm:text-sm text-red-600">
                            {errors.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
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
                          className={`w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white ${errors.email
                            ? "border-red-500"
                            : "border-gray-200 dark:border-gray-600"
                            }`}
                        />
                        {errors.email && (
                          <p className="mt-1 text-xs sm:text-sm text-red-600">
                            {errors.email}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
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
                          className={`w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white ${errors.phone
                            ? "border-red-500"
                            : "border-gray-200 dark:border-gray-600"
                            }`}
                        />
                        {errors.phone && (
                          <p className="mt-1 text-xs sm:text-sm text-red-600">
                            {errors.phone}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
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
                          className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                          Office Location
                        </label>
                        <input
                          type="text"
                          value={profile.office}
                          onChange={(e) =>
                            setProfile({ ...profile, office: e.target.value })
                          }
                          className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      {/* Section Divider */}
                      <div className="md:col-span-2">
                        <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                        <h3 className="mt-3 sm:mt-4 mb-2 text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                          Emergency Contact
                        </h3>
                      </div>

                      {/* Emergency Contact (to match coordinator UI) */}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                          Emergency Contact Name
                        </label>
                        <input
                          type="text"
                          placeholder="Optional"
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              // store alongside profile to avoid type explosion
                              // @ts-expect-error dynamic field for UI only
                              emergencyName: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                          Emergency Contact Number
                        </label>
                        <input
                          type="tel"
                          placeholder="Optional"
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              // @ts-expect-error dynamic field for UI only
                              emergencyContact: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={handleProfileUpdate}
                        disabled={saving}
                        className="flex items-center space-x-2 px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
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
                <div className="max-w-2xl space-y-4 sm:space-y-5 md:space-y-6">
                  {/* Current Password */}
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
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
                        className="w-full px-3 py-2.5 sm:px-4 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-[#212124] dark:text-white transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 sm:right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
                    <label className="block text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
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
                        className="w-full px-3 py-2.5 sm:px-4 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-[#212124] dark:text-white transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 sm:right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
                    <label className="block text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
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
                        className="w-full px-3 py-2.5 sm:px-4 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-[#212124] dark:text-white transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 sm:right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
                      onClick={handlePasswordChange}
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

                {/* Theme Settings */}
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
                          <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                            Light
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            Clean and bright interface
                          </p>
                        </div>
                      </div>
                      {theme === "light" && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
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
                          <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                            Dark
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            Easy on the eyes
                          </p>
                        </div>
                      </div>
                      {theme === "dark" && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
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
                          <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                            System
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            Follow system preference
                          </p>
                        </div>
                      </div>
                      {theme === "system" && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    Notification Preferences
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Manage your notification settings
                  </p>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div className="flex-1 pr-2 sm:pr-4">
                      <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                        Student Document Submissions
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Get notified when students submit documents for review
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
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
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div className="flex-1 pr-2 sm:pr-4">
                      <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                        Attendance Issues
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Receive alerts when students have attendance problems
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
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
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div className="flex-1 pr-2 sm:pr-4">
                      <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                        System Updates
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Receive notifications about system maintenance and updates
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
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
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      settingsService.saveNotificationPreferences?.(notifications as any);
                      // fire change event so other components can react instantly
                      try {
                        window.dispatchEvent(
                          new CustomEvent("notificationPreferencesUpdated", {
                            detail: notifications,
                          })
                        );
                      } catch { }
                      toast.success("Notification preferences saved");
                    }}
                    className="px-4 py-2 sm:px-6 sm:py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            )}

            {/* Instructor Tab */}
            {activeTab === "instructor" && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    Instructor Settings
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Manage instructor-specific preferences and workflows
                  </p>
                </div>

                {/* Document Management */}
                <div className="bg-white dark:bg-[#212124] rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="px-3 py-2.5 sm:px-4 sm:py-3 border-b border-gray-200 dark:border-gray-700 flex items-center space-x-2">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                      Document Management
                    </h3>
                  </div>
                  <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                    {/* Auto-approve */}
                    <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600">
                      <div className="flex-1 pr-2 sm:pr-4">
                        <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                          Auto-approve Documents
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          Automatically approve documents that meet criteria
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={instructorSettings.autoApproveDocuments}
                          onChange={(e) =>
                            setInstructorSettings((prev) => ({
                              ...prev,
                              autoApproveDocuments: e.target.checked,
                              requireManualReview: e.target.checked
                                ? false
                                : prev.requireManualReview,
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
                      </label>
                    </div>

                    {/* Require manual review */}
                    <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600">
                      <div className="flex-1 pr-2 sm:pr-4">
                        <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                          Require Document Review
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          All documents must be manually reviewed
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={instructorSettings.requireManualReview}
                          onChange={(e) =>
                            setInstructorSettings((prev) => ({
                              ...prev,
                              requireManualReview: e.target.checked,
                              autoApproveDocuments: e.target.checked
                                ? false
                                : prev.autoApproveDocuments,
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Announcement Settings */}
                <div className="bg-white dark:bg-[#212124] rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="px-3 py-2.5 sm:px-4 sm:py-3 border-b border-gray-200 dark:border-gray-700 flex items-center space-x-2">
                    <Megaphone className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                      Announcement Settings
                    </h3>
                  </div>
                  <div className="p-3 sm:p-4">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      Default Audience
                    </label>
                    <select
                      value={instructorSettings.defaultAnnouncementAudience}
                      onChange={(e) =>
                        setInstructorSettings((prev) => ({
                          ...prev,
                          defaultAnnouncementAudience: e.target.value,
                        }))
                      }
                      className="w-full md:max-w-md px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-700 dark:text-white"
                    >
                      <option>All Users</option>
                      <option>Students Only</option>
                      <option>Supervisors Only</option>
                      <option>Instructors Only</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      settingsService.saveInstructorSettings(
                        instructorSettings as any
                      );
                      toast.success("Instructor settings saved");
                    }}
                    className="px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
                  >
                    Save Settings
                  </button>
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
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="12hr">12-hour</option>
                      <option value="24hr">24-hour</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      settingsService.saveAppPreferences?.(preferences as any);
                      // apply theme immediately if changed via preferences
                      try {
                        window.dispatchEvent(
                          new CustomEvent("appPreferencesUpdated", {
                            detail: preferences,
                          })
                        );
                      } catch { }
                      toast.success("Preferences saved");
                    }}
                    className="px-4 py-2 sm:px-6 sm:py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            )}

            {/* Help & Support */}
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

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* FAQ */}
                  <button
                    type="button"
                    onClick={() => setHelpModal("faq")}
                    className="text-left w-full rounded-xl border border-blue-100 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors p-4 sm:p-5"
                  >
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                        <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-blue-900 dark:text-blue-100">FAQ</h3>
                        <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                          Find answers to common questions
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Contact Support */}
                  <a
                    href={`mailto:${HELP_LINKS.supportEmail}`}
                    className="block rounded-xl border border-blue-100 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors p-4 sm:p-5"
                  >
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-blue-900 dark:text-blue-100">Contact Support</h3>
                        <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                          Email: {HELP_LINKS.supportEmail}
                        </p>
                      </div>
                    </div>
                  </a>

                  {/* Coordinator Guide */}
                  <button
                    type="button"
                    onClick={() => setHelpModal("guide")}
                    className="text-left w-full rounded-xl border border-emerald-100 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors p-4 sm:p-5"
                  >
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                        <Book className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-emerald-900 dark:text-emerald-100">Coordinator Guide</h3>
                        <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-300">
                          Learn how to use coordinator features
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Privacy Policy */}
                  <button
                    type="button"
                    onClick={() => setHelpModal("privacy")}
                    className="text-left w-full rounded-xl border border-amber-100 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors p-4 sm:p-5"
                  >
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-amber-900 dark:text-amber-100">Privacy Policy</h3>
                        <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300">
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

            {/* Help Modals */}
            {helpModal && (
              <InstructorHelpModalContent
                variant={helpModal}
                onClose={() => setHelpModal(null)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorSettings;

const InstructorHelpModalContent = ({
  variant,
  onClose,
}: {
  variant: "faq" | "guide" | "privacy";
  onClose: () => void;
}) => {
  const titles = {
    faq: "Frequently Asked Questions",
    guide: "Instructor Quick Guide",
    privacy: "Privacy Overview",
  } as const;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-3 sm:px-4 py-4 sm:py-6"
      style={{ marginTop: 0 }}
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-[#212124] max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 sm:right-4 sm:top-4 rounded-full p-1.5 sm:p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          aria-label="Close help dialog"
        >
          <CloseIcon className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        <div className="px-4 pb-4 pt-5 sm:px-6 sm:pb-6 sm:pt-7 space-y-3 sm:space-y-4">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            {titles[variant]}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            {variant === "faq" && "Quick answers to the most common instructor questions."}
            {variant === "guide" && "Follow these steps to get the most out of the instructor portal."}
            {variant === "privacy" && "A short summary of how INTRAK handles instructor data."}
          </p>
        </div>

        {variant === "faq" && (
          <ul className="px-4 pb-4 sm:px-6 sm:pb-6 space-y-3 sm:space-y-4 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
            <li>
              <p className="font-semibold">How do I upload document templates?</p>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                Go to Templates, click "Upload Template", choose the category and document type,
                then upload one or more files. You can rename files before submitting.
              </p>
            </li>
            <li>
              <p className="font-semibold">Where can I verify attendance?</p>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                Open Student Monitoring, select a student, then review their recent activities and
                attendance trend. Use the details modal for weekly breakdowns.
              </p>
            </li>
            <li>
              <p className="font-semibold">How do I submit or edit evaluations?</p>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                Go to Evaluations from the sidebar, pick a student, complete the form, and submit.
                You can return to update until it's marked as finalized.
              </p>
            </li>
          </ul>
        )}

        {variant === "guide" && (
          <div className="px-4 pb-4 sm:px-6 sm:pb-6 space-y-3 sm:space-y-4 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
            <div>
              <p className="font-semibold">1. Review your dashboard daily</p>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                The dashboard highlights active students, pending items, and announcements so you can
                act quickly.
              </p>
            </div>
            <div>
              <p className="font-semibold">2. Manage documents and templates</p>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                Use Documents to review submissions; upload common formats in Templates to guide students.
              </p>
            </div>
            <div>
              <p className="font-semibold">3. Monitor progress and evaluations</p>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                Track attendance, hours, and ratings in Student Monitoring; submit evaluations on time.
              </p>
            </div>
          </div>
        )}

        {variant === "privacy" && (
          <div className="px-4 pb-4 sm:px-6 sm:pb-6 space-y-3 sm:space-y-4 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
            <p>
              INTRAK collects instructor profile details and action logs to support coordination and compliance.
            </p>
            <p>
              We do not share instructor information outside the OJT management team. Access is restricted and audited.
            </p>
            <p>
              Need a full copy of the policy? Email us at {HELP_LINKS.supportEmail} and we will send the latest PDF.
            </p>
          </div>
        )}

        <div className="px-4 pb-4 sm:px-6 sm:pb-6">
          <button
            type="button"
            onClick={onClose}
            className="ml-auto block rounded-lg bg-blue-600 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-white hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
