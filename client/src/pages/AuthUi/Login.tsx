import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import api from "../../services/api";

// Import Outfit font
const outfitFont = {
  fontFamily: "'Outfit', sans-serif",
};

interface FieldErrors {
  email?: string;
  password?: string;
  general?: string;
}

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const navigate = useNavigate();

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
      const { accessToken, refreshToken, user } = response.data;

      // Save tokens + user info
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));

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
        <div className="flex-1 flex items-center justify-center bg-white p-8">
          <div className="w-full max-w-md">
            {/* Top Gap */}
            <div className="h-4"></div>

            {/* Logo */}
            <div className="mb-8 flex justify-center">
              <img src="/logo.jpg" alt="INTRAK Logo" className="h-32 w-auto" />
            </div>

            {/* Welcome Message */}
            <div className="text-center mb-6">
              <h1
                className="text-4xl font-bold text-gray-900 mb-2"
                style={outfitFont}
              >
                Welcome to INTRAK
              </h1>
              <p className="text-gray-500 text-lg" style={outfitFont}>
                Please enter your credentials to access the OJT Management
                System
              </p>
            </div>

            {/* Login Form */}
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
                      className={`w-5 h-5 ${
                        errors.email ? "text-red-400" : "text-gray-400"
                      }`}
                    />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                    required
                    className={`w-full pl-12 pr-12 py-4 border rounded-lg text-gray-900 placeholder-gray-400 transition-all duration-200 ${
                      errors.email
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
                      className={`w-5 h-5 ${
                        errors.password ? "text-red-400" : "text-gray-400"
                      }`}
                    />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handlePasswordChange}
                    onBlur={handlePasswordBlur}
                    required
                    className={`w-full pl-12 pr-12 py-4 border rounded-lg text-gray-900 placeholder-gray-400 transition-all duration-200 ${
                      errors.password
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

            {/* Footer Text */}
            <div
              className="mt-8 text-gray-500 text-sm leading-relaxed text-center"
              style={outfitFont}
            >
              <p>Streamline. Manage. Connect.</p>
            </div>
          </div>
        </div>

        {/* Right Section - Image */}
        <div className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
          <div className="relative">
            <img
              src="/intrak_light.jpg"
              alt="INTRAK Illustration"
              className="max-w-full h-auto"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
