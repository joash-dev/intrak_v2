import React, { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { PASSWORD } from '../../constants';

interface PasswordStrengthMeterProps {
    password: string;
    showRequirements?: boolean;
}

interface StrengthResult {
    score: number;
    label: string;
    color: string;
    bgColor: string;
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
    password,
    showRequirements = true
}) => {
    const requirements = useMemo(() => {
        return [
            {
                label: `At least ${PASSWORD.MIN_LENGTH} characters`,
                met: password.length >= PASSWORD.MIN_LENGTH,
            },
            {
                label: 'Contains uppercase letter',
                met: /[A-Z]/.test(password),
            },
            {
                label: 'Contains lowercase letter',
                met: /[a-z]/.test(password),
            },
            {
                label: 'Contains a number',
                met: /\d/.test(password),
            },
            {
                label: 'Contains special character',
                met: /[!@#$%^&*(),.?":{}|<>]/.test(password),
            },
        ];
    }, [password]);

    const strength: StrengthResult = useMemo(() => {
        if (!password) {
            return { score: 0, label: '', color: 'bg-gray-200', bgColor: 'bg-gray-100' };
        }

        const metCount = requirements.filter(r => r.met).length;

        if (metCount <= 1) {
            return { score: 20, label: 'Very Weak', color: 'bg-red-500', bgColor: 'bg-red-100' };
        } else if (metCount === 2) {
            return { score: 40, label: 'Weak', color: 'bg-orange-500', bgColor: 'bg-orange-100' };
        } else if (metCount === 3) {
            return { score: 60, label: 'Fair', color: 'bg-yellow-500', bgColor: 'bg-yellow-100' };
        } else if (metCount === 4) {
            return { score: 80, label: 'Strong', color: 'bg-green-500', bgColor: 'bg-green-100' };
        } else {
            return { score: 100, label: 'Very Strong', color: 'bg-emerald-500', bgColor: 'bg-emerald-100' };
        }
    }, [password, requirements]);

    if (!password) return null;

    return (
        <div className="mt-2 space-y-3">
            {/* Strength Bar */}
            <div className="space-y-1">
                <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Password Strength
                    </span>
                    <span className={`text-xs font-semibold ${strength.score <= 40 ? 'text-red-600' :
                            strength.score <= 60 ? 'text-yellow-600' :
                                'text-green-600'
                        }`}>
                        {strength.label}
                    </span>
                </div>
                <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ease-out ${strength.color} rounded-full`}
                        style={{ width: `${strength.score}%` }}
                    />
                </div>
            </div>

            {/* Requirements Checklist */}
            {showRequirements && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {requirements.map((req, index) => (
                        <div
                            key={index}
                            className={`flex items-center gap-2 text-xs ${req.met
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}
                        >
                            {req.met ? (
                                <Check className="w-3 h-3 flex-shrink-0" />
                            ) : (
                                <X className="w-3 h-3 flex-shrink-0" />
                            )}
                            <span>{req.label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PasswordStrengthMeter;
