import React from 'react';

const PageLoader: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#212124] flex items-center justify-center">
            <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-4">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
                    <img
                        src="/logo_intrak.png"
                        alt="INTRAK Logo"
                        className="relative w-full h-full object-contain animate-pulse"
                    />
                </div>
            </div>
        </div>
    );
};

export default PageLoader;
