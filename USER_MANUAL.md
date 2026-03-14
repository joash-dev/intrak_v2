# INTRAK Web Application User Manual

## Table of Contents

- [1. Document Information](#1-document-information)
- [2. Student Quick Start Guide](#2-student-quick-start-guide)
- [3. System Overview](#3-system-overview)
- [4. User Roles and Navigation](#4-user-roles-and-navigation)
- [5. System Requirements](#5-system-requirements)
- [6. Accessing the System](#6-accessing-the-system)
- [7. Dashboard Overview](#7-dashboard-overview)
- [8. Core Features and Functions](#8-core-features-and-functions)
- [9. Administrative Functions](#9-administrative-functions)
- [10. Troubleshooting](#10-troubleshooting)
- [11. Logging Out](#11-logging-out)
- [12. Support Information](#12-support-information)

---

<div class="page-break"></div>

## 1. Document Information

**System Name:** INTRAK (Internship Tracking and Management System)  
**Version:** 2.0  
**Prepared by:** INTRAK Development Team  
**Publication Date:** March 2026  
**Institution:** Pangasinan State University

> **Figure 1.** [Insert Screenshot: System Cover Page or Login Banner]

---

<div class="page-break"></div>

## 2. Student Quick Start Guide

This section provides a concise, student-only workflow for getting started in INTRAK.

### 2.1 Log In and Open Dashboard

1. Open the official INTRAK URL in a supported browser.
2. Enter your school-issued email and password.
3. Complete two-factor authentication (2FA), if prompted.
4. Confirm that your dashboard loads correctly.

### 2.2 Complete Priority Tasks

1. Open `/student/documents` and submit all required files.
2. Open `/student/companies` and apply to a partner company (if not yet assigned).
3. Open `/student/attendance` and begin logging attendance using QR or manual entry.
4. Open `/student/notifications` daily to monitor updates and required actions.

### 2.3 Recommended Daily Routine

1. Check notifications before starting work.
2. Verify attendance status after each log submission.
3. Track document remarks and resubmit corrected files immediately when requested.
4. Review progress and completed hours from `/student/dashboard`.

### 2.4 Common Student Routes

- `/student/dashboard`
- `/student/documents`
- `/student/documents/form/:type`
- `/student/templates`
- `/student/companies`
- `/student/partnership-assistance`
- `/student/attendance`
- `/student/evaluations`
- `/student/settings`
- `/student/notifications`

---

<div class="page-break"></div>

## 3. System Overview

INTRAK is a web-based platform for managing internship and on-the-job training (OJT) activities in a centralized environment. It enables schools, students, and partner companies to manage requirements, attendance, evaluations, and internship progress efficiently.

### 3.1 Purpose

1. Centralize internship records and required documentation.
2. Streamline document submission and review workflows.
3. Monitor attendance and accumulated internship hours in real time.
4. Strengthen communication among students, school personnel, and industry supervisors.

### 3.2 Intended Users

- Students enrolled in internship/OJT programs
- Instructors supervising student internship progress
- Coordinators overseeing internship operations
- Industry Partners/Supervisors validating attendance and evaluations
- Administrators managing users and system configuration

---

<div class="page-break"></div>

## 4. User Roles and Navigation

### 4.1 Student

**Base path:** `/student`

1. `/student/dashboard`  
   Student home page displaying progress cards, completed hours, document status, company details, and announcements.
2. `/student/documents`  
   Requirements checklist where students upload documents, track review status, read remarks, and resubmit when required.
3. `/student/documents/form/:type`  
   Dynamic form page for selected document types, including form completion, preview, and submission.
4. `/student/templates`  
   Template repository for downloading official forms and files provided by instructors.
5. `/student/companies`  
   Company application page for browsing partner organizations, submitting applications, and tracking status.
6. `/student/partnership-assistance`  
   Support page for students without company placement and for company proposal concerns.
7. `/student/attendance`  
   Attendance module for QR generation, manual logs, hour tracking, calendar/list views, and DTR export.
8. `/student/evaluations`  
   Evaluation results page showing submitted ratings and feedback.
9. `/student/settings`  
   Account settings for profile, password, preferences, and security options.
10. `/student/notifications`  
    Notification center for updates related to documents, attendance, evaluations, and announcements.

### 4.2 Instructor

**Base path:** `/instructor`

1. `/instructor/dashboard`  
   Instructor home page summarizing assigned students and key activity.
2. `/instructor/students`  
   Student management page for monitoring progress and internship status.
3. `/instructor/documents`  
   Document review module for approving, rejecting, or requesting resubmission with remarks.
4. `/instructor/applications`  
   Company application review page for student placement requests.
5. `/instructor/company-proposals`  
   Proposal review page for student-submitted company proposals.
6. `/instructor/checklist`  
   Checklist monitoring page for requirement completion tracking.
7. `/instructor/reports`  
   Reporting module for attendance and performance reports with export options.
8. `/instructor/settings`  
   Account and preference settings.
9. `/instructor/notifications`  
   Notification center for submissions, attendance updates, and announcements.

### 4.3 Coordinator

**Base path:** `/coordinator`

1. `/coordinator/dashboard`  
   Coordinator home page displaying program-wide metrics, activity, and alerts.
2. `/coordinator/students`  
   Student management page for monitoring assignment and progress status.
3. `/coordinator/documents`  
   Centralized review page for student document submissions.
4. `/coordinator/companies`  
   Company management page for maintaining partner company records.
5. `/coordinator/company-proposals`  
   Company proposal decision page for review and approval actions.
6. `/coordinator/announcements`  
   Announcement publishing page for role-based and system-wide updates.
7. `/coordinator/reports`  
   Program reporting module for monitoring and export.
8. `/coordinator/settings`  
   Account and system preference settings.
9. `/coordinator/notifications`  
   Notification center for coordinator-level actions and updates.

### 4.4 Industry Partner / Supervisor

**Base path:** `/industry-partner`

1. `/industry-partner/dashboard`  
   Supervisor home page displaying assigned interns and high-level progress.
2. `/industry-partner/attendance`  
   Attendance verification module for QR scanning and log approval/rejection.
3. `/industry-partner/documents`  
   Document viewing page for assigned intern submissions.
4. `/industry-partner/evaluations`  
   Evaluation page for rating intern performance and submitting comments.
5. `/industry-partner/settings`  
   Account settings page.
6. `/industry-partner/notifications`  
   Notification center for attendance and intern-related updates.

### 4.5 Administrator

**Base path:** `/admin`

1. `/admin/dashboard`  
   Admin home page with system health indicators, usage metrics, and platform alerts.
2. `/admin/users`  
   User administration page for account creation, editing, role assignment, and lifecycle management.
3. `/admin/companies`  
   Company administration page for partner company records and availability management.
4. `/admin/settings`  
   System configuration page for security, maintenance mode, and policy settings.
5. `/admin/notifications`  
   Notification center for system-level events and warnings.

---

<div class="page-break"></div>

## 5. System Requirements

### 5.1 Hardware Requirements

**Minimum:**

- Dual-core processor
- 4 GB RAM
- 1 GB available storage
- Stable internet connection

**Recommended:**

- Intel i5 / Ryzen 5 or higher
- 8 GB RAM or higher
- 5 GB available storage
- Reliable broadband internet

### 5.2 Software Requirements

- Operating System: Windows 10/11, macOS, or Linux
- PDF reader for exported files
- Modern internet-enabled web browser

### 5.3 Supported Browsers

- Google Chrome (recommended)
- Microsoft Edge
- Mozilla Firefox
- Safari (latest version)

---

<div class="page-break"></div>

## 6. Accessing the System

### 6.1 Opening the Website

1. Open a supported web browser.
2. Enter the official INTRAK URL provided by your school or administrator.
3. Wait for the login page to load.

> **Figure 2.** [Insert Screenshot: Login Page]

### 6.2 Logging In

1. Enter your registered email address.
2. Enter your password.
3. Click **Continue**.
4. If prompted, enter your two-factor authentication (2FA) code.

> **Figure 3.** [Insert Screenshot: Two-Factor Authentication Screen]

### 6.3 Account Provisioning

User accounts are created by an Administrator or authorized school personnel.

If you do not yet have an account:

1. Contact your Coordinator or Administrator.
2. Provide required details (name, email, role, and related profile information).
3. Wait for account activation confirmation.

---

<div class="page-break"></div>

## 7. Dashboard Overview

After authentication, users are redirected to a role-specific dashboard.

### 7.1 Main Dashboard Components

Common dashboard elements include:

1. Status cards (documents, attendance, progress, alerts)
2. Recent activity summaries
3. Notifications and announcements
4. Quick-access links to major modules

> **Figure 4.** [Insert Screenshot: Role Dashboard]

### 7.2 Sidebar Navigation

Common menu items include:

- Dashboard
- Documents
- Attendance
- Reports
- Settings
- Notifications

Some menu items are visible only to specific user roles.

> **Figure 5.** [Insert Screenshot: Sidebar Navigation]

---

<div class="page-break"></div>

## 8. Core Features and Functions

### 8.1 Document Management

**Routes:**
- Student: `/student/documents`
- Student Form Pages: `/student/documents/form/:type`
- Instructor Review: `/instructor/documents`
- Coordinator Review: `/coordinator/documents`
- Supervisor View: `/industry-partner/documents`

#### Function

Supports student submission of internship requirements and role-based review by instructors and coordinators.

#### Procedure (Student)

1. Navigate to **Documents**.
2. Select a requirement.
3. Click **Upload** or **Fill Up**.
4. Submit the document.
5. Monitor status updates (**Pending**, **Approved**, **Rejected**, **Resubmit**).

> **Figure 6.** [Insert Screenshot: Student Documents Page]

#### Procedure (Instructor/Coordinator)

1. Navigate to **Documents**.
2. Open a student submission.
3. Review the attached file.
4. Approve, reject, or request resubmission.
5. Add remarks as required.

> **Figure 7.** [Insert Screenshot: Document Review Page]

#### Restrictions and Notes

- Accepted file format: **PDF only**
- Maximum file size: **10 MB**
- Some sections may be locked until prerequisite requirements are completed

### 8.2 Company Application and Assignment

**Routes:**
- Student Company Listing and Application: `/student/companies`
- Student Partnership Assistance: `/student/partnership-assistance`
- Instructor Application Review: `/instructor/applications`
- Instructor Proposal Review: `/instructor/company-proposals`
- Coordinator Company Management: `/coordinator/companies`
- Coordinator Proposal Review: `/coordinator/company-proposals`

#### Function

Allows students to browse partner companies and submit applications for placement.

#### Procedure (Student)

1. Navigate to **Companies**.
2. Search or browse available companies.
3. Select a company profile.
4. Click **Apply** and submit the application.
5. Monitor application status updates.

> **Figure 8.** [Insert Screenshot: Company Selection Page]

#### Restrictions and Notes

- Depending on policy, users may be restricted from applying to multiple companies simultaneously.
- Partnership Assistance is typically available only when no company is assigned.

### 8.3 Attendance Management

**Routes:**
- Student Attendance: `/student/attendance`
- Supervisor Attendance Verification: `/industry-partner/attendance`

#### Function

Tracks attendance logs and total internship hours.

#### Procedure (Student)

1. Navigate to **Attendance**.
2. Select **Generate QR** or **Manual Log**.
3. For QR logging, present the generated code to your supervisor.
4. For manual logging, enter date, time-in, and time-out, then submit.
5. Review attendance status in calendar or list view.

> **Figure 9.** [Insert Screenshot: Student Attendance Page]

#### Procedure (Supervisor)

1. Navigate to **Attendance**.
2. Open **QR Scanner**.
3. Scan the student QR code.
4. Approve or reject logs as needed.

> **Figure 10.** [Insert Screenshot: Supervisor QR Scanner]

#### Restrictions and Notes

- Attendance access may require an approved company and supervisor assignment.
- QR codes expire after a short interval.
- Rejected logs may require correction and resubmission.

### 8.4 Evaluations

**Routes:**
- Student Evaluation View: `/student/evaluations`
- Supervisor Evaluation Submission: `/industry-partner/evaluations`

#### Function

Enables authorized personnel to evaluate student performance.

#### Procedure

1. Navigate to **Evaluations**.
2. Select a student record.
3. Complete ratings and comments.
4. Submit the evaluation.
5. Students may view completed results in their account.

> **Figure 11.** [Insert Screenshot: Evaluation Form]

#### Restrictions and Notes

- Only authorized roles can submit evaluations.
- Editing may be restricted after submission, depending on policy.

### 8.5 Reports

**Routes:**
- Instructor Reports: `/instructor/reports`
- Coordinator Reports: `/coordinator/reports`
- Student DTR Export (within Attendance): `/student/attendance`

#### Function

Generates attendance and performance reports for monitoring and documentation.

#### Procedure

1. Navigate to **Reports**.
2. Configure filters (date range, status, user group).
3. Click **Generate**.
4. Export to PDF or Excel, if available.

> **Figure 12.** [Insert Screenshot: Reports Page]

#### Restrictions and Notes

- Export formats vary by role and permissions.
- Large date ranges may increase report generation time.

### 8.6 Notifications and Announcements

**Routes:**
- Student Notifications: `/student/notifications`
- Instructor Notifications: `/instructor/notifications`
- Coordinator Notifications: `/coordinator/notifications`
- Supervisor Notifications: `/industry-partner/notifications`
- Admin Notifications: `/admin/notifications`
- Coordinator Announcements: `/coordinator/announcements`

#### Function

Provides timely updates on submissions, approvals, reminders, and system alerts.

#### Procedure

1. Open **Notifications** from the sidebar or bell icon.
2. Review unread updates.
3. Open linked modules directly from each notification.

> **Figure 13.** [Insert Screenshot: Notifications Panel]

---

<div class="page-break"></div>

## 9. Administrative Functions

The following functions are available only to Administrator accounts.

### 9.1 User Management

**Route:** `/admin/users`

1. Navigate to **Admin > Users**.
2. Add, edit, deactivate, or delete user accounts.
3. Assign roles and required profile fields.
4. Save changes.

> **Figure 14.** [Insert Screenshot: Admin User Management]

### 9.2 System Settings

**Route:** `/admin/settings`

1. Navigate to **Admin > Settings**.
2. Configure policies such as session timeout and security controls.
3. Manage maintenance mode settings.
4. Save changes.

> **Figure 15.** [Insert Screenshot: Admin Settings]

### 9.3 Data and Submission Oversight

**Routes:** `/admin/dashboard`, `/admin/companies`, `/admin/notifications`

1. Review system-wide document and attendance trends.
2. Monitor alerts, usage, and storage conditions.
3. Export required system or report data.

> **Figure 16.** [Insert Screenshot: Admin Dashboard]

---

<div class="page-break"></div>

## 10. Troubleshooting

### 10.1 Unable to Log In

**Possible Causes:**

- Incorrect email or password
- Inactive account
- Temporary service disruption

**Resolution:**

1. Re-enter credentials carefully.
2. Use **Forgot Password**.
3. Contact the Administrator if access issues persist.

### 10.2 OTP or Email Not Received

**Resolution:**

1. Check Spam/Junk folders.
2. Wait at least 60 seconds, then request resend.
3. Verify your registered email with the Administrator.

### 10.3 Document Upload Failed

**Resolution:**

1. Confirm the file is in PDF format.
2. Confirm file size is below 10 MB.
3. Rename the file and upload again.
4. Retry using a stable internet connection.

### 10.4 Attendance Not Recorded

**Resolution:**

1. Verify company and supervisor assignment.
2. Regenerate the QR code and rescan.
3. Use manual logging if QR is unavailable.
4. Report unresolved issues to your supervisor or coordinator.

### 10.5 Page Not Loading Properly

**Resolution:**

1. Refresh the browser.
2. Clear browser cache.
3. Switch to another supported browser.
4. Check internet connectivity.

---

<div class="page-break"></div>

## 11. Logging Out

To log out securely:

1. Click your profile menu or logout icon.
2. Click **Logout**.
3. Confirm that you are redirected to the login page.

> **Figure 17.** [Insert Screenshot: Logout Confirmation]

**Important:**

- Always log out when using shared or public devices.

---

<div class="page-break"></div>

## 12. Support Information

For account or system concerns, contact:

- **System Administrator:** [Insert Name]
- **Email:** [Insert Support Email]
- **Phone:** [Insert Contact Number]
- **Office/Department:** [Insert Office Name]
- **Support Hours:** [Insert Business Hours]

For urgent concerns, include the following details:

1. Full name
2. Role (Student/Instructor/Coordinator/Supervisor/Administrator)
3. Screenshot of the issue
4. Date and time the issue occurred

> **Figure 18.** [Insert Screenshot: Help or Support Section]

---

End of document.
