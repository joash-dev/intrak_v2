# CHAPTER 2: PROJECT DESIGN

## 2.1 Discussion of Alternative Designs

The design phase of INTRAK development explored three distinct architectural approaches, each offering different solutions to the document storage and network infrastructure requirements identified in Chapter 1. The comparison focused specifically on storage architecture alternatives, as this represents the critical design decision that distinguishes INTRAK's implementation from generic web application solutions.

Three primary design alternatives emerged from the ideation process: Network-Attached Storage (NAS) based architecture, Cloud-based storage architecture, and Local Server storage architecture. Each design variant shares common components—a PostgreSQL relational database for structured data management, a Node.js/Express.js backend API, and a React-based front-end interface—but differs fundamentally in how and where internship documents (PDFs, images, Word files) are stored and accessed.

The evaluation criteria for these alternative designs encompassed multiple dimensions aligned with project constraints and objectives. Economic considerations examined both initial capital expenditure and ongoing operational costs. Security analysis assessed data sovereignty, access control mechanisms, and compliance with institutional data governance policies. Performance evaluation focused on file upload/download speeds, concurrent user support, and scalability under growing data volumes. Risk assessment considered potential failure modes, recovery complexities, and dependencies on external services.

Each design alternative presented distinct trade-offs that required careful analysis to determine the optimal solution for PSU–Urdaneta City Campus's specific context. The following sections detail each design's architecture, advantages, limitations, and alignment with project constraints.

## 2.2 Design 1: Hybrid Cloud Architecture (Proposed Design)

### 2.2.1 Design Description

Design 1 implements a **Hybrid Cloud Architecture** that strategically combines cloud-based application hosting with on-premise document storage. This approach leverages the scalability and reliability of modern Platform-as-a-Service (PaaS) providers for the application logic and database, while maintaining institutional control over sensitive document data through a cost-effective Network-Attached Storage (NAS) solution.

In this architecture, the client tier (web browsers) connects to the application hosted on a **Virtual Private Server (VPS)** provided by **Hostinger**. When a student uploads a document, the backend API receives the file stream and securely transmits it to the on-premise **Raspberry Pi 4 NAS** located within the campus network via a **Tailscale VPN** tunnel. Metadata is stored in a Dockerized PostgreSQL database on the same VPS. This split architecture ensures that while the application is globally accessible and scalable, the bulk storage of binary files remains cost-effective and under local control.

### 2.2.2 Hardware/Network Design

**Client Layer:**
- Student workstations, faculty computers, and mobile devices
- Web browsers (Chrome, Firefox, Edge, Safari)
- Connect via Internet (HTTPS) to the Cloud Application

**Application Layer (Cloud-Hosted):**
- **Platform:** Hostinger VPS (Ubuntu Linux)
- **Frontend:** React Application (Dockerized)
- **Backend:** Node.js Service (Dockerized)
- **Database:** PostgreSQL (Dockerized)
- **Architecture:** Microservices / Decoupled Frontend-Backend

**Network-Attached Storage Layer (On-Premise):**
- **Device:** Raspberry Pi 4 Model B (4GB/8GB RAM)
- **Storage:** External USB 3.0 Hard Drives (RAID 1 via software)
- **OS:** Raspberry Pi OS / OpenMediaVault

### 2.3.1 Design Description

7. Client receives confirmation

**Document Retrieval Flow:**
1. User requests document
2. API retrieves cloud object URL from database
3. API generates time-limited signed URL for secure direct access
4. Client downloads file directly from cloud storage (or proxied through API)

### 2.3.5 Design Standards

- **Cloud Provider SLA Standards**: 99.9% or higher availability guarantees
- **S3 API Compatibility**: Industry-standard object storage API
- **Encryption at Rest**: AES-256 encryption for stored objects
- **Encryption in Transit**: TLS 1.3 for all data transmission
- **IAM/RBAC**: Cloud provider identity and access management

### 2.3.6 Design Constraints

**Strengths:**
- Unlimited scalability: Storage capacity grows automatically with demand
- Geographic flexibility: Accessible from any location with internet connectivity
- Zero infrastructure: No hardware procurement or maintenance required
- Automatic redundancy: Built-in multi-datacenter replication
- Pay-as-you-grow: Costs scale with actual usage
- Advanced features: CDN, versioning, lifecycle policies available

**Limitations:**
- Recurring costs: Monthly subscription fees based on storage volume and bandwidth
- External dependency: Critical university data stored in third-party infrastructure
- Compliance concerns: May conflict with institutional data sovereignty policies
- Internet dependency: Performance limited by internet connectivity quality
- Data transfer costs: Potential charges for bandwidth-intensive operations
- Vendor lock-in: Migration between cloud providers involves complexity

**Constraint Violations:**
- **Fails project delimitation**: "NAS will function as a local repository... will not include external cloud"
- **Data governance conflict**: Institutional policy preference for local data custody
- **Privacy concerns**: Third-party processing of student personal data requires additional legal safeguards

**Cost Analysis:**
- AWS S3 Standard: $0.023/GB/month
- For 1TB storage: ~$23/month + data transfer costs
- 5-year total: ~$1,380 (storage only) + transfer costs
- Compared to one-time NAS purchase: ~$1,200-1,800

## 2.4 Design 3: Local Server Storage Architecture

> **Note:** This section describes an alternative design that was considered but **rejected**. It is included for academic comparison purposes.

### 2.4.1 Design Description

Design 3 implements the simplest storage architecture where uploaded documents are stored directly on the application server's local file system. The Node.js/Express.js application writes files to designated directories on the server's hard drive, while the PostgreSQL database maintains metadata and file path references. This approach eliminates the need for additional storage infrastructure (NAS) or external services (cloud storage).

When students upload documents, the application validation process is identical to other designs, but the file write operation targets a local directory (e.g., `/var/intrak/uploads/documents/`) rather than a network share or cloud bucket. File paths are stored as relative paths in the database. Retrieval operations read files from the local filesystem and stream them to requesting clients.

This monolithic architecture co-locates all system components (application code, database, and file storage) on a single server or closely coupled server cluster. This simplification reduces system complexity and eliminates inter-system network dependencies.

### 2.4.2 Hardware/Network Design

**Infrastructure:**
- **Server:** Single Physical or Virtual Server
- **Storage:** Local DAS (Direct Attached Storage) / SSDs
- **Network:** Standard Campus LAN

### 2.4.3 Schematic Design

```
[Client] <---> [Monolithic Server]
                     |
            +--------+--------+
            |                 |
      [Local DB]       [Local Filesystem]
```

### 2.4.4 Illustrative Design

**Document Upload Flow:**
1. Student uploads file through web interface
2. Application receives file stream
3. Application writes file to local disk (e.g., `/var/www/uploads`)
4. Application records path in database
5. Client receives confirmation

**Document Retrieval Flow:**
1. User requests document
2. Application looks up path in database
3. Application reads file from local disk
4. Application streams file content to client

**Backup Process:**
- Institutional backup system mounts `/var/intrak/uploads` directory
- Daily incremental backups capture new/modified files
- Weekly full backups for disaster recovery

### 2.4.5 Design Standards

- **Linux ext4 Filesystem**: Standard Linux file system with journaling
- **Unix File Permissions**: POSIX permissions for access control
- **RAID 1 Mirroring**: Hardware redundancy for drive failure protection
- **Standard Backup Protocols**: rsync or institutional backup agent

### 2.4.6 Design Constraints

**Strengths:**
- Simplicity: Minimal infrastructure components reduce complexity
- Low initial cost: No separate storage hardware required
- Fast local access: No network latency for file operations
- Easy setup: Standard server configuration without specialized storage knowledge
- Data locality: All data co-located for simplified backup

**Limitations:**
- Limited scalability: Storage capacity constrained by server disk space
- Single point of failure: All system components on one server increases vulnerability
- Resource contention: File I/O competes with application and database for server resources
- Backup complexity: Large file volumes complicate backup windows
- Expansion difficulty: Scaling storage requires downtime to add drives
- Performance degradation: Large file collections impact filesystem performance

**Risk Factors:**
- Hardware failure impacts all system functions simultaneously
- Storage exhaustion: Fixed capacity may require emergency expansion
- Backup duration: Terabyte-scale backups may exceed maintenance windows

Reporting capabilities extract data from the PostgreSQL database and format it for presentation to various stakeholders. Students access progress dashboards showing document submission status, accumulated hours, and evaluation summaries. Coordinators generate cohort-level reports for compliance documentation, identifying students at risk of non-completion, and measuring program effectiveness. All reports support PDF export for archival purposes.

### 2.5.2 Technology Stack

**Front-End Layer:**
- React 18.x: Component-based UI library
- React Router: Client-side routing
- Axios: HTTP client for API communication
- Tailwind CSS: Utility-first CSS framework
- Chart.js: Data visualization for dashboards
- React Hook Form: Form validation and management

**Back-End Layer:**
- Node.js 18.x LTS: JavaScript runtime environment
- Express.js 4.x: Web application framework
- Prisma: Type-safe ORM for database operations
- JSON Web Tokens (JWT): Stateless authentication
- Multer: Middleware for file upload handling
- bcrypt: Password hashing

**Data Layer:**
- PostgreSQL 14.x: Relational database system
- Prisma Schema: Database modeling and migrations

**Infrastructure (Cloud-Native):**
- **Hosting Platform:** Hostinger VPS (KVM)
- **Database:** PostgreSQL (Self-Hosted Docker)
- **NAS OS:** Raspberry Pi OS (Debian-based)
- **Version Control:** Git (GitHub)

### 2.5.3 Database Schema Design (Entity-Relationship Model)

The database schema implements normalized relational design following third normal form (3NF) principles to minimize data redundancy while maintaining query performance. Key entities include:

**Core Entities:**
- `users`: Authentication credentials, personal information, role assignment
- `students`: Student-specific data (student number, program, assigned company, hours)
- `companies`: Internship host organizations with contact information
- `documents`: Document metadata (type, status, upload timestamp, file path)
- `attendance_logs`: Time-in/time-out records with verification flags
- `evaluations`: Performance assessment records with criteria ratings
- `document_feedback`: Reviewer comments and change requests on documents

**Relationship Patterns:**
- One-to-One: `users` ↔ `students` (student extends user)
- One-to-Many: `users` (instructor) → `students` (assigned students)
- One-to-Many: `companies` → `students` (students at company)
- One-to-Many: `students` → `documents` (student's documents)
- Many-to-Many: `students` ↔ `companies` (via `company_applications` join table)

**Key Integrity Constraints:**
- Foreign key relationships maintain referential integrity
- Unique constraints prevent duplicate student numbers, emails
- Check constraints validate enumerated types (document status, role)
- Not-null constraints enforce required fields

### 2.5.4 API Architecture

The REST API exposes structured endpoints organized by resource type, following standard HTTP method conventions:

**Authentication Endpoints:**
- `POST /api/auth/login`: User authentication, returns JWT
- `POST /api/auth/refresh`: Refresh token endpoint
- `POST /api/auth/logout`: Session termination

**Student Endpoints:**
- `GET /api/students`: List students (instructor/coordinator view)
- `POST /api/students`: Create student record (coordinator only)
- `GET /api/students/:id`: Retrieve student profile
- `PUT /api/students/:id`: Update student information
- `DELETE /api/students/:id`: Remove student (coordinator only)

**Document Endpoints:**
- `GET /api/documents`: List documents (filtered by role)
- `POST /api/documents/upload`: Upload document file
- `GET /api/documents/:id`: Retrieve document metadata
- `GET /api/documents/:id/download`: Download document file
- `PUT /api/documents/:id/approve`: Approve document (instructor/coordinator)
- `PUT /api/documents/:id/reject`: Reject document with comments
- `DELETE /api/documents/:id`: Delete document

**Attendance Endpoints:**
- `GET /api/attendance`: List attendance logs (student/instructor view)
- `POST /api/attendance/log`: Create attendance record
- `PUT /api/attendance/:id/verify`: Verify attendance (instructor)
- `GET /api/attendance/stats`: Attendance statistics and summaries

**Evaluation Endpoints:**
- `GET /api/evaluations`: List evaluations
- `POST /api/evaluations`: Submit evaluation (instructor/supervisor)
- `GET /api/evaluations/:id`: Retrieve evaluation details

All API endpoints implement JWT-based authentication through middleware that validates tokens on each request. Role-based authorization middleware enforces access controls, rejecting unauthorized requests with HTTP 403 status codes.

### 2.5.5 Security Architecture

Security measures span multiple layers of the application:

**Authentication:**
- Passwords hashed using bcrypt with salt rounds (cost factor 10)
- JSON Web Tokens (JWT) for stateless session management
- Refresh token rotation to limit exposure window
- Account lockout after failed login attempts

**Authorization:**
- Role-based access control (RBAC) enforced at API layer
- Function-level permissions checked before operation execution
- Data-level authorization ensures users access only permitted records

**Input Validation:**
- Server-side validation of all client inputs
- File type restrictions (whitelist approach) for uploads
- File size limits enforced to prevent storage/bandwidth abuse
- SQL injection prevention through parameterized queries (ORM)
- XSS prevention through output encoding

**Data Protection:**
- HTTPS/TLS encryption for all client-server communication
- Database connection encryption
- Sensitive data logging restrictions

**Audit Logging:**
- All state-changing operations logged with user ID, timestamp, action
- Log retention for compliance and security investigation

### 2.5.6 User Interface Design

The interface implements responsive design patterns enabling use across desktop, tablet, and mobile browsers. Key interface components include:

**Student Dashboard:**
- Progress indicators showing completion status
- Document upload interface with drag-drop support
- Attendance log with accumulated hours display
- Evaluation summary view

**Instructor Dashboard:**
- Assigned student list with status indicators
- Document review queue with filtering
- Attendance verification interface
- Evaluation form submission

**Coordinator Dashboard:**
- System-wide statistics and metrics
- Student management interface (CRUD operations)
- Company management
- Bulk document review tools
- Report generation interface

**Common Components:**
- Navigation sidebar with role-specific menu items
- Notification bell showing pending actions
- Profile menu with settings access
- Search and filter controls for list views

### 2.5.7 Design Standards

The software design adheres to:
- RESTful API design principles for stateless communication
- Component-based architecture for UI reusability
- MVC pattern separation (Model-View-Controller)
- SOLID principles for object-oriented design
- Security by design: authentication/authorization at every layer
- Responsive design for multi-device support

### 2.5.8 Design Constraints

**Technical Constraints:**
- Web-based only (no native mobile applications)
- PostgreSQL database requirement
- Campus network deployment environment

**Functional Constraints:**
- No e-signature implementation
- Login-based attendance (no GPS/geolocation)
- Computer Engineering department only
- Limited to student-coordinator-instructor-supervisor interactions

**Integration Constraints:**
- No external HR system integration
- No partner company system integration
- Local NAS storage (no cloud in selected design)

The software architecture provides a solid foundation for the INTRAK system, balancing functionality, security, usability, and maintainability within the defined project constraints.
