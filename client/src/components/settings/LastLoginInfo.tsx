import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Loader2 } from 'lucide-react';
import api from '../../services/api';

const outfitFont = { fontFamily: "'Outfit', sans-serif" };

const LastLoginInfo: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [lastLoginAt, setLastLoginAt] = useState<string | null>(null);
    const [lastLoginIp, setLastLoginIp] = useState<string | null>(null);

    useEffect(() => {
        loadLastLoginInfo();
    }, []);

    const loadLastLoginInfo = async () => {
        try {
            const response = await api.get('/users/last-login');
            setLastLoginAt(response.data.lastLoginAt);
            setLastLoginIp(response.data.lastLoginIp);
        } catch (error) {
            console.error("Failed to load last login info");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'Never';
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatIp = (ip: string | null) => {
        if (!ip) return 'Unknown';
        // Clean up IP format
        if (ip.startsWith('::ffff:')) {
            return ip.replace('::ffff:', '');
        }
        return ip;
    };

    if (loading) {
        return <div className="py-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>;
    }

    return (
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2" style={outfitFont}>
                <Clock className="w-5 h-5 text-blue-500" />
                Last Login Activity
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400" style={outfitFont}>
                            Last Login
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white" style={outfitFont}>
                            {formatDate(lastLoginAt)}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400" style={outfitFont}>
                            IP Address
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white font-mono text-sm" style={outfitFont}>
                            {formatIp(lastLoginIp)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LastLoginInfo;
