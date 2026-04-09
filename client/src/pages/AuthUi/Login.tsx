import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle,
  Shield,
  RefreshCw,
} from "lucide-react";
import api from "../../services/api";
import { settingsService } from "../../services/settingsService";
import i18n from "i18next";

// Import Outfit font
const outfitFont = {
  fontFamily: "'Outfit', sans-serif",
};

interface FieldErrors {
  email?: string;
  password?: string;
  general?: string;
  otp?: string;
}

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const navigate = useNavigate();

  // 2FA State
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorUserId, setTwoFactorUserId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [resendingCode, setResendingCode] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [trustDevice, setTrustDevice] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState("");

  useEffect(() => {
    const appPrefs = settingsService.loadAppPreferences();
    settingsService.applyTheme(appPrefs.theme);
    i18n.changeLanguage(appPrefs.language || "en");
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);


  // Validation functions
  const validateEmail = (email: string): string | null => {
    if (!email.trim()) {
      return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password.trim()) {
      return "Password is required";
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters";
    }
    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: FieldErrors = {};

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    setTouched({ email: true, password: true });

    return Object.keys(newErrors).length === 0;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);

    if (touched.email) {
      const error = validateEmail(value);
      setErrors((prev) => ({ ...prev, email: error || undefined }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);

    if (touched.password) {
      const error = validatePassword(value);
      setErrors((prev) => ({ ...prev, password: error || undefined }));
    }
  };

  const handleEmailBlur = () => {
    setTouched((prev) => ({ ...prev, email: true }));
    const error = validateEmail(email);
    setErrors((prev) => ({ ...prev, email: error || undefined }));
  };

  const handlePasswordBlur = () => {
    setTouched((prev) => ({ ...prev, password: true }));
    const error = validatePassword(password);
    setErrors((prev) => ({ ...prev, password: error || undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});

    // Basic validation - only block if fields are completely empty
    if (!email.trim() || !password.trim()) {
      validateForm();
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });

      // Check if 2FA is required
      if (response.data.requires2FA) {
        setRequires2FA(true);
        setTwoFactorUserId(response.data.userId);
        setResendCooldown(60); // 60 second cooldown before resend
        setLoading(false);
        return;
      }

      const { accessToken, refreshToken, user } = response.data;

      // Save tokens + user info
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));
      window.dispatchEvent(new Event("intrak:auth-token-changed"));

      // Normalize role for consistency
      const normalizedRole = user.role.toLowerCase();

      // Role-based routes
      const roleRoutes: Record<string, string> = {
        admin: "/admin",
        coordinator: "/coordinator/dashboard",
        instructor: "/instructor/dashboard",
        student: "/student/dashboard",
        industry_partner: "/industry-partner/dashboard",
      };

      // Pick route or fallback
      const route = roleRoutes[normalizedRole] || "/dashboard";
      navigate(route);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Login failed";

      // Handle specific error types
      if (
        errorMessage.toLowerCase().includes("email") ||
        errorMessage.toLowerCase().includes("user")
      ) {
        setErrors({ email: "Invalid email address" });
      } else if (
        errorMessage.toLowerCase().includes("password") ||
        errorMessage.toLowerCase().includes("credential")
      ) {
        setErrors({ password: "Incorrect password" });
      } else {
        setErrors({ general: errorMessage });
      }
      // Show forgot password link on failure
      setShowForgotPassword(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle 2FA OTP verification
  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpCode.trim() || otpCode.length !== 6) {
      setErrors({ otp: "Please enter a valid 6-digit code" });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await api.post("/auth/2fa/verify", {
        userId: twoFactorUserId,
        code: otpCode,
        trustDevice
      });

      const { accessToken, refreshToken, user } = response.data;

      // Save tokens + user info
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));
      window.dispatchEvent(new Event("intrak:auth-token-changed"));

      // Navigate to admin dashboard
      navigate("/admin");
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Verification failed";
      setErrors({ otp: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // Resend 2FA code
  const handleResendCode = async () => {
    if (resendCooldown > 0 || !twoFactorUserId) return;

    setResendingCode(true);
    setErrors({});

    try {
      await api.post("/auth/2fa/request-code", { userId: twoFactorUserId });
      setResendCooldown(60);
      setOtpCode("");
    } catch (err: any) {
      setErrors({ otp: err.response?.data?.message || "Failed to resend code" });
    } finally {
      setResendingCode(false);
    }
  };

  // Back to login from 2FA
  const handleBack2FA = () => {
    setRequires2FA(false);
    setTwoFactorUserId(null);
    setOtpCode("");
    setBackupCode("");
    setUseBackupCode(false);
    setErrors({});
  };

  // Handle backup code verification
  const handleBackupCodeVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!backupCode.trim()) {
      setErrors({ otp: "Please enter a backup code" });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await api.post("/auth/2fa/backup-codes/verify", {
        userId: twoFactorUserId,
        code: backupCode
      });

      const { accessToken, refreshToken, user } = response.data;

      // Save tokens + user info
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));
      window.dispatchEvent(new Event("intrak:auth-token-changed"));

      // Navigate based on user role
      const roleRoutes: Record<string, string> = {
        ADMIN: "/admin",
        STUDENT: "/student",
        INSTRUCTOR: "/instructor",
        COORDINATOR: "/coordinator",
        INDUSTRY_PARTNER: "/supervisor"
      };
      navigate(roleRoutes[user.role] || "/");
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Invalid backup code";
      setErrors({ otp: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');`}
      </style>
      <div className="h-screen flex overflow-hidden">
        {/* Left Section - Login Form */}
        <div className="w-full lg:flex-1 flex items-center justify-center bg-white p-4 sm:p-6 lg:p-8">
          <div className={`w-full ${requires2FA ? "max-w-sm" : "max-w-md"}`}>
            {/* Top Gap */}
            <div className={requires2FA ? "h-2" : "h-4"}></div>

            {/* Logo */}
            <div className={`flex justify-center ${requires2FA ? "mb-6" : "mb-8"}`}>
              <img
                src="/intrak_logo.png"
                alt="INTRAK Logo"
                className={requires2FA ? "h-24 w-auto" : "h-32 w-auto"}
              />
            </div>

            {/* Welcome Message */}
            <div className={`text-center ${requires2FA ? "mb-5" : "mb-6"}`}>
              <h1
                className={`font-bold text-gray-900 ${requires2FA ? "text-3xl mb-2" : "text-4xl mb-2"}`}
                style={outfitFont}
              >
                {requires2FA ? "Two-Factor Authentication" : "Welcome to INTRAK"}
              </h1>
              <p className={`text-gray-500 ${requires2FA ? "text-base" : "text-lg"}`} style={outfitFont}>
                {requires2FA
                  ? "Enter the verification code sent to your email"
                  : "Please enter your credentials to access the OJT Management System"
                }
              </p>
            </div>

            {/* 2FA Verification Form */}
            {requires2FA ? (
              <form onSubmit={handle2FAVerify} className="space-y-3">
                {/* 2FA Icon */}
                <div className="flex justify-center mb-3">
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                    <Shield className="w-7 h-7 text-blue-600" />
                  </div>
                </div>

                {/* OTP Error Message */}
                {errors.otp && (
                  <div
                    className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg text-sm"
                    style={outfitFont}
                  >
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.otp}</span>
                    </div>
                  </div>
                )}

                {useBackupCode ? (
                  /* Backup Code Input */
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label
                        className="block text-sm font-medium text-gray-700 text-center"
                        style={outfitFont}
                      >
                        Backup Code
                      </label>
                      <input
                        type="text"
                        value={backupCode}
                        onChange={(e) => {
                          setBackupCode(e.target.value.toUpperCase());
                          if (errors.otp) setErrors({});
                        }}
                        maxLength={9}
                        className="w-full py-4 text-center text-2xl font-bold tracking-widest border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="XXXX-XXXX"
                        style={outfitFont}
                        autoFocus
                      />
                      <p className="text-sm text-gray-500 text-center" style={outfitFont}>
                        Enter one of your backup recovery codes
                      </p>
                    </div>

                    {/* Verify Backup Code Button */}
                    <button
                      type="button"
                      onClick={handleBackupCodeVerify}
                      disabled={loading || backupCode.length < 8}
                      className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center justify-center space-x-2"
                      style={outfitFont}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          <span>Verify Backup Code</span>
                        </>
                      )}
                    </button>

                    {/* Switch to OTP */}
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setUseBackupCode(false);
                          setBackupCode("");
                          setErrors({});
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        style={outfitFont}
                      >
                        Use email verification code instead
                      </button>
                    </div>
                  </div>
                ) : (
                  /* OTP Input */
                  <>
                    <div className="space-y-2">
                      <label
                        className="block text-sm font-medium text-gray-700 text-center"
                        style={outfitFont}
                      >
                        Verification Code
                      </label>
                      <input
                        type="text"
                        value={otpCode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setOtpCode(value);
                          if (errors.otp) setErrors({});
                        }}
                        maxLength={6}
                        className="w-full py-3 text-center text-[2.1rem] font-bold tracking-[0.45em] border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="000000"
                        style={outfitFont}
                        autoFocus
                      />
                      <p className="text-sm text-gray-500 text-center" style={outfitFont}>
                        Enter the 6-digit code from your email
                      </p>
                    </div>

                    {/* Trust Device Checkbox */}
                    <div className="flex items-center space-x-2 px-1">
                      <input
                        type="checkbox"
                        id="trustDevice"
                        checked={trustDevice}
                        onChange={(e) => setTrustDevice(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label
                        htmlFor="trustDevice"
                        className="text-sm text-gray-700 select-none cursor-pointer"
                        style={outfitFont}
                      >
                        Trust this device for 30 days
                      </label>
                    </div>

                    {/* Verify Button */}
                    <button
                      type="submit"
                      disabled={loading || otpCode.length !== 6}
                      className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center justify-center space-x-2"
                      style={outfitFont}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          <span>Verify Code</span>
                        </>
                      )}
                    </button>

                    {/* Resend Code */}
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={resendCooldown > 0 || resendingCode}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-1 mx-auto"
                        style={outfitFont}
                      >
                        {resendingCode ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : resendCooldown > 0 ? (
                          <>
                            <RefreshCw className="w-4 h-4" />
                            <span>Resend code in {resendCooldown}s</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4" />
                            <span>Resend verification code</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Use Backup Code */}
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setUseBackupCode(true);
                          setOtpCode("");
                          setErrors({});
                        }}
                        className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                        style={outfitFont}
                      >
                        Use a backup code instead
                      </button>
                    </div>
                  </>
                )}

                {/* Back to Login */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleBack2FA}
                    className="text-sm text-gray-500 hover:text-gray-700"
                    style={outfitFont}
                  >
                    ← Back to login
                  </button>
                </div>
              </form>
            ) : (
              /* Login Form */
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* General Error Message */}
                {errors.general && (
                  <div
                    className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg text-sm"
                    style={outfitFont}
                  >
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.general}</span>
                    </div>
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                  <label
                    className="block text-sm font-medium text-gray-700"
                    style={outfitFont}
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail
                        className={`w-5 h-5 ${errors.email ? "text-red-400" : "text-gray-400"
                          }`}
                      />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      onBlur={handleEmailBlur}
                      required
                      className={`w-full pl-12 pr-12 py-4 border rounded-lg text-gray-900 placeholder-gray-400 transition-all duration-200 ${errors.email
                        ? "border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        }`}
                      placeholder="example@psu.edu.ph"
                      style={outfitFont}
                    />
                    {touched.email && !errors.email && email && (
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                    )}
                  </div>
                  {errors.email && (
                    <div
                      className="flex items-center space-x-1 text-red-500 text-sm"
                      style={outfitFont}
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.email}</span>
                    </div>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label
                    className="block text-sm font-medium text-gray-700"
                    style={outfitFont}
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock
                        className={`w-5 h-5 ${errors.password ? "text-red-400" : "text-gray-400"
                          }`}
                      />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={handlePasswordChange}
                      onBlur={handlePasswordBlur}
                      required
                      className={`w-full pl-12 pr-12 py-4 border rounded-lg text-gray-900 placeholder-gray-400 transition-all duration-200 ${errors.password
                        ? "border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        }`}
                      placeholder="••••••••"
                      style={outfitFont}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-12 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                    {touched.password && !errors.password && password && (
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                    )}
                  </div>
                  {errors.password && (
                    <div
                      className="flex items-center space-x-1 text-red-500 text-sm"
                      style={outfitFont}
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.password}</span>
                    </div>
                  )}
                </div>


                {showForgotPassword && (
                  <div className="flex justify-end">
                    <a
                      href="/forgot-password"
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      style={outfitFont}
                    >
                      Forgot Password?
                    </a>
                  </div>
                )}

                {/* Continue Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center justify-center space-x-2"
                  style={outfitFont}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <span>Continue</span>
                  )}
                </button>
              </form>
            )}

            {/* Footer Text */}
            <div
              className="mt-8 text-gray-500 text-sm leading-relaxed text-center"
              style={outfitFont}
            >
              <p>Streamline. Manage. Connect.</p>
            </div>
          </div>
        </div>

        {/* Right Section - Campus image (Hidden on Mobile/Tablet) */}
        <div className="hidden lg:flex flex-1 min-h-0 relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100">
          <img
            src="/psu-campus.png"
            alt="Pangasinan State University campus"
            className="h-full w-full object-cover object-[50%_49%]"
          />
        </div>
      </div>
    </>
  );
};

export default Login;
