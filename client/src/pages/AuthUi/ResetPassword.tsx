import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { settingsService } from "../../services/settingsService";
import { Lock, AlertCircle, Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";

const outfitFont = {
    fontFamily: "'Outfit', sans-serif",
};

const ResetPassword = () => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");

    useEffect(() => {
        const appPrefs = settingsService.loadAppPreferences();
        settingsService.applyTheme(appPrefs.theme);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: "Passwords do not match" });
            return;
        }

        if (password.length < 8) {
            setMessage({ type: 'error', text: "Password must be at least 8 characters long" });
            return;
        }

        if (!token) {
            setMessage({ type: 'error', text: "Invalid or missing reset token" });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, newPassword: password }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: "Password reset successfully. Redirecting to login..." });
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                setMessage({ type: 'error', text: data.message || 'An error occurred' });
            }
        } catch (error) {
            console.error("Reset password error:", error);
            setMessage({ type: 'error', text: 'Failed to connect to the server' });
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
                    <div className="mb-4 flex justify-center text-red-100 bg-red-100 rounded-full w-16 h-16 items-center mx-auto">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2" style={outfitFont}>Invalid Link</h2>
                    <p className="mb-6 text-gray-500" style={outfitFont}>The password reset link is invalid or has expired.</p>
                    <Link to="/login" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium" style={outfitFont}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Return to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <>
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');`}
            </style>
            <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                    <div className="text-center mb-8">
                        <img src="/logo.jpg" alt="INTRAK Logo" className="h-20 w-auto mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900" style={outfitFont}>Reset Password</h2>
                        <p className="text-gray-500 mt-2" style={outfitFont}>Enter your new password below</p>
                    </div>

                    {message && (
                        <div className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`} style={outfitFont}>
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{message.text}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700" style={outfitFont}>
                                New Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="w-5 h-5 text-gray-400" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    placeholder="••••••••"
                                    style={outfitFont}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700" style={outfitFont}>
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="w-5 h-5 text-gray-400" />
                                </div>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    id="confirmPassword"
                                    className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    placeholder="••••••••"
                                    style={outfitFont}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors flex items-center justify-center font-semibold"
                            disabled={loading}
                            style={outfitFont}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    <span>Resetting...</span>
                                </>
                            ) : (
                                "Set New Password"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default ResetPassword;
