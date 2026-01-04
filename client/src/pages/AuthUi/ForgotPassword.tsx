import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { settingsService } from "../../services/settingsService";
import { Mail, AlertCircle, Loader2, ArrowLeft } from "lucide-react";

const outfitFont = {
    fontFamily: "'Outfit', sans-serif",
};

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const appPrefs = settingsService.loadAppPreferences();
        settingsService.applyTheme(appPrefs.theme);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: data.message });
            } else {
                setMessage({ type: 'error', text: data.message || 'An error occurred' });
            }
        } catch (error) {
            console.error("Forgot password error:", error);
            setMessage({ type: 'error', text: 'Failed to connect to the server' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');`}
            </style>
            <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                    <div className="text-center mb-8">
                        <img src="/logo.jpg" alt="INTRAK Logo" className="h-20 w-auto mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900" style={outfitFont}>Forgot Password</h2>
                        <p className="text-gray-500 mt-2" style={outfitFont}>Enter your email to receive a reset link</p>
                    </div>

                    {message && (
                        <div className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`} style={outfitFont}>
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{message.text}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700" style={outfitFont}>
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="w-5 h-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    id="email"
                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="Enter your registered email"
                                    style={outfitFont}
                                />
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
                                    <span>Sending...</span>
                                </>
                            ) : (
                                "Send Reset Link"
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <Link to="/login" className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium" style={outfitFont}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ForgotPassword;
