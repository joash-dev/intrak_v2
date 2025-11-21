# Intrak V2 - System Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Technology Stack](#technology-stack)
4. [System Layers](#system-layers)
5. [Frontend Architecture](#frontend-architecture)
6. [Backend Architecture](#backend-architecture)
7. [Database Architecture](#database-architecture)
8. [API Architecture](#api-architecture)
9. [Authentication & Authorization](#authentication--authorization)
10. [Data Flow](#data-flow)
11. [Security Architecture](#security-architecture)
12. [Deployment Architecture](#deployment-architecture)

---

## Overview

**Intrak V2** is a comprehensive OJT (On-the-Job Training) / Internship Management System designed to manage the entire lifecycle of student internships, from application to completion. The system follows a **3-tier architecture** pattern with clear separation between presentation, business logic, and data layers.

### System Purpose
- Student internship application and management
- Document submission and approval workflow
- Attendance tracking with multiple verification methods (QR, GPS, IP, Facial)
- Company partnership management
- Evaluation and reporting
- Communication and notifications

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React + TypeScript + Vite                                │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐│  │
│  │  │ Student  │  │Instructor│  │Coordinator│  │   Admin  ││  │
│  │  │   UI     │  │   UI     │  │    UI     │  │    UI    ││  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘│  │
│  │  ┌──────────────────────────────────────────────────────┐│  │
│  │  │  Services Layer (API Clients)                        ││  │
│  │  │  - authService, studentService, documentService     ││  │
│  │  │  - attendanceService, companyService, etc.          ││  │
│  │  └──────────────────────────────────────────────────────┘│  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/REST API
                              │ (Axios)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SERVER LAYER                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Express.js + TypeScript + Node.js                      │  │
│  │                                                          │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │  │
│  │  │  Middleware  │  │   Routes     │  │ Controllers  │ │  │
│  │  │  - Auth      │  │  - /api/auth │  │  - Business  │ │  │
│  │  │  - RateLimit │  │  - /api/...  │  │    Logic     │ │  │
│  │  │  - CORS       │  │              │  │              │ │  │
│  │  │  - Error      │  │              │  │              │ │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │  │
│  │                              │                         │  │
│  │                              ▼                         │  │
│  │  ┌──────────────────────────────────────────────┐     │  │
│  │  │  Services Layer                               │     │  │
│  │  │  - Business Logic                            │     │  │
│  │  │  - Data Validation                           │     │  │
│  │  │  - File Processing                           │     │  │
│  │  │  - Email Service                            │     │  │
│  │  └──────────────────────────────────────────────┘     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Prisma ORM
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database                                     │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │   Users &    │  │  Documents & │  │  Attendance  │  │  │
│  │  │   Students   │  │  Templates   │  │  & Logs      │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │  Companies & │  │ Evaluations  │  │ Notifications│  │  │
│  │  │ Applications │  │  & Reports   │  │  & Alerts    │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
│  - File Storage (Local/Network Attached Storage)                 │
│  - Email Service (SMTP)                                          │
│  - QR Code Generation                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router
- **State Management**: React Context API + Hooks
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Tailwind
- **Internationalization**: i18next
- **Form Handling**: React Hook Form (implied from structure)

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Validation**: Express validators
- **Logging**: Morgan
- **Security**: Helmet, CORS, Rate Limiting

### Database
- **Database**: PostgreSQL
- **ORM**: Prisma Client
- **Migrations**: Prisma Migrate

### Development Tools
- **Package Manager**: npm
- **Type Checking**: TypeScript
- **Code Quality**: ESLint
- **Testing**: Jest (backend)

---

## System Layers

### 1. Presentation Layer (Frontend)
- **Location**: `client/src/`
- **Components**: 
  - Role-based UI pages (Student, Instructor, Coordinator, Admin)
  - Reusable components
  - Service layer for API communication
- **Responsibilities**:
  - User interface rendering
  - User interaction handling
  - Form validation (client-side)
  - State management
  - API communication

### 2. Application Layer (Backend)
- **Location**: `server/src/`
- **Components**:
  - Routes (`routes/`)
  - Controllers (`controllers/`)
  - Services (`services/`)
  - Middleware (`middleware/`)
- **Responsibilities**:
  - Request handling
  - Business logic
  - Data validation
  - Authentication & authorization
  - File processing
  - Email notifications

### 3. Data Layer (Database)
- **Location**: `server/prisma/`
- **Components**:
  - Prisma Schema
  - Database migrations
  - Prisma Client
- **Responsibilities**:
  - Data persistence
  - Data relationships
  - Data integrity
  - Query optimization

---

## Frontend Architecture

### Directory Structure
```
client/src/
├── api/                    # API client configuration
│   └── AxiosClient.ts      # Axios instance with interceptors
├── components/             # Reusable UI components
│   ├── admin/              # Admin-specific components
│   ├── document/           # Document-related components
│   ├── LoadingStates/      # Loading indicators
│   └── ...
├── contexts/               # React Context providers
├── hooks/                  # Custom React hooks
│   ├── useOptimizedData.ts
│   └── usePerformanceMonitor.ts
├── pages/                  # Page components (route-level)
│   ├── AdminUi/            # Admin pages
│   ├── AuthUi/             # Authentication pages
│   ├── CoordinatorUi/      # Coordinator pages
│   ├── InstructorUi/       # Instructor pages
│   ├── StudentUi/          # Student pages
│   └── SupervisorUi/       # Supervisor pages
├── services/               # API service layer
│   ├── authService.ts
│   ├── studentService.ts
│   ├── documentService.ts
│   ├── attendanceService.ts
│   ├── companyService.ts
│   └── ...
├── types/                  # TypeScript type definitions
├── utils/                  # Utility functions
│   └── attendanceCalculations.ts
├── App.tsx                 # Main app component with routing
├── main.tsx                # Application entry point
└── i18n.ts                 # Internationalization setup
```

### Key Frontend Patterns

#### 1. Service Layer Pattern
Each domain has a dedicated service file that encapsulates API calls:
- `authService.ts` - Authentication operations
- `studentService.ts` - Student-related operations
- `documentService.ts` - Document management
- `attendanceService.ts` - Attendance tracking
- `companyService.ts` - Company operations

#### 2. Role-Based Routing
The application uses role-based routing where different user roles see different UI:
- `/student/*` - Student interface
- `/instructor/*` - Instructor interface
- `/coordinator/*` - Coordinator interface
- `/admin/*` - Admin interface

#### 3. Component Organization
- **Pages**: Route-level components that compose smaller components
- **Components**: Reusable UI components
- **Services**: API communication layer
- **Utils**: Shared utility functions

#### 4. State Management
- React Context API for global state (auth, theme, etc.)
- Local component state with hooks
- Optimized data fetching hooks

---

## Backend Architecture

### Directory Structure
```
server/src/
├── config/                 # Configuration files
│   ├── database.ts         # Database connection
│   └── nas.ts              # Network Attached Storage config
├── controllers/            # Request handlers
│   ├── auth.controller.ts
│   ├── student.controller.ts
│   ├── document.controller.ts
│   ├── attendance.controller.ts
│   └── ...
├── middleware/             # Express middleware
│   ├── auth.ts             # JWT authentication
│   ├── rateLimiter.ts      # Rate limiting
│   ├── errorHandler.ts     # Error handling
│   ├── maintenance.ts      # Maintenance mode
│   └── ...
├── routes/                 # API route definitions
│   ├── auth.routes.ts
│   ├── student.routes.ts
│   ├── document.routes.ts
│   └── ...
├── services/               # Business logic layer
│   ├── auth.service.ts
│   ├── student.service.ts
│   ├── document.service.ts
│   └── ...
├── utils/                  # Utility functions
│   ├── fileUpload.ts
│   ├── email.ts
│   └── ...
├── types/                  # TypeScript types
├── templates/              # Email/document templates
└── index.ts                # Application entry point
```

### Backend Patterns

#### 1. MVC-like Architecture
- **Routes**: Define API endpoints and HTTP methods
- **Controllers**: Handle HTTP requests/responses
- **Services**: Contain business logic
- **Models**: Prisma models (database schema)

#### 2. Middleware Chain
Request flow through middleware:
1. **Helmet** - Security headers
2. **CORS** - Cross-origin resource sharing
3. **Compression** - Response compression
4. **Morgan** - Request logging
5. **Body Parsers** - JSON/URL-encoded parsing
6. **Rate Limiting** - Request throttling
7. **Authentication** - JWT verification
8. **Maintenance Mode** - System maintenance check
9. **Route Handler** - Business logic
10. **Error Handler** - Error processing

#### 3. Service Layer Pattern
Business logic is separated into service classes:
- Data validation
- Business rules
- Database operations
- External service integration

---

## Database Architecture

### Database: PostgreSQL

### Schema Organization
The database schema is defined using Prisma and includes:

#### Core Entities
1. **User** - Base user model for all roles
2. **Student** - Student-specific information
3. **Company** - Industry partner companies
4. **CompanyApplication** - Student applications to companies

#### Document Management
5. **Document** - Student-uploaded documents
6. **DocumentTemplate** - Document templates
7. **DocumentFeedback** - Feedback on documents

#### Attendance & Evaluation
8. **AttendanceLog** - Attendance records
9. **QRToken** - QR codes for attendance
10. **Evaluation** - Student evaluations

#### Communication
11. **Announcement** - System announcements
12. **Notification** - User notifications
13. **PartnershipMessage** - Messages between students and partners

#### System Management
14. **AuditLog** - System audit trail
15. **Activity** - Activity logs
16. **SystemAlert** - System alerts
17. **AdminSettings** - Admin settings
18. **CoordinatorSettings** - Coordinator settings
19. **RefreshToken** - JWT refresh tokens

### Relationships
- **One-to-One**: User ↔ Student, User ↔ AdminSettings
- **One-to-Many**: User → Documents, Student → AttendanceLogs
- **Many-to-One**: Students → Company, Documents → Student
- **Many-to-Many**: (via junction tables)

### Data Integrity
- Foreign key constraints with cascade deletes
- Unique constraints (email, studentNumber)
- Indexes for performance
- Enums for type safety

---

## API Architecture

### API Structure
All APIs are prefixed with `/api/`

### Main API Endpoints

#### Authentication (`/api/auth`)
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout

#### Students (`/api/students`)
- `GET /api/students` - List students
- `GET /api/students/:id` - Get student details
- `PUT /api/students/:id` - Update student
- `POST /api/students` - Create student

#### Documents (`/api/documents`)
- `GET /api/documents` - List documents
- `POST /api/documents` - Upload document
- `GET /api/documents/:id` - Get document
- `PUT /api/documents/:id/approve` - Approve document
- `PUT /api/documents/:id/reject` - Reject document

#### Attendance (`/api/attendance`)
- `GET /api/attendance` - Get attendance logs
- `POST /api/attendance` - Log attendance
- `POST /api/attendance/qr` - Verify QR attendance
- `PUT /api/attendance/:id` - Update attendance

#### Companies (`/api/companies`)
- `GET /api/companies` - List companies
- `POST /api/companies` - Create company
- `GET /api/companies/:id` - Get company details
- `PUT /api/companies/:id` - Update company

#### Company Applications (`/api/company-applications`)
- `GET /api/company-applications` - List applications
- `POST /api/company-applications` - Submit application
- `PUT /api/company-applications/:id/approve` - Approve application
- `PUT /api/company-applications/:id/reject` - Reject application

#### Admin (`/api/admin`)
- System management endpoints
- User management
- Settings management

#### Coordinator (`/api/coordinator`)
- Coordinator-specific operations
- Bulk operations
- Reports

### API Response Format
```typescript
// Success Response
{
  success: true,
  data: { ... },
  message?: string
}

// Error Response
{
  success: false,
  error: string,
  message: string,
  details?: any
}
```

### Authentication
- JWT tokens in `Authorization: Bearer <token>` header
- Refresh tokens for token renewal
- Role-based access control

---

## Authentication & Authorization

### Authentication Flow

```
1. User Login
   ↓
2. Server validates credentials
   ↓
3. Server generates JWT access token + refresh token
   ↓
4. Tokens sent to client
   ↓
5. Client stores tokens (localStorage/sessionStorage)
   ↓
6. Client includes token in API requests
   ↓
7. Server validates token on each request
   ↓
8. If token expired, use refresh token
   ↓
9. Generate new access token
```

### Authorization Levels

#### Role Hierarchy
1. **ADMIN** - Full system access
2. **COORDINATOR** - Student/company management
3. **INSTRUCTOR** - Student supervision, document review
4. **STUDENT** - Personal data, document upload, attendance
5. **INDUSTRY_PARTNER** - Company information, student communication

### Permission Matrix

| Action | Admin | Coordinator | Instructor | Student | Partner |
|--------|-------|-------------|------------|--------|---------|
| View all students | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create student | ✅ | ✅ | ❌ | ❌ | ❌ |
| Upload document | ✅ | ✅ | ✅ | ✅ | ❌ |
| Approve document | ✅ | ✅ | ✅ | ❌ | ❌ |
| View attendance | ✅ | ✅ | ✅ | ✅ (own) | ❌ |
| Create company | ✅ | ✅ | ❌ | ❌ | ❌ |
| Submit application | ❌ | ❌ | ❌ | ✅ | ❌ |
| Review application | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## Data Flow

### Document Upload Flow
```
1. Student selects file
   ↓
2. Frontend validates file (size, type)
   ↓
3. Frontend uploads to /api/documents
   ↓
4. Backend validates file
   ↓
5. Backend saves file to storage
   ↓
6. Backend creates document record in DB
   ↓
7. Backend sends notification to reviewer
   ↓
8. Reviewer views document
   ↓
9. Reviewer approves/rejects
   ↓
10. Notification sent to student
```

### Attendance Logging Flow
```
1. Student logs attendance (QR/GPS/IP/Manual)
   ↓
2. Frontend sends request to /api/attendance
   ↓
3. Backend validates location (if GPS)
   ↓
4. Backend verifies QR token (if QR)
   ↓
5. Backend creates attendance log
   ↓
6. Backend updates student completed hours
   ↓
7. Frontend updates UI
```

### Company Application Flow
```
1. Student browses companies
   ↓
2. Student applies to company
   ↓
3. Application saved with PENDING status
   ↓
4. Coordinator/Instructor reviews
   ↓
5. Application approved/rejected
   ↓
6. Student notified
   ↓
7. If approved, student assigned to company
```

---

## Security Architecture

### Security Measures

#### 1. Authentication Security
- JWT tokens with expiration
- Refresh token rotation
- Password hashing (bcrypt)
- Rate limiting on login endpoints

#### 2. API Security
- CORS configuration
- Helmet.js security headers
- Rate limiting per endpoint
- Input validation and sanitization
- SQL injection prevention (Prisma ORM)

#### 3. File Security
- File type validation
- File size limits
- Secure file storage
- Virus scanning (if implemented)

#### 4. Authorization Security
- Role-based access control (RBAC)
- Route-level authorization
- Resource-level authorization
- Audit logging

#### 5. Data Security
- Encrypted passwords
- Secure token storage
- HTTPS enforcement
- Data validation

### Security Headers (Helmet)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security
- Content-Security-Policy

---

## Deployment Architecture

### Development Environment
```
Frontend: Vite Dev Server (localhost:5173)
Backend:  Node.js/Express (localhost:5000)
Database: PostgreSQL (localhost:5432)
```

### Production Environment
```
┌─────────────────────────────────────────┐
│         Load Balancer / CDN             │
└─────────────────────────────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
┌───▼────┐        ┌─────▼───┐
│Frontend│        │ Backend │
│ (Vite) │        │(Express)│
│Static  │        │  API    │
└───┬────┘        └─────┬───┘
    │                   │
    │                   │
    │            ┌──────▼──────┐
    │            │  PostgreSQL │
    │            │  Database   │
    │            └─────────────┘
    │
┌───▼────────────┐
│  File Storage  │
│  (NAS/Local)   │
└────────────────┘
```

### Deployment Considerations
- **Frontend**: Static files served via CDN or web server
- **Backend**: Node.js process (PM2, Docker, or cloud service)
- **Database**: Managed PostgreSQL or self-hosted
- **File Storage**: Network Attached Storage (NAS) or cloud storage
- **Environment Variables**: Secure configuration management
- **SSL/TLS**: HTTPS for all communications
- **Monitoring**: Health checks, logging, error tracking

### Environment Configuration
- Development: `.env.development`
- Production: `.env.production`
- Test: `.env.test`

---

## Performance Optimizations

### Frontend
- Code splitting with React.lazy()
- Virtual scrolling for large lists
- Debounced search inputs
- Optimized image loading
- Caching strategies

### Backend
- Database query optimization
- Connection pooling
- Response compression
- Caching (if implemented)
- Rate limiting

### Database
- Indexes on frequently queried columns
- Efficient foreign key relationships
- Query optimization
- Connection pooling

---

## Monitoring & Logging

### Logging
- **Morgan**: HTTP request logging
- **Console**: Application logs
- **Audit Logs**: User actions in database
- **Activity Logs**: System activities

### Monitoring
- Health check endpoint (`/health`)
- Error tracking
- Performance monitoring
- User activity tracking

---

## Future Enhancements

### Potential Additions
- Real-time notifications (WebSockets)
- Mobile application (React Native)
- Advanced analytics dashboard
- Document e-signature integration
- Facial recognition for attendance
- Automated report generation
- Integration with external systems
- Multi-tenant support

---

## Conclusion

Intrak V2 follows a modern, scalable architecture with clear separation of concerns. The 3-tier architecture (Frontend, Backend, Database) provides:

- **Maintainability**: Clear code organization
- **Scalability**: Can scale each layer independently
- **Security**: Multiple security layers
- **Flexibility**: Easy to extend and modify
- **Performance**: Optimized for speed and efficiency

The system is designed to handle the complete OJT/internship management lifecycle with role-based access, comprehensive document management, and robust attendance tracking.


