import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

const VerifyEmail: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyToken = async () => {
            const token = searchParams.get('token');

            if (!token) {
                setStatus('error');
                setMessage('No verification token provided.');
                return;
            }

            try {
                const response = await api.post('/auth/email/verify', { token });
                setStatus('success');
                setMessage(response.data.message || 'Email verified successfully!');
            } catch (error: any) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Failed to verify email. The link may have expired.');
            }
        };

        verifyToken();
    }, [searchParams]);

    const handleContinue = () => {
        navigate('/login');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
                {status === 'loading' && (
                    <>
                        <Loader2 className="w-16 h-16 mx-auto text-blue-500 animate-spin mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Verifying Email
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Please wait while we verify your email address...
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-10 h-10 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Email Verified!
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            {message}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                            You can now enable Two-Factor Authentication in your settings.
                        </p>
                        <button
                            onClick={handleContinue}
                            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                        >
                            Continue to Login
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mb-4">
                            <XCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Verification Failed
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            {message}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                            Please try requesting a new verification email from your account settings.
                        </p>
                        <button
                            onClick={handleContinue}
                            className="w-full py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                        >
                            Go to Login
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
