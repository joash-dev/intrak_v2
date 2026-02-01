/**
 * INTRAK System Constants
 * Centralized configuration values to avoid magic numbers/strings
 */

// ===== Authentication =====
export const AUTH = {
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    REFRESH_TOKEN_EXPIRY: '7d',
    ACCESS_TOKEN_EXPIRY: '15m',
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
    OTP_EXPIRY: 10 * 60 * 1000, // 10 minutes
    TRUSTED_DEVICE_EXPIRY: 30 * 24 * 60 * 60 * 1000, // 30 days
    BACKUP_CODES_COUNT: 10,
} as const;

// ===== File Upload =====
export const FILE_UPLOAD = {
    MAX_FILE_SIZE: 25 * 1024 * 1024, // 25MB
    MAX_PROFILE_PHOTO_SIZE: 2 * 1024 * 1024, // 2MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
} as const;

// ===== Pagination =====
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
} as const;

// ===== Password Requirements =====
export const PASSWORD = {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: false,
} as const;

// ===== User Roles =====
export const ROLES = {
    ADMIN: 'ADMIN',
    STUDENT: 'STUDENT',
    INSTRUCTOR: 'INSTRUCTOR',
    COORDINATOR: 'COORDINATOR',
    INDUSTRY_PARTNER: 'INDUSTRY_PARTNER',
} as const;

// ===== Internship =====
export const INTERNSHIP = {
    REQUIRED_HOURS: 486,
    WORK_HOURS_PER_DAY: 8,
} as const;

// ===== Status Labels =====
export const STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    COMPLETED: 'completed',
} as const;

// ===== API Endpoints (for reference) =====
export const API_ROUTES = {
    AUTH: '/api/auth',
    USERS: '/api/users',
    STUDENTS: '/api/students',
    DOCUMENTS: '/api/documents',
    ATTENDANCE: '/api/attendance',
    COMPANIES: '/api/companies',
    NOTIFICATIONS: '/api/notifications',
} as const;

// ===== UI Constants =====
export const UI = {
    TOAST_DURATION: 4000, // 4 seconds
    DEBOUNCE_DELAY: 300, // 300ms
    ANIMATION_DURATION: 200, // 200ms
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
export type Status = typeof STATUS[keyof typeof STATUS];
