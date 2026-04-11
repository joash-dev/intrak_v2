# INTRAK User Manual

## Document Control

- **System Name:** INTRAK (Internship/OJT Tracking and Management System)
- **Version:** 2.0
- **Manual Version:** 2026.04
- **Audience:** Students, Instructors, Coordinators, Industry Partners, Administrators
- **Purpose:** Step-by-step guidance for every feature in the system, organized by role

---

## Table of Contents

- [1. System Overview](#1-system-overview)
- [2. Getting Started](#2-getting-started)
- [3. Navigation and Interface](#3-navigation-and-interface)
- [4. Student Guide](#4-student-guide)
- [5. Instructor Guide](#5-instructor-guide)
- [6. Coordinator Guide](#6-coordinator-guide)
- [7. Industry Partner (Supervisor) Guide](#7-industry-partner-supervisor-guide)
- [8. Admin Guide](#8-admin-guide)
- [9. Security and Account Settings](#9-security-and-account-settings)
- [10. Status Definitions and Business Rules](#10-status-definitions-and-business-rules)
- [11. Troubleshooting Guide](#11-troubleshooting-guide)
- [12. Support and Escalation](#12-support-and-escalation)
- [Appendix A: System Deployment Guide](#appendix-a-system-deployment-guide)

---

## 1. System Overview

INTRAK is a web-based platform that manages the full lifecycle of internship (OJT) for the Computer Engineering Department of PSU–Urdaneta City Campus. It covers:

- **Student onboarding** — account creation, document submission, requirement tracking
- **Company placement** — browsing partner companies, applying, and getting assigned
- **Partnership proposals** — students proposing non-listed companies for approval
- **Attendance** — daily time-in/time-out via QR code or manual entry, with supervisor verification
- **Evaluations** — supervisor-submitted performance evaluations (Forms 11, 18, 19b)
- **Announcements and messaging** — program-wide announcements and partnership-related chat
- **Reporting and compliance** — progress tracking, document checklists, exportable reports
- **Administration** — user management, company records, system settings, maintenance mode

### 1.1 User Roles

| Role | Description |
|------|------------|
| **Student** | Submits requirements, applies to companies, logs attendance, views evaluations |
| **Instructor** | Manages assigned students, reviews documents, monitors compliance and reports |
| **Coordinator** | Oversees the entire program — companies, proposals, announcements, and reporting |
| **Industry Partner** | The company supervisor who verifies attendance and submits intern evaluations |
| **Admin** | Manages platform users, company records, system settings, and maintenance mode |

---

## 2. Getting Started

### 2.1 Logging In

1. Open the system URL in your browser (e.g. `https://intrak.site`).
2. Enter your **email** and **password**.
3. If two-factor authentication (2FA) is enabled on your account, you will be prompted for either:
   - A **one-time code** sent to your email, or
   - A **backup code** (if email is unavailable).
4. After successful login, you are redirected to your role's dashboard.

### 2.2 Forgot Password

1. On the login page, click **Forgot Password**.
2. Enter your registered email address and submit.
3. Check your email for a reset link.
4. Click the link and set a new password.

### 2.3 Email Verification

- After account creation, you may receive a verification email.
- You can also send/resend verification from **Settings > Security** inside your portal.
- Verified status is shown on the settings page.

### 2.4 First-Time Login

- Accounts created by Admin or Instructor come with a **temporary password** sent via email.
- On first login, you should change your password immediately via **Settings > Password**.

---

## 3. Navigation and Interface

### 3.1 Layout

Every portal follows the same layout:

- **Sidebar** (left) — lists your available modules; click any item to navigate
- **Header** (top) — shows notification bell (with unread count) and your profile/settings shortcut
- **Main area** (center) — displays the selected module's content

### 3.2 Common Features

- **Responsive design** — works on desktop and mobile screens
- **Theme** — switch between Light, Dark, or System preference in Settings
- **Notifications** — real-time alerts for actions that affect you (submissions, approvals, etc.)
- **Maintenance mode** — when the Admin enables maintenance mode, non-admin users see a maintenance page until it is lifted
- **Error pages** — if something goes wrong, you will see a friendly error page (404, 500, etc.)

---

## 4. Student Guide

**Base path:** `/student`

### 4.1 Dashboard

Your dashboard shows an overview of your internship progress:

- Document completion status
- Company assignment information
- Recent announcements
- Quick links to pending tasks

### 4.2 Documents

**Path:** `/student/documents`

This is where you manage all your internship requirements.

**Viewing your requirements:**

1. Go to **Documents** from the sidebar.
2. You will see a checklist of required documents organized by phase (pre-deployment, upon-approval, post-OJT).
3. Each document shows its current status: Pending, Approved, Rejected, or Resubmission Requested.

**Uploading a document:**

1. Find the required document in the list.
2. Click the upload action for that document.
3. Select your file and submit.
4. The document enters **Pending** status, waiting for instructor/coordinator review.

**Using dynamic forms:**

Some documents (like endorsement forms) use a built-in form instead of file upload:

1. Click the document that requires a form.
2. Fill in the structured fields.
3. Preview the generated document.
4. Submit when ready.

**After rejection or resubmission request:**

1. Check the **reviewer remarks** on your document.
2. Make the necessary corrections.
3. Resubmit the updated document.

### 4.3 Companies

**Path:** `/student/companies`

**Browsing companies:**

1. Go to **Companies** from the sidebar.
2. Browse the list of available partner companies.
3. View company details including available slots, address, and contact information.

**Applying to a company:**

1. Select a company from the list.
2. Click **Apply**.
3. Your application enters **Pending** status.
4. Wait for instructor/coordinator approval.
5. Once approved, you will be assigned to that company.

### 4.4 Partnership Assistance

**Path:** `/student/partnership-assistance`

Use this if you want to intern at a company **not currently listed** in the system.

**Submitting a proposal:**

1. Go to **Partnership Assistance** from the sidebar.
2. Click to create a new proposal.
3. Fill in the company details (name, address, contact person, etc.).
4. Upload any supporting attachments (e.g., acceptance letter from the company).
5. Submit the proposal.

**Tracking your proposal:**

- Your proposal first goes to your **Instructor** for review.
- The instructor may return it for corrections, reject it, or forward it to the **Coordinator**.
- The coordinator makes the final decision.
- You can track the status and use the **messaging thread** for follow-up questions.

### 4.5 Attendance

**Path:** `/student/attendance`

You log your daily attendance here. Two methods are available:

**Method 1 — QR Code:**

1. Go to **Attendance** from the sidebar.
2. Click **Generate QR**.
3. A QR code is displayed along with an expiry time and a token code.
4. Show the QR code to your supervisor to scan, or give them the token for manual entry.
5. Once your supervisor scans/enters the code, the system records your time-in or time-out.
6. A success message confirms the action.

**Method 2 — Manual Entry:**

1. Go to **Attendance** from the sidebar.
2. Click **Manual**.
3. Optionally add remarks.
4. Submit — the system determines whether this is a **time-in** or **time-out** based on your existing logs for the day.
5. Manual entries go to your supervisor for verification (approve/reject).

**Viewing your attendance:**

- Switch between **calendar view** and **list view** to review your logs.
- Each entry shows: date, time-in, time-out, verification method (QR/Manual), and status.
- Track your **total completed hours**.
- Export your attendance records when needed.

**Notes:**

- You can log up to two attendance segments per day (e.g., morning and afternoon).
- If the maximum segments are reached, the system will notify you.
- Saturday attendance may be available for private companies (based on company settings).

### 4.6 Evaluations

**Path:** `/student/evaluations`

View the evaluations submitted by your company supervisor.

- **Form 11** — Internship Evaluation (competency ratings)
- **Form 18** — Supervisor Feedback (punctuality, knowledge, teamwork, etc.)
- **Form 19b** — Agency Self-Evaluation

For each form:

1. Click the form to preview the evaluation details.
2. View ratings and comments.
3. Download/export the official form if available.

**Note:** Evaluations are only visible after your supervisor submits them. You must have an assigned company and supervisor to access this section.

### 4.7 Announcements

**Path:** `/student/announcements`

1. Go to **Announcements** from the sidebar.
2. Browse announcements targeted to **All** or **Students**.
3. Click an announcement to expand and read the full content.
4. Use the search bar to find specific announcements.

### 4.8 Messages

**Path:** `/student/messages`

Messaging is used for **partnership assistance** communication with your instructor and coordinator.

1. Go to **Messages** from the sidebar.
2. View the conversation thread related to your partnership proposal.
3. Type a message and send.
4. You can reply to specific messages.
5. Messages update automatically (polling every 3 seconds).
6. Role badges (Student / Instructor / Coordinator) show who sent each message.

### 4.9 Notifications

**Path:** `/student/notifications`

- View all system alerts (document reviews, application updates, announcements, etc.).
- Click a notification to go directly to the related module.
- Mark notifications as read.

### 4.10 Settings

**Path:** `/student/settings`

| Section | What you can do |
|---------|----------------|
| **Profile** | Update personal details and emergency contacts |
| **Profile Photo** | Upload or remove your avatar |
| **Password** | Change password (with strength guidance) |
| **Email Verification** | Send/resend verification email, check status |
| **Two-Factor Authentication** | Enable/disable 2FA and manage backup codes |
| **Last Login Info** | View when and where your account was last accessed |
| **Notification Preferences** | Control which notifications you receive |
| **Appearance** | Light / Dark / System theme |
| **Preferences** | Language, date, and time format |
| **Help & About** | Built-in help and app information |

---

## 5. Instructor Guide

**Base path:** `/instructor`

### 5.1 Dashboard

Your dashboard shows an overview of your assigned students:

- Pending document submissions requiring your review
- Key updates and action items
- Quick links to review tasks

### 5.2 Students

**Path:** `/instructor/students`

**Viewing your assigned students:**

1. Go to **Students** from the sidebar.
2. View the list of students assigned to you.
3. Click a student to view their profile, timeline, and activity.

**Adding a single student:**

1. Click **Add Student**.
2. Fill in the required fields:
   - **Student Number** (format: `22-UR-0592`)
   - **Name**
   - **Email**
   - **Year**
   - **Phone**
   - **Program** (fixed to BS Computer Engineering)
3. Click submit.
4. A temporary password is generated and emailed to the student.

**Bulk adding students (CSV):**

1. Click **Bulk Add**.
2. Click **Download Template** to get the CSV format.
3. Open the template — it has these columns: `studentNumber`, `name`, `email`, `year`, `phone`.
4. Fill in your student data (one row per student).
5. Upload the completed CSV file (or paste the CSV text).
6. Click **Preview** to review the parsed data.
7. Verify the entries are correct.
8. Click **Add Students** to create all accounts at once.
9. Each student receives an email with their temporary password.

### 5.3 Documents

**Path:** `/instructor/documents`

**Reviewing student documents:**

1. Go to **Documents** from the sidebar.
2. View student document submissions awaiting your review.
3. Click a document to open it.
4. Choose an action:
   - **Approve** — mark the document as accepted
   - **Reject** — mark as not accepted (add remarks explaining why)
   - **Request Resubmission** — ask the student to correct and resubmit (add specific feedback)
5. Your decision and remarks are recorded in the document history.

### 5.4 Document Checklist

**Path:** `/instructor/checklist`

This gives you a per-student overview of all required PSU forms and their completion status.

1. Go to the **Checklist** tab from the sidebar.
2. View a list of your assigned students.
3. Each student shows a progress bar (percentage of required documents approved).
4. Expand a student to see individual document rows:
   - **Pre-deployment** forms
   - **Upon-approval** forms
   - **Post-OJT** forms
5. Each document row shows: Pending / Submitted / Approved / Rejected.
6. Use **Search** to find a student quickly.
7. Use **Filters** to show only students with specific statuses or document categories.

### 5.5 Company Applications

**Path:** `/instructor/applications`

1. Go to **Applications** from the sidebar.
2. View student company applications submitted for review.
3. For each application, you can:
   - **Approve** the placement
   - **Reject** with a reason
   - Update the decision context
4. Track which students are ready for placement.

### 5.6 Company Proposals

**Path:** `/instructor/company-proposals`

When students propose non-listed companies (via Partnership Assistance), you review them here.

1. Go to **Company Proposals** from the sidebar.
2. View submitted proposals.
3. For each proposal, you can:
   - **Return for correction** — send back to student with remarks
   - **Reject** — decline the proposal
   - **Forward to Coordinator** — pass for final approval
4. Add remarks to explain your decision.

### 5.7 Announcements

**Path:** `/instructor/announcements`

1. Browse announcements targeted to **All** or **Instructors**.
2. Expand an announcement to read the full content.
3. Search for specific announcements using the search bar.

### 5.8 Messages

**Path:** `/instructor/messages`

Used for partnership assistance communication with students.

1. Go to **Messages** from the sidebar.
2. A list of conversations appears (one per student with an active partnership proposal).
3. Click a student's conversation to open the thread.
4. Type a message and send.
5. The thread shows messages from all participants (Student, Instructor, Coordinator) with role badges.
6. Conversations auto-update (polling every 12 seconds for the list, every 3 seconds for the active thread).
7. Unread conversations are marked; selecting a conversation marks it as read.

### 5.9 Reports

**Path:** `/instructor/reports`

1. Generate monitoring and compliance reports for your assigned students.
2. View attendance and requirement completion data.
3. Export reports where the option is available.

### 5.10 Settings and Notifications

- **Settings** (`/instructor/settings`): profile, password, security, theme, preferences
- **Notifications** (`/instructor/notifications`): alerts for student submissions, approvals, and actions

---

## 6. Coordinator Guide

**Base path:** `/coordinator`

### 6.1 Dashboard

Your dashboard provides program-wide oversight:

- Key metrics across all students
- Quick access to students, documents, companies, and announcements

### 6.2 Students

**Path:** `/coordinator/students`

**Viewing all students:**

1. Go to **Students** from the sidebar.
2. View every student in the program with search and filters:
   - Filter by status, instructor assignment, or company
   - Sort by various criteria
3. View stats at the top (total students, assigned, unassigned, etc.).

**Assigning an instructor to a student:**

1. Find the student in the list.
2. Click **Assign** next to the student.
3. Select an instructor from the dropdown.
4. Confirm the assignment.

**Unassigning an instructor:**

1. Find the student.
2. Click **Unassign**.
3. Confirm the removal.

**Quick Assign All (batch):**

1. Click **Quick Assign All** at the top.
2. This selects all currently unassigned students.
3. Choose an instructor in the mass-assign modal.
4. Confirm to assign all selected students at once.

**Viewing student details:**

1. Click the **view** (eye) icon on a student.
2. A details panel opens showing:
   - Student profile information
   - **Company Assignment** — select a company from the dropdown and click **Save Changes**
   - **Partnership Documents** section for that student

### 6.3 Documents

**Path:** `/coordinator/documents`

- Conduct centralized document review and approvals.
- Apply final review decisions when needed (same approve/reject/resubmission workflow as instructor).

### 6.4 Companies

**Path:** `/coordinator/companies`

**Viewing companies:**

1. Go to **Companies** from the sidebar.
2. Browse partner company records with search and filters.

**Adding a company:**

1. Click **Add Company**.
2. Fill in company details: name, address, contact person, email, phone, company type (Public/Private), working days, maximum slots.
3. Optionally link to an approved company proposal.
4. Submit.

**Editing a company:**

1. Click **Edit** on a company card.
2. Update the fields as needed.
3. Save changes.

**Managing MOA (Memorandum of Agreement):**

Uploading a MOA:

1. Click the MOA action on a company.
2. Fill in: title, description, select the student and company.
3. Upload the MOA file.
4. Submit.

Reviewing a MOA:

1. View all MOAs for a company.
2. **Preview** — opens the document for inline viewing or download.
3. **Approve** or **Reject** the MOA (with reasons for rejection).
4. **Download** the MOA file.

**Creating a supervisor account:**

1. On a company card, click **Create Supervisor Account**.
2. Fill in the supervisor's details.
3. Submit — the supervisor receives an email with their temporary password.
4. A success confirmation shows the account was created.

**Deleting a company:**

1. Click **Delete** on a company card.
2. Type the company name to confirm deletion.
3. Confirm.

### 6.5 Company Proposals

**Path:** `/coordinator/company-proposals`

This is where you make the **final decision** on non-listed company proposals forwarded by instructors.

1. View proposals that have been forwarded to you.
2. Review the proposal details and attachments.
3. Choose an action:
   - **Approve** — the proposed company can be added to the system
   - **Reject** — decline the proposal
4. Update the status accordingly.

### 6.6 Announcements

**Path:** `/coordinator/announcements`

**Creating an announcement:**

1. Go to **Announcements** from the sidebar.
2. Click **Create**.
3. Fill in:
   - **Title**
   - **Content**
   - **Audience**: All, Students, Coordinators, Instructors, or Partners
   - **Type**: Info, Warning, Success, or Urgent
   - **Pin**: toggle on to keep the announcement at the top
4. Submit.

**Managing announcements:**

- **Edit** — update an existing announcement
- **Delete** — remove an announcement
- **Refresh** — reload the list
- View stats: total announcements, pinned count, this week's count, average views

### 6.7 Messages

**Path:** `/coordinator/messages`

Same as the Instructor messaging flow — used for partnership assistance conversations.

1. View the list of student conversations.
2. Click a conversation to open the thread.
3. Send messages and reply to students/instructors.
4. Conversations auto-update and mark as read when selected.

### 6.8 Reports

**Path:** `/coordinator/reports`

- Generate program-wide operational reports.
- Export monitoring data for compliance and administration.

### 6.9 Settings and Notifications

- **Settings** (`/coordinator/settings`): profile, security, preferences
- **Notifications** (`/coordinator/notifications`): system and workflow alerts

---

## 7. Industry Partner (Supervisor) Guide

**Base path:** `/industry-partner`

You are the company supervisor responsible for verifying intern attendance and submitting evaluations.

### 7.1 Dashboard

Your dashboard shows:

- Assigned interns overview
- Pending attendance verifications
- Evaluation status

### 7.2 Attendance

**Path:** `/industry-partner/attendance`

This module has three tabs: **Logs**, **Scanner**, and **No-Work**.

**Logs tab — reviewing attendance:**

1. Go to **Attendance** from the sidebar.
2. The **Logs** tab shows pending attendance entries grouped by student and date.
3. For each entry, you can:
   - **Approve** — confirm the student was present (add optional remarks)
   - **Reject** — deny the entry (add required remarks explaining why)
4. View approved attendance with per-student summaries.
5. Drill down by date to see up to two time segments per day (e.g., morning and afternoon).

**Scanner tab — QR verification:**

1. Switch to the **Scanner** tab.
2. Use your device's camera to scan the student's QR code.
3. Alternatively, enter the student's **token code** manually in the text field.
4. The system verifies and records the attendance automatically.

**No-Work tab:**

1. Switch to the **No-Work** tab.
2. View no-work notices submitted by students.
3. **Approve** or **Reject** each notice.

### 7.3 Evaluations

**Path:** `/industry-partner/evaluations`

This module has three tabs for the three official evaluation forms.

**Form 11 — Internship Evaluation:**

1. Go to **Evaluations** from the sidebar.
2. View the list of your assigned interns.
3. Click **Start Evaluation** on a student.
4. Rate the student on **8 weighted competencies** using a 1–5 scale.
5. Check any applicable **termination** checkboxes (if relevant).
6. Add overall comments.
7. Click **Submit**.
8. After submission, you can **Export** the official form.

**Form 18 — Supervisor Feedback:**

1. Switch to the **Form 18** tab.
2. Select a student.
3. Rate with star ratings on: punctuality, knowledge, teamwork, task performance, policy compliance, conduct, and traits.
4. Add comments.
5. Save or submit.
6. Export when complete.

**Form 19b — Agency Self-Evaluation:**

1. Switch to the **Form 19b** tab.
2. Fill in demographic fields.
3. Rate on multiple criteria.
4. Submit.
5. Export when complete.

### 7.4 Announcements

**Path:** `/industry-partner/announcements`

- Browse announcements targeted to **All** or **Partners**.
- Expand to read full content.
- Search for specific announcements.

### 7.5 Settings and Notifications

- **Settings** (`/industry-partner/settings`): account, security, preferences
- **Notifications** (`/industry-partner/notifications`): alerts and updates

---

## 8. Admin Guide

**Base path:** `/admin`

### 8.1 Dashboard

View high-level system health and operational indicators at a glance.

### 8.2 User Management

**Path:** `/admin/users`

**Viewing users:**

1. Go to **Users** from the sidebar.
2. View all users across all roles.
3. Use search, filters, and sorting to find specific users.

**Adding a new user:**

1. Click **Add User**.
2. Select the **Role** (Student, Instructor, Coordinator, Industry Partner, Admin).
3. Fill in the required fields:
   - **Name** and **Email**
   - If the role is **Student**, additional fields appear:
     - **Student Number** (format: `22-UR-0592`)
     - **Year**
     - **Program** (Computer Engineering — pre-filled)
4. Submit.
5. A **temporary password** is generated and emailed to the new user.

**Editing a user:**

1. Click **Edit** on a user row.
2. Update the fields as needed.
3. Save.

**Assigning a student to an instructor:**

1. On a student row, click **Assign to Instructor**.
2. Select the instructor.
3. Confirm.

**Deleting a user:**

1. Click **Delete** on a user row.
2. Confirm deletion.

**Exporting user data:**

- Click **Export** to download user data.

### 8.3 Company Management

**Path:** `/admin/companies`

**Viewing companies:**

1. Go to **Companies** from the sidebar.
2. Browse company records with search and filters.
3. Filter by status (Active — has assigned students; Inactive — none).

**Adding a company:**

1. Click **Add Company**.
2. Fill in: name, address, contact person, contact email, contact number, company type (Public/Private), working days.
3. Submit.

**Editing a company:**

1. Click **Edit** on a company card.
2. Update the fields.
3. Save.

**Deleting a company:**

1. Click **Delete** on a company card.
2. Confirm deletion.

### 8.4 Settings

**Path:** `/admin/settings`

- **System Settings** — configure system-wide options
- **Maintenance Mode** — enable/disable maintenance mode (blocks non-admin users)
- **Export/Import** — manage admin setting files
- **NAS Operations** — manage NAS-related settings (when configured)

### 8.5 Notifications

**Path:** `/admin/notifications`

Monitor system-level notifications and alerts.

---

## 9. Security and Account Settings

### 9.1 Authentication

- All portals are protected by role-based route guards.
- Sessions use access tokens and refresh tokens.
- Unauthorized access redirects to the login page.

### 9.2 Two-Factor Authentication (2FA)

**Enabling 2FA:**

1. Go to **Settings > Security** (or **Two-Factor Authentication**).
2. Click **Enable 2FA**.
3. Follow the setup steps (email-based verification).
4. Save your **backup codes** in a safe place — these can be used if you lose access to your email.

**Using 2FA at login:**

1. After entering email and password, a 2FA prompt appears.
2. Enter the **one-time code** from your email.
3. Or enter a **backup code** if email is unavailable.

**Disabling 2FA:**

1. Go to **Settings > Security**.
2. Click **Disable 2FA**.
3. Confirm.

### 9.3 Profile Photo

1. Go to **Settings > Profile Photo**.
2. Click **Upload** and select an image.
3. Your photo appears across the portal (header, profile panels).
4. Click **Remove** to delete your current photo.

---

## 10. Status Definitions and Business Rules

### 10.1 Document Status

| Status | Meaning |
|--------|---------|
| **Pending** | Submitted and waiting for review |
| **Approved** | Accepted by the reviewer |
| **Rejected** | Not accepted |
| **Resubmission Requested** | Corrections required — review remarks and resubmit |

### 10.2 Company Application Status

| Status | Meaning |
|--------|---------|
| **Pending** | Submitted and waiting for decision |
| **Approved** | Placement accepted |
| **Rejected** | Placement denied |
| **Withdrawn** | Student withdrew the application |

### 10.3 Company Proposal Status

| Status | Meaning |
|--------|---------|
| **Submitted to Instructor** | Awaiting instructor review |
| **Returned by Instructor** | Sent back for corrections |
| **Rejected by Instructor** | Declined at instructor level |
| **Forwarded to Coordinator** | Passed to coordinator for final decision |
| **Under Coordinator Review** | Coordinator is reviewing |
| **Pending External Approval** | Waiting for external confirmation |
| **Approved** | Proposal accepted |
| **Rejected** | Proposal denied at coordinator level |

### 10.4 Attendance

- Verification methods: **QR**, **Manual** (GPS is supported by the system but not exposed as a separate button)
- Up to **two segments per day** (e.g., morning and afternoon shifts)
- Manual entries require **supervisor verification** (approve/reject)
- QR-verified entries are recorded automatically upon scan
- Saturday attendance is configurable based on company settings (private companies)

### 10.5 Evaluations

- Three official forms: **Form 11** (Internship Evaluation), **Form 18** (Supervisor Feedback), **Form 19b** (Agency Self-Evaluation)
- Only the **Industry Partner (supervisor)** can submit evaluations
- Students can **view** and **export** evaluations after submission
- Evaluations require an assigned company and supervisor

### 10.6 Document Completeness Requirement

The system enforces a **document completeness check** before a student can be approved for company placement or assigned to a company. If any of the following pre-deployment documents are not yet approved, the system will block the action and display which documents are still missing:

| Required Pre-Deployment Documents |
|----------------------------------|
| Application for Internship |
| Medical Certificate |
| Certification of Units |
| Internship Resume |
| Consent Form |
| Endorsement Letter (single or multi) |
| Internship Release |
| Record File |

This ensures that no student is released for OJT with incomplete requirements, preventing bias or oversight in the approval process.

---

## 11. Troubleshooting Guide

### Cannot log in

1. Confirm you are using the correct email and password.
2. Check if your account is active (contact your instructor or admin).
3. Use **Forgot Password** to reset.
4. If 2FA is enabled and you cannot receive the code, use a backup code.
5. Contact admin if the issue persists.

### Did not receive verification or 2FA code

1. Check your spam/junk folder.
2. Wait a moment, then click resend.
3. Confirm your registered email address is correct.

### Document upload fails

1. Check that your file type and size meet the requirements.
2. Ensure you have a stable internet connection.
3. Some documents require **form-based submission** (not file upload) — check if a form is available.

### Attendance not available

1. Confirm you have an **assigned company** and **supervisor**.
2. Check your application or proposal status — it must be approved.
3. Ask your coordinator or instructor to verify your assignment.

### Feature not visible

1. Some modules are only available to certain roles.
2. Some features depend on your current internship status (e.g., evaluations require company assignment).
3. Check your logged-in role and current workflow status.

### QR code not scanning

1. Ensure the QR code has not expired (check the timer).
2. Make sure the camera has permission to access in your browser.
3. Try using the **manual token** entry as an alternative.

---

## 12. Support and Escalation

When requesting support, provide:

- Your **full name** and **role**
- **Screenshot or video** of the issue
- **Date and time** it occurred
- **Page URL** or module name
- **Description** of what you expected vs. what happened

**Escalation path:**

1. **Student** → Instructor
2. **Instructor** → Coordinator
3. **Coordinator** → Admin / Technical Team

---

## Appendix A: System Deployment Guide

This appendix documents the full deployment process for INTRAK, from domain purchase to a running production system.

### A.1 Domain Registration (GoDaddy)

1. Purchase the domain (e.g. `intrak.site`) at [GoDaddy](https://www.godaddy.com).
2. After purchase, the domain appears under **My Products > Domains**.

GoDaddy is the **registrar** (you own the domain). DNS will be moved to Cloudflare in the next step.

### A.2 DNS Configuration (Cloudflare)

1. Create a [Cloudflare](https://dash.cloudflare.com) account.
2. Click **Add a site** and enter your domain.
3. Cloudflare provides **two nameservers** (e.g. `xxxx.ns.cloudflare.com`).
4. In GoDaddy, go to your domain > **DNS** > **Nameservers** > **Custom nameservers**.
5. Paste the two Cloudflare nameservers exactly and save.
6. Wait until the domain shows **Active** in Cloudflare (nameserver propagation may take a few minutes to hours).

**Why Cloudflare:** Provides central DNS management, optional CDN/proxy, and a clear interface. GoDaddy remains the registrar; Cloudflare becomes the DNS provider.

### A.3 AWS Account and EC2 Instance

**Creating the AWS account:**

1. Go to [aws.amazon.com](https://aws.amazon.com) and create an account.
2. Provide billing information (a free-tier eligible card works for initial setup).
3. Verify your identity and select a support plan.

**Launching an EC2 instance:**

1. Sign in to AWS Console > **EC2** (choose a region, e.g. `ap-southeast-1` for Southeast Asia).
2. Click **Launch Instance**.
3. Choose an AMI: **Ubuntu Server 22.04 LTS**.
4. Choose an instance type: **t3.micro** (sufficient for the application with low-memory Postgres tuning).
5. **Key pair**: create or select a `.pem` key file for SSH access. Save this file securely.
6. **Security group**: allow inbound traffic on:
   - Port **22** (SSH) — restrict to your IP if possible
   - Port **80** (HTTP)
   - Port **443** (HTTPS)
7. Click **Launch**.

**Assigning an Elastic IP:**

1. Go to **EC2 > Elastic IPs > Allocate Elastic IP address**.
2. Click **Associate** and link it to your instance.

An Elastic IP gives your server a **permanent public IP** that does not change when the instance is stopped or restarted.

### A.4 Pointing the Domain to the Server

1. In Cloudflare, go to **DNS > Records**.
2. Add an **A record**: Name = `@`, IPv4 address = your Elastic IP.
3. Optionally add a `www` CNAME or A record.
4. Set proxy mode as needed (orange cloud = proxied through Cloudflare, gray cloud = direct connection).

**Traffic flow:** User's browser > DNS lookup (Cloudflare) > Elastic IP > EC2 instance > Docker (Nginx on ports 80/443, API at `/api/`).

### A.5 Server Setup (on the EC2 instance)

1. **SSH into the instance:**
   ```
   ssh -i your-key.pem ubuntu@your-elastic-ip
   ```

2. **Install Docker Engine and Docker Compose plugin:**
   ```
   sudo apt update && sudo apt install -y docker.io docker-compose-plugin
   ```
   Verify:
   ```
   docker --version
   docker compose version
   ```

3. **Clone the repository:**
   ```
   git clone <repository-url> ~/intrak_v2
   cd ~/intrak_v2
   ```

4. **Configure environment variables:**
   - Copy `.env.aws.template` to `.env`
   - Fill in production values: database URL (host = `db`), CORS origin, client URL (your HTTPS domain), email provider keys, strong secrets
   - **Never commit the `.env` file**

5. **Set up TLS/HTTPS with Certbot:**
   ```
   sudo apt install -y certbot
   sudo certbot certonly --standalone -d yourdomain.com
   ```
   This creates certificate files under `/etc/letsencrypt/live/yourdomain.com/`. The Nginx container reads these via a volume mount.

   Certificates expire every ~90 days. Set up auto-renewal:
   ```
   sudo certbot renew --dry-run
   ```

6. **Start the application:**
   ```
   docker compose -f docker-compose.aws.yml up -d --build
   ```

   If using NAS storage (NAS mounted at `/mnt/nas` on the host):
   ```
   docker compose -f docker-compose.aws.yml -f docker-compose.aws.nas.yml up -d --build
   ```

7. **Verify:**
   ```
   docker compose ps
   docker compose logs -f --tail=100
   ```
   Then open `https://yourdomain.com` in a browser.

### A.6 What Happens on Startup

- **Docker Compose** builds and starts three containers: **db** (PostgreSQL 14), **server** (Node.js API on port 5000), and **client** (Nginx + built SPA on ports 80/443).
- The **server** container runs `server/scripts/aws-start.sh`, which executes **Prisma migrations** (`prisma migrate deploy`) before starting the Node.js application.
- The **API** is accessed by browsers through Nginx reverse proxy: `/api/` routes are forwarded to `http://server:5000/api/` on the Docker network.
- Environment variables are injected from `.env` via Docker Compose.

### A.7 Docker Compose Files

| File | Purpose |
|------|---------|
| `docker-compose.aws.yml` | Main stack: PostgreSQL, Node API, Nginx + SPA. Volumes: `db_data`, `uploads_data`. |
| `docker-compose.aws.nas.yml` | Optional overlay: bind-mounts host `/mnt/nas` and sets `NAS_PATH` for NAS storage. |
| `server/Dockerfile` | Builds the API image; CMD runs `scripts/aws-start.sh`. |
| `client/Dockerfile` | Multi-stage build: Vite compiles the SPA, then copies output to Nginx Alpine with `nginx.conf`. |

### A.8 Updating / Redeploying

1. SSH into the EC2 instance.
2. Navigate to the repository root:
   ```
   cd ~/intrak_v2
   ```
3. Pull the latest code:
   ```
   git pull
   ```
4. Rebuild and restart:
   ```
   docker compose -f docker-compose.aws.yml up -d --build
   ```
   (Add `-f docker-compose.aws.nas.yml` if using NAS.)

### A.9 Quick Reference Checklist

| Step | Where |
|------|-------|
| A record → Elastic IP | Cloudflare DNS |
| Ports 22, 80, 443 open | EC2 Security Group |
| Docker + Compose installed | EC2 Ubuntu |
| Repository cloned | `git clone` on EC2 |
| Secrets and URLs configured | `.env` file in repo root |
| HTTPS certificates created | Certbot → `/etc/letsencrypt` on host |
| Stack running | `docker compose -f docker-compose.aws.yml up -d --build` |

---

End of manual.
