import React from 'react';

interface SkeletonProps {
    /** Additional Tailwind classes for styling */
    className?: string;
    /** Width of the skeleton (e.g., 'w-full', 'w-32') */
    width?: string;
    /** Height of the skeleton (e.g., 'h-4', 'h-12') */
    height?: string;
}

/**
 * Reusable skeleton loader component.
 * Uses Tailwind utilities to create a gray pulsing placeholder.
 * Accepts optional width/height classes for flexibility.
 */
const Skeleton: React.FC<SkeletonProps> = ({ className = '', width, height }) => {
    const classes = [
        'bg-gray-200',
        'dark:bg-gray-700',
        'rounded',
        'animate-pulse',
        width,
        height,
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return <div className={classes} />;
};

export default Skeleton;
