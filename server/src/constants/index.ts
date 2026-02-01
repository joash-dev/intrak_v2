/**
 * INTRAK Server Constants
 * Centralized configuration values for the backend
 */

// ===== Authentication =====
export const AUTH = {
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes in ms
    REFRESH_TOKEN_EXPIRY: '7d',
    ACCESS_TOKEN_EXPIRY: '15m',
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes in ms
    OTP_EXPIRY: 10 * 60 * 1000, // 10 minutes in ms
    TRUSTED_DEVICE_EXPIRY: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
    BACKUP_CODES_COUNT: 10,
    BACKUP_CODE_LENGTH: 8,
} as const;

// ===== File Upload =====
export const FILE_UPLOAD = {
    MAX_FILE_SIZE: 25 * 1024 * 1024, // 25MB
    MAX_PROFILE_PHOTO_SIZE: 2 * 1024 * 1024, // 2MB
    ALLOWED_IMAGE_MIMES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    ALLOWED_DOCUMENT_MIMES: [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    UPLOAD_DIR: './uploads',
    PROFILE_PHOTOS_DIR: './uploads/profile-photos',
    DOCUMENTS_DIR: './uploads/documents',
    TEMPLATES_DIR: './uploads/templates',
} as const;

// ===== Pagination =====
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
} as const;

// ===== Password Requirements =====
export const PASSWORD = {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    SALT_ROUNDS: 12,
} as const;

// ===== Rate Limiting =====
export const RATE_LIMIT = {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
    LOGIN_WINDOW_MS: 15 * 60 * 1000,
    LOGIN_MAX_ATTEMPTS: 5,
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

// ===== Document Status =====
export const DOCUMENT_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    REVISION_REQUESTED: 'revision_requested',
} as const;

// ===== Attendance Status =====
export const ATTENDANCE_STATUS = {
    PRESENT: 'PRESENT',
    ABSENT: 'ABSENT',
    LATE: 'LATE',
    EXCUSED: 'EXCUSED',
} as const;

// ===== HTTP Status Codes =====
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
} as const;

// ===== Error Messages =====
export const ERROR_MESSAGES = {
    UNAUTHORIZED: 'Authentication required',
    FORBIDDEN: 'Access denied',
    NOT_FOUND: 'Resource not found',
    INVALID_CREDENTIALS: 'Invalid email or password',
    ACCOUNT_LOCKED: 'Account temporarily locked due to too many failed attempts',
    TOKEN_EXPIRED: 'Token has expired',
    INVALID_TOKEN: 'Invalid or malformed token',
    USER_EXISTS: 'User with this email already exists',
    STUDENT_NUMBER_EXISTS: 'Student with this number already exists',
    PASSWORD_MISMATCH: 'Passwords do not match',
    WEAK_PASSWORD: 'Password does not meet security requirements',
    FILE_TOO_LARGE: 'File size exceeds the maximum allowed limit',
    INVALID_FILE_TYPE: 'File type not allowed',
    EMAIL_NOT_VERIFIED: 'Email address not verified',
    TWO_FA_REQUIRED: 'Two-factor authentication required',
    INVALID_OTP: 'Invalid or expired verification code',
    INVALID_BACKUP_CODE: 'Invalid or already used backup code',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
export type DocumentStatus = typeof DOCUMENT_STATUS[keyof typeof DOCUMENT_STATUS];
export type AttendanceStatus = typeof ATTENDANCE_STATUS[keyof typeof ATTENDANCE_STATUS];
