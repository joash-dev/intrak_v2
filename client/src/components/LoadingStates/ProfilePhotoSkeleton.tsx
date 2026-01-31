import React from 'react';

interface ProfilePhotoSkeletonProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

/**
 * Circular shimmer skeleton for profile photo loading states
 * Supports multiple sizes for different contexts (sidebar, settings, etc.)
 */
const ProfilePhotoSkeleton: React.FC<ProfilePhotoSkeletonProps> = ({
    size = 'md',
    className = '',
}) => {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-16 h-16 sm:w-20 sm:h-20',
        xl: 'w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28',
    };

    return (
        <div
            className={`${sizeClasses[size]} rounded-full overflow-hidden relative ${className}`}
        >
            <div
                className="absolute inset-0 bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 dark:from-gray-600 dark:via-gray-500 dark:to-gray-600"
                style={{
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s ease-in-out infinite',
                }}
            />
            <style>{`
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
};

/**
 * Profile photo with built-in loading state and error fallback
 */
interface ProfilePhotoProps {
    src: string | null;
    alt?: string;
    initials?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    loading?: boolean;
    uploading?: boolean;
    uploadProgress?: number;
    className?: string;
}

export const ProfilePhoto: React.FC<ProfilePhotoProps> = ({
    src,
    alt = 'Profile',
    initials = '?',
    size = 'md',
    loading = false,
    uploading = false,
    uploadProgress = 0,
    className = '',
}) => {
    const [imageError, setImageError] = React.useState(false);
    const [imageLoading, setImageLoading] = React.useState(!!src);

    React.useEffect(() => {
        if (src) {
            setImageError(false);
            setImageLoading(true);
        }
    }, [src]);

    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-16 h-16 sm:w-20 sm:h-20 text-lg sm:text-xl',
        xl: 'w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 text-xl sm:text-2xl md:text-3xl',
    };

    // Show skeleton during loading
    if (loading || (imageLoading && src && !imageError)) {
        return (
            <div className={`relative ${sizeClasses[size]} ${className}`}>
                <ProfilePhotoSkeleton size={size} className="!w-full !h-full" />
                {/* Hidden image to preload */}
                {src && !imageError && (
                    <img
                        src={src}
                        alt=""
                        className="hidden"
                        onLoad={() => setImageLoading(false)}
                        onError={() => {
                            setImageError(true);
                            setImageLoading(false);
                        }}
                    />
                )}
            </div>
        );
    }

    // Show upload progress
    if (uploading) {
        return (
            <div className={`relative ${sizeClasses[size]} ${className}`}>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full overflow-hidden">
                        <div
                            className="absolute bottom-0 left-0 right-0 bg-blue-400/50 transition-all duration-300"
                            style={{ height: `${uploadProgress}%` }}
                        />
                    </div>
                    <span className="relative text-white font-bold text-xs">
                        {uploadProgress}%
                    </span>
                </div>
            </div>
        );
    }

    // Show actual photo or fallback to initials
    return (
        <div
            className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center ${className}`}
        >
            {src && !imageError ? (
                <img
                    src={src}
                    alt={alt}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                />
            ) : (
                <span className="text-white font-semibold">{initials}</span>
            )}
        </div>
    );
};

export default ProfilePhotoSkeleton;
