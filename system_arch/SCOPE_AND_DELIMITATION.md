# Scope and Delimitation

> **Note:** This document is a draft for the thesis chapter. Transfer the final version to your Word document.

---

## Scope

### Approved project scope (original)

The following nine statements reflect the **approved capstone project scope** as presented. Wording is preserved.

1. Serve as a centralized platform for tracking internship activities and document submissions of Computer Engineering students.

2. Allow students to submit digital copies of internship requirements, including Daily Time Records (DTR), performance evaluations, and other related documents.

3. Enable coordinators to validate student submissions, provide feedback, and generate reports.

4. Monitor attendance through secure date and time logs of student logins.

5. Provide coordinators with evaluation and performance assessment tools to monitor intern progress.

6. Generate reports for students, coordinators, and the university to support documentation and assessment requirements.

7. Utilize a Network-Attached Storage (NAS) for secure, centralized storage and controlled access to internship-related documents.

8. Cover exclusively the Computer Engineering Department of PSU–Urdaneta City Campus.

9. Use login-based validation as the primary attendance tracking method; real-time geolocation tracking will not be implemented, focusing instead on timestamp-based verification.

### Additional scope — features implemented in INTRAK

Beyond the approved statements above, the developed system **additionally** provides the following capabilities. These extend operational detail and coverage while remaining consistent with items 1–9.

10. **Role-based access and security.** Five user roles (Student, Instructor, Coordinator, Industry Partner, Administrator), each with a dedicated portal and route-protected access. Authentication uses email and password; optional two-factor authentication (2FA) with email one-time codes and backup codes.

11. **Student account provisioning.** Instructors and administrators can create student accounts individually; instructors can bulk-import students via CSV (`studentNumber`, `name`, `email`, `year`, `phone`). New accounts receive a temporary password by email. Coordinators can assign instructors and assign students to companies; batch quick-assign is supported where enabled in the interface.

12. **Document workflow and compliance tooling.** Document review with approve, reject, and resubmission-request actions and remarks; structured dynamic forms for selected requirements; instructor **document checklist** by phase (pre-deployment, upon-approval, post-OJT) with per-student progress. The system **enforces** completion of required pre-deployment documents before company application approval or direct company assignment, reducing inconsistent release to OJT.

13. **Company placement and listings.** Maintained directory of partner companies; students browse and apply; instructors and/or coordinators review applications; slot limits are enforced on approval.

14. **Partnership assistance for non-listed companies.** Students propose companies not yet in the directory, with attachments and status workflow through instructor and coordinator. **Messaging** tied to proposals allows students, instructors, and coordinators to coordinate in-thread (with role identification).

15. **Memorandum of Agreement (MOA).** Coordinators can upload, preview, approve, reject (with reasons), and download MOAs linked to students and companies.

16. **Attendance verification methods (in addition to login timestamps).** Students may use **QR code** (time-limited code scanned or token-entered by the supervisor) or **manual** time-in/time-out (supervisor approves or rejects). Up to two attendance segments per day; optional Saturday handling for private companies; **no-work** notices with supervisor review.

17. **Structured evaluations (PSU forms).** Industry partners complete **Form 11** (internship evaluation, eight weighted competencies), **Form 18** (supervisor feedback with criterion ratings), and **Form 19b** (agency self-evaluation), with export of official outputs; students view completed evaluations.

18. **Announcements and notifications.** Coordinators create announcements with audience targeting (e.g., All, Students, Instructors, Partners), types, and pinning; optional AI-assisted drafting. System notifications alert users to workflow events; preferences are configurable where supported.

19. **Industry partner (supervisor) portal and accounts.** Supervisors verify attendance (logs, scanner, no-work tab), submit evaluations, and use announcements/notifications as applicable. Coordinators can **create supervisor accounts** for a company with email delivery of credentials.

20. **Administrative operations.** Administrators manage users (including student-specific fields and export), company records, system settings, maintenance mode, and settings backup/restore where implemented.

21. **Deployment and accessibility.** Production deployment uses **AWS EC2**, **Docker Compose**, **PostgreSQL**, **Nginx**, and **TLS (e.g., Let’s Encrypt/Certbot)**; optional **NAS bind-mount** for file storage. The client is a **responsive** web application with light/dark/system theme options.

---

## Delimitation

The following are explicitly outside the scope of this study:

1. **No real-time geolocation tracking.** As stated in approved scope item 9, attendance does not use GPS or continuous location tracking; verification uses timestamps plus QR or manual flows with supervisor involvement.

2. **No mobile native application.** The system is web-based; mobile access is through the browser only.

3. **No integration with external student information systems.** Student records are created and maintained inside INTRAK, not synced from the university SIS.

4. **No automated computation of final internship grades.** Evaluations support assessment; official grade computation remains with the department.

5. **No multi-department or multi-campus support.** As in approved scope item 8, coverage is limited to the Computer Engineering Department, PSU–Urdaneta City Campus.

6. **No built-in video or voice conferencing.** Messaging is text-based and scoped to partnership assistance threads; not a general real-time chat or meeting product.

7. **No offline mode.** An active internet connection is required.

8. **No payment or financial tracking.**

9. **No automated verification of document content** (e.g., OCR authenticity checks or plagiarism detection); reviewers validate submissions manually through the workflow.

10. **Attendance segment limit.** A maximum of two attendance segments per day is supported in the implementation.

11. **NAS and campus network dependency.** NAS use depends on physical hardware and network configuration; without NAS, files use server/cloud storage. Field verification at the campus is subject to network and equipment availability.

12. **Single-language interface (English).** No full localization to Filipino or other languages in this version.
