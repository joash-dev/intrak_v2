# INTRAK User Manual

## Document Control

- **System Name:** INTRAK (Internship/OJT Tracking and Management System)
- **Version:** 2.0
- **Manual Version:** 2026.03
- **Audience:** Students, Instructors, Coordinators, Industry Partners, Administrators
- **Purpose:** Provide complete, role-based guidance for all user-facing features

---

## Table of Contents

- [1. System Overview](#1-system-overview)
- [2. Access and Login](#2-access-and-login)
- [3. Navigation and Interface](#3-navigation-and-interface)
- [4. Role Access Matrix](#4-role-access-matrix)
- [5. Core Workflows (End-to-End)](#5-core-workflows-end-to-end)
- [6. Student Portal Features](#6-student-portal-features)
- [7. Instructor Portal Features](#7-instructor-portal-features)
- [8. Coordinator Portal Features](#8-coordinator-portal-features)
- [9. Industry Partner Portal Features](#9-industry-partner-portal-features)
- [10. Admin Portal Features](#10-admin-portal-features)
- [11. Security and Account Settings](#11-security-and-account-settings)
- [12. Status Definitions and Business Rules](#12-status-definitions-and-business-rules)
- [13. Troubleshooting Guide](#13-troubleshooting-guide)
- [14. Support and Escalation](#14-support-and-escalation)

---

## 1. System Overview

INTRAK centralizes internship operations in one platform:

- Student onboarding and document submission
- Company application and placement processing
- Company partnership proposal workflow
- Attendance logging and verification
- Evaluations, compliance tracking, and reporting
- Notifications, announcements, and role-based monitoring

### 1.1 User Roles

- **Student**: submits requirements, applies to companies, logs attendance, views evaluations
- **Instructor**: manages assigned students, reviews requirements, checks compliance, monitors reports
- **Coordinator**: oversees the entire program, companies, proposals, announcements, and reporting
- **Industry Partner**: verifies attendance and submits intern evaluations
- **Admin**: manages platform settings, users, maintenance mode, and system-level controls

---

## 2. Access and Login

### 2.1 Public Authentication Routes

- `/login`
- `/forgot-password`
- `/reset-password`
- `/verify-email`

### 2.2 Login Process

1. Open the official system URL.
2. Enter email and password.
3. If two-factor authentication is enabled, enter:
   - one-time email code, or
   - backup code.
4. System redirects to your role dashboard.

### 2.3 Password Recovery

1. Open `/forgot-password`.
2. Submit your registered email.
3. Open reset link from email.
4. Set a new password on `/reset-password`.

### 2.4 Email Verification

Users can verify account email and check verification status from Settings security sections.

---

## 3. Navigation and Interface

### 3.1 Main Layout Pattern

All role portals use:

- Sidebar navigation with role-specific modules
- Header shortcuts (notifications and profile/settings)
- Notification unread indicators
- Logout confirmation modal

### 3.2 Common UX Features

- Responsive layout (desktop and mobile)
- Light/dark/system theme preference
- Session protection and role-based route guards
- Error pages (`/error/:code`, `404`, `500`)
- Maintenance mode (non-admin users see maintenance page when enabled)

---

## 4. Role Access Matrix

| Role | Base Path | Main Modules |
| --- | --- | --- |
| Student | `/student` | Dashboard, Documents, Templates, Companies, Partnership Assistance, Attendance, Evaluations, Settings, Notifications |
| Instructor | `/instructor` | Dashboard, Notifications, Student Documents, Company Applications, Company Proposals, Students, Reports, Settings |
| Coordinator | `/coordinator` | Dashboard, Students, Documents, Companies, Company Proposals, Announcements, Reports, Settings, Notifications |
| Industry Partner | `/industry-partner` | Dashboard, Attendance, Documents, Evaluations, Settings, Notifications |
| Admin | `/admin` | Dashboard, Users, Companies, Settings, Notifications |

---

## 5. Core Workflows (End-to-End)

### 5.1 Document Compliance Workflow

1. Student uploads or generates required document.
2. Instructor/Coordinator reviews submission.
3. Reviewer approves, rejects, or requests resubmission with remarks.
4. Student monitors status and submits corrections if required.
5. Compliance reflected in dashboards/reports.

### 5.2 Company Placement Workflow

1. Student browses companies and submits application.
2. Instructor/Coordinator reviews application.
3. Status updated to approved/rejected/withdrawn.
4. Once assigned, attendance and evaluation modules become fully usable.

### 5.3 Partnership Proposal Workflow (for non-listed companies)

1. Student submits company proposal in Partnership Assistance.
2. Student uploads supporting attachments.
3. Instructor reviews and either returns, rejects, or forwards to coordinator.
4. Coordinator performs final decision and updates status.

### 5.4 Attendance and Evaluation Workflow

1. Student logs attendance (manual/QR supported by workflow).
2. Industry Partner verifies attendance.
3. Industry Partner submits performance evaluation.
4. Student sees evaluation results in Student Evaluations.

---

## 6. Student Portal Features

Base path: `/student`

### 6.1 Dashboard (`/student/dashboard`)

- View current progress and internship summary
- Track document status and completion indicators
- View assigned company/supervisor context
- Access announcements and recent updates quickly

### 6.2 Documents (`/student/documents`)

- Upload required internship documents
- View requirement checklist by phase
- Track document status per submission
- Read reviewer remarks and resubmit when needed
- Access shared-document acceptance actions (if assigned)

### 6.3 Dynamic Document Forms (`/student/documents/form/:type`)

- Fill structured document forms (instead of file-only upload)
- Preview generated document before submission
- Finalize and submit directly to document workflow
- Supports specific official forms (example: endorsement variants)

### 6.4 Templates (`/student/templates`)

- Download official document templates published by authorized personnel
- Use templates as source files for requirement preparation

### 6.5 Companies (`/student/companies`)

- Browse available partner companies
- Review company details and slots
- Submit placement application
- View current application state

### 6.6 Partnership Assistance (`/student/partnership-assistance`)

- Submit proposal for a non-listed company
- Upload proposal attachments
- View proposal timeline and status progression
- Use messaging thread for follow-ups
- Check required pre-deployment document readiness

### 6.7 Attendance (`/student/attendance`)

- Log attendance entries
- Use verification-supported methods (for implemented policy flow)
- Review logs and total completed hours
- Track verification status and corrections
- Export attendance outputs where available in UI

### 6.8 Evaluations (`/student/evaluations`)

- View evaluation ratings and comments submitted by authorized evaluators
- Monitor evaluation history for internship performance

### 6.9 Notifications (`/student/notifications`)

- View system and workflow alerts
- Mark notifications as read
- Open linked modules directly from notification items

### 6.10 Settings (`/student/settings`)

- **Profile**: update personal details and emergency contacts
- **Profile Photo**: upload/remove avatar
- **Password**: change current password with strength guidance
- **Email Verification**: send/resend and verify email status
- **Two-Factor Security**: enable/disable 2FA and backup codes
- **Last Login Info**: view account access details
- **Notifications Preferences**: control notification channels
- **Appearance**: light/dark/system mode
- **Preferences**: language/date/time formats
- **Help & About**: built-in help references and app details

---

## 7. Instructor Portal Features

Base path: `/instructor`

### 7.1 Dashboard (`/instructor/dashboard`)

- View assigned student performance at a glance
- Monitor pending submissions and key updates
- Access quick links to review tasks

### 7.2 Notifications (`/instructor/notifications`)

- Receive alerts on student submissions and actions
- Manage read/unread notification states

### 7.3 Student Documents (`/instructor/documents`)

- Review student document uploads
- Approve/reject with remarks
- Request resubmission when corrections are needed
- Add feedback entries to document history

### 7.4 Company Applications (`/instructor/applications`)

- Review company applications submitted by students
- Approve, reject, or update decision context
- Track student placement readiness

### 7.5 Company Proposals (`/instructor/company-proposals`)

- Review non-listed company proposals
- Return for correction, reject, or forward to coordinator
- Manage proposal-level remarks

### 7.6 Students (`/instructor/students`)

- View assigned students and profile details
- Manage student records within role permissions
- Review student timeline and activity context

### 7.7 Reports (`/instructor/reports`)

- Generate monitoring and compliance reports
- Analyze attendance and requirement completion
- Export report outputs where enabled

### 7.8 Settings (`/instructor/settings`)

- Manage profile and account preferences
- Update password and security settings
- Configure theme and preference options

---

## 8. Coordinator Portal Features

Base path: `/coordinator`

### 8.1 Dashboard (`/coordinator/dashboard`)

- Program-wide oversight with key metrics
- Quick access to students, documents, companies, and announcements

### 8.2 Students (`/coordinator/students`)

- Monitor all student records across the program
- Assign or reassign instructors where authorized
- Review progress and intervention needs

### 8.3 Documents (`/coordinator/documents`)

- Conduct centralized document review and approvals
- Apply final review decisions when needed

### 8.4 Companies (`/coordinator/companies`)

- Manage partner company records
- Track company internship capacity and assignment context

### 8.5 Company Proposals (`/coordinator/company-proposals`)

- Perform coordinator-level decisioning for proposals
- Update status to final states according to policy

### 8.6 Announcements (`/coordinator/announcements`)

- Create and publish announcements
- Target audience groups (all or role-specific)
- Manage pinned and informational updates

### 8.7 Reports (`/coordinator/reports`)

- Generate program-wide operational reports
- Export monitoring outputs for compliance and administration

### 8.8 Settings and Notifications

- `/coordinator/settings`: profile/security/preferences
- `/coordinator/notifications`: system and workflow alerts

---

## 9. Industry Partner Portal Features

Base path: `/industry-partner`

### 9.1 Dashboard (`/industry-partner/dashboard`)

- View assigned interns and monitoring overview

### 9.2 Attendance (`/industry-partner/attendance`)

- Verify student attendance entries
- Approve or reject logs with remarks
- Apply verification actions required by workflow

### 9.3 Documents (`/industry-partner/documents`)

- View student-related documents relevant to supervised interns

### 9.4 Evaluations (`/industry-partner/evaluations`)

- Submit intern performance evaluations
- Provide criteria ratings and comments

### 9.5 Settings and Notifications

- `/industry-partner/settings`: account, security, preferences
- `/industry-partner/notifications`: alerts and updates

---

## 10. Admin Portal Features

Base path: `/admin`

### 10.1 Dashboard (`/admin/dashboard`)

- View high-level system health and operational indicators

### 10.2 User Management (`/admin/users`)

- Create and manage users across roles
- Update user profile, account state, and access context
- Remove users where permitted by policy

### 10.3 Company Management (`/admin/companies`)

- Maintain master company records
- Support institutional company data governance

### 10.4 Admin Settings (`/admin/settings`)

- Configure system settings
- Manage maintenance mode and emergency controls
- Export/import admin setting files
- Manage infrastructure options (including NAS-related operations where configured)

### 10.5 Notifications (`/admin/notifications`)

- Monitor system-level notifications and alerts

---

## 11. Security and Account Settings

### 11.1 Authentication and Authorization

- Role-based route protection for all portals
- Access token and refresh token session model
- Unauthorized users redirected to login

### 11.2 Two-Factor Authentication (2FA)

- Enable/disable from account settings (supported roles via settings flow)
- Login challenge with one-time code
- Backup code verification and regeneration support

### 11.3 Email Verification

- Send verification email
- Verify account via token workflow
- Check verification status inside account settings

### 11.4 Profile Photo Management

- Upload profile photo
- Replace or remove photo
- Updates reflected across portal header/profile panels

---

## 12. Status Definitions and Business Rules

### 12.1 Document Status

- `PENDING`: submitted and waiting review
- `APPROVED`: accepted
- `REJECTED`: not accepted
- `RESUBMISSION_REQUESTED`: correction required before approval

### 12.2 Company Application Status

- `PENDING`
- `APPROVED`
- `REJECTED`
- `WITHDRAWN`

### 12.3 Company Proposal Status

- `SUBMITTED_TO_INSTRUCTOR`
- `RETURNED_BY_INSTRUCTOR`
- `REJECTED_BY_INSTRUCTOR`
- `FORWARDED_TO_COORDINATOR`
- `UNDER_COORDINATOR_REVIEW`
- `PENDING_EXTERNAL_APPROVAL`
- `APPROVED`
- `REJECTED`

### 12.4 Attendance Notes

- Verification status depends on reviewer actions
- Method can include policy-driven verification types
- Access to attendance/evaluation may require company + supervisor assignment

---

## 13. Troubleshooting Guide

### 13.1 Cannot Log In

- Confirm correct email/password.
- Check if account is active.
- Use `/forgot-password` if needed.
- Contact admin if issue persists.

### 13.2 Did Not Receive Verification or 2FA Code

- Check spam/junk folder.
- Wait briefly, then resend code.
- Confirm registered email is correct.

### 13.3 Document Upload/Submission Fails

- Verify file type and size meet policy.
- Retry on stable internet.
- Check if document type requires form-based submission.

### 13.4 Attendance Not Available

- Confirm student has assigned company and supervisor.
- Verify current application/proposal status.
- Ask coordinator/instructor to review assignment state.

### 13.5 Feature Not Visible

- Some modules are role-based or condition-based.
- Recheck logged-in role and active workflow status.

---

## 14. Support and Escalation

For support requests, provide:

- Full name and role
- Screenshot/video of issue
- Date/time encountered
- Module/page URL
- Short description of expected vs actual behavior

Recommended escalation path:

1. Student to Instructor
2. Instructor to Coordinator
3. Coordinator to Admin/Technical Team

---

End of manual.
