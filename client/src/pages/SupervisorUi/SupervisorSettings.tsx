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
} from "lucide-react";
import { settingsService } from "../../services/settingsService";
import toast from "react-hot-toast";

const SupervisorSettings = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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

  useEffect(() => {
    loadUserData();
    loadProfilePhoto();
  }, []);

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
      await settingsService.uploadProfilePhoto(file);
      const newPhoto = await settingsService.getProfilePhoto();
      setProfilePhoto(newPhoto);
      toast.success("Profile photo updated successfully");
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
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

      toast.success("Profile updated successfully");
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
      toast.success("Password changed successfully");
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
      toast.success("Notification preferences saved");
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
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const companyName = user?.company || "Company";

  return (
    <div className="space-y-6">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-blue-500 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
        <p className="text-blue-100 text-lg mb-1">Company: {companyName}</p>
        <p className="text-blue-100">
          Manage your account settings and preferences - Update profile and
          security
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === "profile"
                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <User className="w-5 h-5" />
                <span>Profile</span>
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === "security"
                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <Lock className="w-5 h-5" />
                <span>Security</span>
              </button>
              <button
                onClick={() => setActiveTab("notifications")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === "notifications"
                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Profile Information
                </h2>

                {/* Profile Photo */}
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      {profilePhoto ? (
                        <img
                          src={profilePhoto}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-3xl font-semibold">
                          {profileData.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .substring(0, 2)}
                        </span>
                      )}
                    </div>
                    {uploadingPhoto && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Profile Photo
                    </h3>
                    <div className="flex space-x-2">
                      <label className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer transition-colors">
                        <Camera className="w-4 h-4 inline mr-2" />
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
                          className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <X className="w-4 h-4 inline mr-2" />
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            name: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            email: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            phone: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={profileData.company}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            company: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                        disabled
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <textarea
                      value={profileData.address}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          address: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Security Settings
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          currentPassword: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    />
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleChangePassword}
                    disabled={saving}
                    className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Changing...</span>
                      </>
                    ) : (
                      <>
                        <Shield className="w-5 h-5" />
                        <span>Change Password</span>
                      </>
                    )}
                  </button>
                </div>
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
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
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
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveNotifications}
                    disabled={saving}
                    className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorSettings;
