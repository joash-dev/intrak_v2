import React, { useState, useEffect } from 'react';
import { Shield, Check, Loader2, X, Lock, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const outfitFont = { fontFamily: "'Outfit', sans-serif" };

const TwoFactorSettings: React.FC = () => {
    const [enabled, setEnabled] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showDisableModal, setShowDisableModal] = useState(false);
    const [password, setPassword] = useState("");
    const [loadingStatus, setLoadingStatus] = useState(true);

    // Load status
    useEffect(() => {
        loadStatus();
    }, []);

    const loadStatus = async () => {
        try {
            const response = await api.get('/auth/2fa/status');
            setEnabled(response.data.enabled);
        } catch (error) {
            console.error("Failed to load 2FA status");
        } finally {
            setLoadingStatus(false);
        }
    };

    const handleEnable = async () => {
        setLoading(true);
        try {
            await api.post('/auth/2fa/enable');
            setEnabled(true);
            toast.success("Two-factor authentication enabled! You'll need to verify via email on next login.");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to enable 2FA");
        } finally {
            setLoading(false);
        }
    };

    const handleDisable = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password.trim()) {
            toast.error("Password is required");
            return;
        }
        setLoading(true);
        try {
            await api.post('/auth/2fa/disable', { password });
            setEnabled(false);
            setShowDisableModal(false);
            setPassword("");
            toast.success("Two-factor authentication disabled");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to disable 2FA");
        } finally {
            setLoading(false);
        }
    };

    if (loadingStatus) {
        return <div className="py-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>;
    }

    return (
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2" style={outfitFont}>
                <Shield className="w-5 h-5 text-purple-500" />
                Two-Factor Authentication
            </h3>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div>
                    <p className="font-medium text-gray-900 dark:text-white" style={outfitFont}>
                        Email Verification Code
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400" style={outfitFont}>
                        Receive a verification code via email when logging in
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {enabled ? (
                        <span className="flex items-center gap-1 text-sm text-green-600 bg-green-100 dark:bg-green-900/50 px-3 py-1 rounded-full" style={outfitFont}>
                            <Check className="w-4 h-4" /> Enabled
                        </span>
                    ) : (
                        <span className="text-sm text-gray-500" style={outfitFont}>Disabled</span>
                    )}
                    <button
                        onClick={enabled ? () => setShowDisableModal(true) : handleEnable}
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${enabled
                            ? "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-400"
                            : "bg-purple-600 text-white hover:bg-purple-700"
                            } disabled:opacity-50`}
                        style={outfitFont}
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : enabled ? (
                            "Disable"
                        ) : (
                            "Enable"
                        )}
                    </button>
                </div>
            </div>

            {/* Disable 2FA Modal */}
            {showDisableModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white" style={outfitFont}>
                                Disable Two-Factor Auth
                            </h3>
                            <button
                                onClick={() => setShowDisableModal(false)}
                                className="text-gray-400 hover:text-gray-500 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleDisable} className="p-6 space-y-4">
                            <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 p-4 rounded-lg flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <p className="text-sm" style={outfitFont}>
                                    Disabling 2FA will make your account less secure. Are you sure you want to continue?
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" style={outfitFont}>
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Enter your password"
                                        required
                                        style={outfitFont}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowDisableModal(false)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                                    style={outfitFont}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                                    style={outfitFont}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Disabling...</span>
                                        </>
                                    ) : (
                                        "Disable 2FA"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TwoFactorSettings;
