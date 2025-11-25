# CHAPTER 4: FINAL DESIGN

## 4.1 Final Design

The final design of INTRAK integrates the Hybrid Cloud with NAS storage architecture (Design 1) selected through the trade-off analysis with the comprehensive software system detailed in Chapter 2. This chapter presents the complete system architecture, network topology, and implementation specifications that guide development and deployment.

### 4.1.1 Hardware/Topological Design

The INTRAK deployment architecture consists of four logical tiers distributed across campus network infrastructure at PSU–Urdaneta City Campus, with secure extensions for remote access.

**Tier 1: Client Access Layer**

The client layer encompasses all user devices accessing the system through web browsers. Supported configurations include:
- Desktop computers in university computer laboratories
- Faculty workstations in departmental offices
- Student personal laptops connected to campus WiFi
- Industry partner devices accessing remotely via secure internet connection
- Mobile devices accessing via responsive web interface

All on-campus client devices connect through the campus local area network. Off-campus access (students at home, industry partners at workplaces) is facilitated through a secure internet gateway, maintaining the security perimeter around the application and storage infrastructure while enabling necessary remote functionality.

**Tier 2: Network Infrastructure Layer**

The campus network provides connectivity between clients and backend services. Key components include:
- Gigabit Ethernet backbone switches providing high-bandwidth connectivity
- Institutional firewall protecting the application server subnet from unauthorized external access
- Port forwarding rules (HTTPS 443, 5001) to enable secure remote access
- VLAN segmentation isolating administrative traffic from general student network traffic
- Network Address Translation (NAT) for outbound internet connectivity
- DNS services resolving internal hostnames and public domain for remote access

**Tier 3: Application and Database Layer**

This tier hosts the web application and relational database on a dedicated application server:

*Server Hardware:*
- Dell PowerEdge R340 1U rack server (or equivalent)
- Intel Xeon E-2224 processor (4-cores, 3.4GHz)
- 16GB DDR4 ECC RAM
- 500GB NVMe SSD (operating system, application code, PostgreSQL database)
- Dual gigabit Ethernet ports (primary and backup connectivity)

*Software Stack:*
- Ubuntu Server 20.04 LTS operating system
- Node.js 18.x LTS runtime environment
- PM2 process manager for application lifecycle management
- Nginx reverse proxy for static file serving and SSL termination
- PostgreSQL 14.x database server
- Automated backup agent for database dumps

*Network Configuration:*
- Static IP address: 10.20.30.40 (example internal address)
- Hostname: intrak.cpeng.psu.edu.ph
- HTTPS access on port 443 (Nginx), backend API on port 5000 (internal)
- SSH access on port 22 (restricted to IT administration)

**Tier 4: Storage Layer**

The NAS device provides centralized document repository services:

*NAS Hardware:*
- Synology DiskStation DS920+ (4-bay NAS enclosure)
- 4 × Western Digital Red Plus 4TB NAS drives
- RAID 5 configuration (3-drive capacity, 1-drive parity = ~12TB usable)
- 4GB RAM (expandable to 8GB)
- Dual gigabit Ethernet ports (link aggregation for 2 Gbps theoretical bandwidth)

1. Client requests document via HTTPS GET to `/api/documents/{id}/download`
2. Node.js API validates user authorization for specified document ID
3. Application queries PostgreSQL for document metadata and file path
4. Application checks authorization (student owns document OR instructor/coordinator)
5. Application reads file from NAS using stored file path (SMB or API)
6. Node.js streams file content to client with appropriate Content-Type header
7. Client browser displays PDF in-browser or initiates download based on MIME type

### 4.1.2 Software Design

**System Architecture Pattern**

INTRAK implements a three-tier Model-View-Controller (MVC) architecture with clear separation between presentation logic, business logic, and data access layers.

*Presentation Layer (View):*
React components render dynamic user interfaces. Key component hierarchies include:
- `StudentDashboard` → `DocumentUploadForm`, `AttendanceCalendar`, `ProgressCard`
- `InstructorDashboard` → `StudentList`, `DocumentReviewQueue`, `EvaluationForm`
- `CoordinatorDashboard` → `SystemMetrics`, `BulkDocumentReview`, `ReportGenerator`
- `SupervisorDashboard` → `AttendanceVerification`, `EvaluationForm`

State management utilizes React Context API for global application state (authenticated user, notifications) and local component state via useState hooks for UI-specific data.

*Business Logic Layer (Controller):*
Express.js route handlers and middleware functions implement business rules. Critical controllers include:
- `authController.js`: User authentication, token generation/validation
- `studentController.js`: Student CRUD operations, profile management
- `documentController.js`: Document upload, review, approval workflows
- `attendanceController.js`: Attendance logging, verification, hour accumulation
- `evaluationController.js`: Performance evaluation submission and retrieval

Middleware functions enforce cross-cutting concerns:
- `authenticateToken`: JWT validation on all protected routes
- `authorizeRole`: Role-based access control checks
- `validateInput`: Request payload schema validation
- `errorHandler`: Centralized error response formatting

*Data Access Layer (Model):*
Prisma ORM abstracts database operations through type-safe client APIs. The Prisma schema defines all database entities and relationships. Key models include:
- `User` model with relations to role-specific data (Student, Instructor)
- `Document` model with status workflow and feedback relations
- `AttendanceLog` model with foreign key to Student
- `Evaluation` model linking students, evaluators, and criteria

**Database Schema Highlights**

Entity-Relationship highlights:
- **Users** (id, email, passwordHash, role, profilePhoto) - Central authentication entity
- **Students** (id, userId FK, studentNumber, companyId FK, instructorId FK, completedHours)
- **Companies** (id, name, address, contactPerson, supervisorId FK)
- **Documents** (id, studentId FK, type ENUM, filepath, status ENUM, uploadedById FK)
- **AttendanceLogs** (id, studentId FK, date, timeIn, timeOut, verified BOOLEAN)
- **Evaluations** (id, studentId FK, evaluatorId FK, rating, criteria JSONB, comments)

Enumerated types ensure data integrity:
- DocumentType: {APPLICATION_LETTER, MOA, MEDICAL_CERTIFICATE, DTR_HARDCOPY, ...}
- DocumentStatus: {PENDING, APPROVED, REJECTED, RESUBMISSION_REQUESTED}
- Role: {STUDENT, INSTRUCTOR, COORDINATOR, INDUSTRY_PARTNER}

**API Specifications**

RESTful endpoints follow standard HTTP semantics:

*Authentication:*
- `POST /api/auth/login` - Body: {email, password} → Returns: {accessToken, refreshToken, user}
- `POST /api/auth/refresh` - Body: {refreshToken} → Returns: {accessToken}
- `POST /api/auth/logout` - Invalidates refresh token

const maxFileSize = 10 * 1024 * 1024; // 10MB

if (!allowedMimeTypes.includes(file.mimetype)) {
  throw new Error('Invalid file type');
}
if (file.size > maxFileSize) {
  throw new Error('File too large');
}
```

**User Interface Components**

The React front-end implements a modern, responsive design using Tailwind CSS utility classes. Key UI patterns include:

*Dashboard Layout:*
- Sidebar navigation with role-specific menu items
- Main content area with card-based information display
- Top navigation bar with notifications bell and profile menu
- Responsive breakpoints: mobile (<640px), tablet (640-1024px), desktop (>1024px)

*Document Upload Interface:*
- Drag-and-drop file upload zone
- File type/size validation with immediate user feedback
- Upload progress indicator during transmission
- Success confirmation with quick action to view uploaded documents list

*Document Review Interface (Instructor/Coordinator):*
- Filterable table of pending documents
- In-browser PDF preview pane
- Approve/Reject action buttons with remarks text area
- Bulk selection for batch operations (coordinator only)

*Attendance Calendar:*
- Monthly calendar view showing attendance days
- Daily detail panel showing time-in, time-out, hours
- Color coding: verified (green), unverified (yellow), absent (gray)
- Hours summary progress bar toward completion goal

## 4.2 Test Procedure and Evaluation

Testing the INTRAK system encompasses multiple levels to ensure functional correctness, security, performance, and usability. The test strategy follows industry-standard practices adapted for academic system deployments.

### 4.2.1 Test Procedures

**Unit Testing**

Unit tests validate individual functions and components in isolation using Jest testing framework for backend code and React Testing Library for front-end components.

*Backend Unit Tests:*
- Authentication functions (password hashing, JWT generation, token validation)
- Data validation functions (file type checking, input sanitization)
- Business logic functions (hour calculation, document status transitions)
- Database query functions (Prisma model operations)

Example test case:
```javascript
describe('Authentication Service', () => {
  test('should hash password with bcrypt', async () => {
*Load Testing Scenarios:*
- Concurrent user simulation: 50 simultaneous users browsing dashboards
- Peak document upload: 20 students uploading 5MB files simultaneously
- Report generation: Coordinator generates 100-student attendance report
- Database query performance: NAS file listing with 1000+ documents
- Remote access latency test: Simulated external connections with 100ms latency

*Performance Metrics:*
- Page load time: Target <2 seconds for dashboard pages
- API response time: Target <500ms for standard queries
- File upload speed: Target >1MB/s (Local), >500KB/s (Remote)
- Database query execution: Target <100ms for indexed queries

*Tools:*
- Apache JMeter or Artillery for load testing
- Chrome DevTools for front-end performance profiling
- PostgreSQL EXPLAIN ANALYZE for query optimization

**Security Testing**

Security tests identify vulnerabilities and verify protection mechanisms.

*Security Test Cases:*
- SQL injection attempts via input fields
- Cross-site scripting (XSS) payload injection
- Cross-site request forgery (CSRF) attack simulation
- JWT token tampering and expiration enforcement
- File upload of executable files (should be rejected)
- Unauthorized access attempts (accessing other students' documents)
- Brute force login attempts (should trigger account lockout)
- **Remote Access Penetration Test:** Attempting to bypass firewall rules
- **NAS API Security Test:** Attempting unauthenticated access to NAS ports

*Tools:*
- OWASP ZAP for automated vulnerability scanning
- Manual penetration testing of critical endpoints
- Code review focusing on user input handling
- Nmap for port scanning (verifying only 443/5001 open)

**User Acceptance Testing (UAT)**

UAT involves actual end-users (students, instructors, coordinators) validating that the system meets operational requirements.

*UAT Participants:*
- 5 Computer Engineering students representing typical users
- 2 instructors with assigned student cohorts
- 1 OJT coordinator overseeing the program
- 2 Industry Partners (simulated or actual)

*UAT Test Scenarios:*
- Complete realistic workflows with actual internship documents
- Identify usability issues in navigation or interface
- Validate that workflows match established departmental procedures
- Confirm report outputs meet documentation requirements
- Assess mobile browser experience on student devices
- Verify remote access speed and reliability

*UAT Feedback Collection:*
- Post-task questionnaires (System Usability Scale - SUS)
- Interview sessions to gather qualitative feedback
- Issue tracking for bugs or enhancement requests
- Acceptance criteria checklist sign-off

### 4.2.2 Test Evaluation Criteria

Tests are evaluated against defined acceptance criteria:

*Functional Correctness:*
- All specified features operate as documented
- Edge cases handled gracefully (empty states, maximum values)
- Error messages provide actionable guidance to users

*Security:*
- No critical or high-severity vulnerabilities identified
- Authentication and authorization correctly enforced
- Sensitive data protected in transit and at rest
- Remote access secured via HTTPS and Firewall

*Performance:*
- Response times meet defined thresholds under expected load
- System remains responsive with realistic concurrent user count
- Database queries optimized with appropriate indexing

*Usability:*
- Users complete tasks without assistance (success rate >85%)
- Average SUS score >70 (indicating acceptable usability)
- Critical workflows completable within reasonable time

*Compatibility:*
- Front-end renders correctly on Chrome, Firefox, Edge (latest versions)
- Responsive design functional on tablets and mobile devices
- No console errors or warnings in browser developer tools

## 4.3 Test and Evaluation Results

This section presents preliminary test results from development and staging environments. Final results will be updated during implementation and deployment phases.

### 4.3.1 Test Results (Preliminary)

**Unit Test Results:**
- Backend unit tests: 87 tests, 100% pass rate
- Key functions tested: Authentication, validation, business logic
- Code coverage: 85% line coverage, 78% branch coverage
- Execution time: <5 seconds total suite runtime

**Integration Test Results:**
- API endpoint tests: 42 test cases across 15 endpoints
- Pass rate: 95% (2 failing tests related to edge case handling - documented for resolution)
- Database integration: All foreign key constraints validated
- Transaction rollback scenarios tested successfully

**System Test Results:**
- End-to-end workflows: 9 critical workflows tested (including remote access)
- Pass rate: 100% for primary paths
- Identified 3 minor UI issues (incorrect error message wording, inconsistent button placement)
- Cross-browser testing revealed minor CSS rendering differences (non-critical)

**Performance Test Results (Staging Environment):**
- Concurrent users: Tested up to 30 simultaneous users
- Average page load time: 1.2 seconds (well within 2-second target)
- API response times: 150-300ms for most endpoints (within 500ms target)
- File upload: 1.5MB/s (Local), 600KB/s (Remote - simulated)
- Database queries: 95% execute in <50ms, remaining 5% in <100ms

*Load Test Observations:*
- System stable under sustained load
- Memory consumption linear with user count (no memory leaks detected)
- CPU utilization peaks at 45% during concurrent uploads
- NAS throughput sufficient for expected document volumes

**Security Test Results:**
- OWASP ZAP automated scan: 0 high-severity issues, 2 medium-severity issues (documented)
- SQL injection tests: All attempts successfully blocked by parameterized queries
- XSS tests: Input sanitization prevents script injection
- Authentication bypass attempts: All failed (proper authorization enforcement)
- File upload validation: Executable files correctly rejected
- **Remote Access Security:** Port scan confirmed only ports 443 and 5001 open. External access to SMB (445) successfully blocked.

*Identified Security Enhancements:*
- Implement rate limiting on login endpoint (mitigate brute force)
- Add Content Security Policy (CSP) headers (defense-in-depth XSS protection)
- Both enhancements scheduled for pre-production deployment

**User Acceptance Testing Results (Pilot Group):**
- Participants: 3 students, 1 instructor, 1 coordinator, 1 industry partner
- Task completion rate: 92% (23 of 25 tasks completed without assistance)
- Average System Usability Scale (SUS) score: 78 (above 70 threshold, indicates good usability)
- Time to complete document upload: Average 2.5 minutes (acceptable)
- Time to complete document review: Average 4 minutes (acceptable)

*User Feedback Highlights:*
- Positive: "Interface is intuitive and modern"
- Positive: "Much faster than email-based submission"
- Positive (Industry Partner): "Remote evaluation is very convenient"
- Enhancement request: "Add bulk download feature for multiple documents"
- Enhancement request: "Email notifications when document status changes"

### 4.3.2 Evaluation Results Conclusion

The INTRAK system demonstrates strong performance across functional, security, and usability dimensions based on preliminary testing. Key findings:

**Strengths Validated:**
1. **Functional Completeness:** All core requirements (document management, attendance tracking, evaluation submission) operate correctly.
2. **Security Posture:** No critical vulnerabilities identified; authentication and authorization mechanisms function as designed. Remote access is securely implemented.
3. **Performance:** Response times well within acceptable ranges for university network environment.
4. **Usability:** Users successfully complete tasks with minimal training; SUS score indicates good usability.

**Areas for Enhancement:**
1. **Test Coverage:** Increase unit test branch coverage from 78% to target 85% before production deployment.
2. **Edge Case Handling:** Resolve 2 failing integration tests related to concurrent document uploads.
3. **Security Hardening:** Implement identified enhancements (rate limiting, CSP headers) before production.
4. **Feature Additions:** Evaluate user-requested features (bulk download, email notifications) for future releases.

**Readiness Assessment:**
The system meets the criteria for proposal defense demonstration. Core functionality operates reliably, security measures protect sensitive data, and users can accomplish their tasks efficiently. Minor enhancements identified through testing will be addressed during the implementation phase prior to production deployment.

The testing methodology validates the design decisions made in preceding chapters. The NAS-based architecture performs well under load, the RESTful API design facilitates testing and integration, and the React-based UI delivers responsive user experience. The system stands ready for expanded pilot testing with larger user groups and eventual production deployment.

## 4.4 Conclusion

The INTRAK system successfully addresses the internship management challenges identified in Chapter 1 through a comprehensive web-based platform integrating NAS-based document storage. The systematic engineering design process followed throughout this project—from problem identification through iterative design, trade-off analysis, and rigorous testing—produced a robust solution aligned with institutional requirements and constraints.

The selection of Hybrid Cloud with NAS storage architecture (Design 1) over cloud-based (Design 2) and local server storage (Design 3) alternatives emerged from quantitative trade-off analysis prioritizing data security, institutional control, and long-term sustainability. This design decision proves sound, as testing validates performance, security, and reliability within the campus network environment.

The implementation adheres to established engineering standards (ISO 25010, ISO 27001) and incorporates industry best practices in web application security, database design, and user interface development. The technology stack selection (PostgreSQL, Node.js, React) provides a sustainable foundation with strong community support and clear upgrade paths.

Testing results demonstrate functional correctness, acceptable performance under expected load, robust security posture, and good usability as measured by standard metrics. The system meets the requirements specified in the project scope and operates within the delimitations established for this study.

Remaining work prior to full production deployment includes addressing minor issues identified through testing, implementing security enhancements, and conducting expanded user acceptance testing with larger cohorts. The system architecture supports these iterations and future expansion to additional departments if institutional requirements evolve.

INTRAK represents a significant advancement over manual, paper-based OJT management processes, delivering measurable benefits to all stakeholders: students gain real-time visibility into their progress, instructors reduce administrative overhead, coordinators obtain comprehensive reporting capabilities, and the department achieves compliance with documentation requirements. The system establishes a foundation for digital transformation of internship management at PSU–Urdaneta City Campus.

## 4.5 Impact of the Design to the Community

The implementation of INTRAK delivers substantial positive impacts to the Computer Engineering Department community and broader institutional benefits for Pangasinan State University–Urdaneta City Campus.

**Impact on Computer Engineering Students:**

Students benefit from streamlined internship workflows that reduce administrative friction and enable focus on learning objectives. The digital document submission system eliminates the need for physical document delivery to campus, particularly valuable for students interning at distant companies. Real-time status visibility reduces uncertainty about document approval, allowing students to take corrective action promptly for rejected submissions.

The attendance tracking system provides immediate feedback on progress toward hour requirements, helping students plan their internship schedules to ensure timely completion. The centralized evaluation repository allows students to review performance feedback from both instructors and industry supervisors, supporting self-reflection and professional development.

The system's web-based accessibility enables students to manage internship requirements from any location with campus network access, accommodating diverse circumstances without requiring campus visits during internship periods.

**Impact on Faculty (Instructors and Coordinators):**

Faculty members experience significant reduction in administrative workload through automated workflows and centralized information access. Instructors spend less time manually tracking document submissions and can quickly review digital documents without managing physical files. The bulk review features for coordinators enable efficient processing of cohort-level submissions.

The automated reporting capabilities eliminate manual data aggregation for compliance documentation. Coordinators generate comprehensive reports for administration, accreditation bodies, and partner companies with minimal effort, freeing time for higher-value activities such as curriculum development and student mentorship.

Real-time dashboards provide visibility into program metrics enabling proactive intervention for at-risk students. Faculty identify students falling behind on hour accumulation or document submissions early enough to provide support before deadline crises occur.

**Impact on Industry Partners:**

Industry supervisors gain efficient mechanisms for submitting performance evaluations and verifying student attendance without relying on email communications or physical forms. The streamlined interface respects supervisors' time by minimizing friction in completing their responsibilities to the internship program.

The professional presentation of the INTRAK system enhances the university's reputation with industry partners, demonstrating technological competence and organizational maturity. This positive impression strengthens relationships that may lead to increased internship placement opportunities and potential research collaborations.

**Impact on Department Operational Efficiency:**

The Computer Engineering Department achieves operational efficiency gains through:
- Reduction in paper consumption (~10,000 sheets per semester, ~$200 annual cost savings)
- Elimination of physical storage requirements for internship records
- Decreased processing time for document reviews (estimated 40% time savings for coordinators)
- Improved data integrity through automated validation and audit trails
- Enhanced compliance with document retention policies through systematic archival

The ability to generate on-demand reports supports data-driven decision-making for program improvements. Analysis of historical evaluation data reveals trends in student performance, identifies skills gaps, and informs curriculum adjustments.

**Impact on Institutional Digital Transformation:**

INTRAK establishes a model for digital transformation of administrative processes at PSU–Urdaneta City Campus. The successful implementation demonstrates feasibility of modernizing paper-based workflows while maintaining compliance with institutional data governance policies through NAS-based local storage.

The project provides a replicable template for other departments considering similar digitization initiatives. The technology stack, deployment architecture, and implementation methodology can be adapted for internship management in other engineering disciplines (Mechanical Engineering, Electrical Engineering, Civil Engineering) or professional programs requiring practicum experiences.

**Environmental and Sustainability Impact:**

The transition from paper to digital processes delivers measurable environmental benefits. The elimination of paper-based DTR logs, evaluation forms, and document submissions reduces the department's paper consumption by approximately 50 kg per semester, translating to reduced carbon footprint (~150 kg CO2e annually) and decreased demand on university printing resources.

The digital archival system ensures long-term preservation of student records without physical degradation concerns. Unlike paper documents subject to damage, loss, or deterioration, digital records maintained on redundant NAS storage with backup replication provide superior data permanence.

**Educational Impact Beyond Computer Engineering:**

The development of INTRAK provides valuable learning experiences for Computer Engineering students involved in the project. The real-world application context exposes students to complete software systems engineering lifecycles—requirements analysis, architectural design, implementation, testing, and deployment—strengthening their preparation for professional careers.

The system serves as a living case study for software engineering courses, demonstrating practical application of database design, web development, security principles, and systems administration concepts taught in the curriculum.

**Scalability and Future Expansion Potential:**

While currently scoped to the Computer Engineering Department, INTRAK's architecture supports expansion to additional departments without fundamental redesign. The role-based access control system accommodates additional user roles, the NAS storage scales through capacity expansion, and the database schema extends to support multiple departments through appropriate partitioning.

This scalability potential positions INTRAK as institutional infrastructure that delivers long-term value beyond the initial implementation scope, maximizing return on development investment.

**Community Knowledge Contribution:**

The INTRAK project contributes to the body of knowledge around internship management systems in Philippine higher education contexts. The documentation of design decisions, trade-off analyses, and implementation details provides reference material for other institutions facing similar challenges. The demonstration that NAS-based local storage architectures can effectively support academic systems offers an alternative to cloud-dependent solutions for institutions with data sovereignty requirements.

The positive impacts of INTRAK extend across multiple stakeholder groups, delivering immediate operational benefits while establishing foundation for continued innovation in academic program management. The system directly advances the Computer Engineering Department's mission of providing high-quality, industry-relevant education by reducing administrative barriers and enabling focus on the pedagogical and professional development aspects of the internship experience.
