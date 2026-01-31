import React, { useState, useEffect } from 'react';
import { Mail, Check, Loader2, Send, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const outfitFont = { fontFamily: "'Outfit', sans-serif" };

const EmailVerificationSettings: React.FC = () => {
    const [emailVerified, setEmailVerified] = useState(false);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState(true);
    const [resendCooldown, setResendCooldown] = useState(0);

    useEffect(() => {
        loadStatus();
    }, []);

    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const loadStatus = async () => {
        try {
            const response = await api.get('/auth/email/status');
            setEmailVerified(response.data.emailVerified);
            setEmail(response.data.email);
        } catch (error) {
            console.error("Failed to load email verification status");
        } finally {
            setLoadingStatus(false);
        }
    };

    const handleSendVerification = async () => {
        if (resendCooldown > 0) return;

        setLoading(true);
        try {
            await api.post('/auth/email/send-verification');
            toast.success("Verification email sent! Please check your inbox.");
            setResendCooldown(120); // 2 minute cooldown
        } catch (error: any) {
            if (error.response?.data?.waitSeconds) {
                setResendCooldown(error.response.data.waitSeconds);
            }
            toast.error(error.response?.data?.message || "Failed to send verification email");
        } finally {
            setLoading(false);
        }
    };

    if (loadingStatus) {
        return (
            <div className="py-4 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2" style={outfitFont}>
                <Mail className="w-5 h-5 text-blue-500" />
                Email Verification
            </h3>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div>
                    <p className="font-medium text-gray-900 dark:text-white" style={outfitFont}>
                        {email}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400" style={outfitFont}>
                        {emailVerified
                            ? "Your email is verified. You can enable 2FA."
                            : "Verify your email to enable security features like 2FA."}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {emailVerified ? (
                        <span className="flex items-center gap-1 text-sm text-green-600 bg-green-100 dark:bg-green-900/50 px-3 py-1 rounded-full" style={outfitFont}>
                            <Check className="w-4 h-4" /> Verified
                        </span>
                    ) : (
                        <>
                            <span className="flex items-center gap-1 text-sm text-amber-600 bg-amber-100 dark:bg-amber-900/50 px-3 py-1 rounded-full" style={outfitFont}>
                                <AlertCircle className="w-4 h-4" /> Not Verified
                            </span>
                            <button
                                onClick={handleSendVerification}
                                disabled={loading || resendCooldown > 0}
                                className="px-4 py-2 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                style={outfitFont}
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                                {resendCooldown > 0
                                    ? `Resend in ${resendCooldown}s`
                                    : "Send Verification"}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {!emailVerified && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-700 dark:text-blue-300" style={outfitFont}>
                        <strong>Note:</strong> After clicking "Send Verification", check your email inbox (and spam folder) for a verification link.
                        The link expires in 24 hours.
                    </p>
                </div>
            )}
        </div>
    );
};

export default EmailVerificationSettings;
