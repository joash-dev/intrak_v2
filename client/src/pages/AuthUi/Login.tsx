import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Cpu,
  Code,
  Database,
  Network,
  Shield,
  Zap,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  Loader2,
} from "lucide-react";
import api from "../../services/api";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

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
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Tech Icons */}
        <div className="absolute top-20 left-10 animate-float">
          <Cpu className="w-8 h-8 text-purple-400/30" />
        </div>
        <div className="absolute top-40 right-20 animate-float-delayed">
          <Code className="w-6 h-6 text-blue-400/30" />
        </div>
        <div className="absolute top-60 left-1/4 animate-float">
          <Database className="w-10 h-10 text-cyan-400/20" />
        </div>
        <div className="absolute bottom-40 right-1/3 animate-float-delayed">
          <Network className="w-7 h-7 text-purple-400/25" />
        </div>
        <div className="absolute bottom-60 left-20 animate-float">
          <Shield className="w-6 h-6 text-green-400/30" />
        </div>
        <div className="absolute top-1/3 right-10 animate-float-delayed">
          <Zap className="w-5 h-5 text-yellow-400/30" />
        </div>

        {/* Circuit Pattern Overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full bg-[radial-gradient(circle_at_1px_1px,_white_1px,_transparent_0)] bg-[length:50px_50px] animate-pulse"></div>
        </div>

        {/* Gradient Orbs */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob-delayed"></div>
        <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob-slow"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl mb-4 shadow-lg">
                <Cpu className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                INTRAK
              </h1>
              <p className="text-gray-300 mt-2 text-lg">
                OJT Management System
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Computer Engineering Department
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-4 rounded-xl text-sm backdrop-blur-sm">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                    placeholder="your.email@university.edu"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 group"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 text-gray-400 text-sm">
            <p>© 2025 Computer Engineering Department</p>
            <p className="mt-1">Secure • Reliable • Professional</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
