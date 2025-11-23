# CHAPTER 2: PROJECT DESIGN

## 2.1 Discussion of Alternative Designs

The design phase of INTRAK development explored three distinct architectural approaches, each offering different solutions to the document storage and network infrastructure requirements identified in Chapter 1. The comparison focused specifically on storage architecture alternatives, as this represents the critical design decision that distinguishes INTRAK's implementation from generic web application solutions.

Three primary design alternatives emerged from the ideation process: Network-Attached Storage (NAS) based architecture, Cloud-based storage architecture, and Local Server storage architecture. Each design variant shares common components—a PostgreSQL relational database for structured data management, a Node.js/Express.js backend API, and a React-based front-end interface—but differs fundamentally in how and where internship documents (PDFs, images, Word files) are stored and accessed.

The evaluation criteria for these alternative designs encompassed multiple dimensions aligned with project constraints and objectives. Economic considerations examined both initial capital expenditure and ongoing operational costs. Security analysis assessed data sovereignty, access control mechanisms, and compliance with institutional data governance policies. Performance evaluation focused on file upload/download speeds, concurrent user support, and scalability under growing data volumes. Risk assessment considered potential failure modes, recovery complexities, and dependencies on external services.

Each design alternative presented distinct trade-offs that required careful analysis to determine the optimal solution for PSU–Urdaneta City Campus's specific context. The following sections detail each design's architecture, advantages, limitations, and alignment with project constraints.

## 2.2 Design 1: NAS-Based Document Storage (Proposed Design)

### 2.2.1 Design Description

Design 1 implements a three-tier web application architecture with integrated Network-Attached Storage for document repository management. The client tier consists of web browsers accessing the system through the campus network. The application tier comprises a Node.js/Express.js API server that processes business logic, manages user authentication, and orchestrates database and file storage operations. The data tier includes two components: a PostgreSQL database for structured data (user accounts, attendance records, document metadata, evaluation data) and a NAS device for binary file storage (uploaded documents).

This architecture leverages institutional NAS infrastructure deployed within the PSU–Urdaneta City Campus network. When students upload required documents, the web application receives the file, validates its type and size, stores the binary content on the NAS via SMB/CIFS protocol, and records metadata (filename, file path, upload timestamp, document type, status) in the PostgreSQL database. Subsequent retrieval operations query the database for file metadata, then stream the actual file content from NAS to the requesting client.

The separation of structured data and binary file storage optimizes each storage system for its specific purpose. PostgreSQL provides ACID transaction guarantees for critical academic records, while NAS delivers high-capacity, high-performance file storage with features such as RAID redundancy, snapshot capabilities, and centralized backup integration.

### 2.2.2 Hardware/Network Design

![Design 1 Network Topology]

**Client Layer:**
- Student workstations, faculty computers, and mobile devices
- Web browsers (Chrome, Firefox, Edge, Safari)
- Connect via campus LAN or institutional VPN

**Application Server Layer:**
- Dell PowerEdge R340 or equivalent server
- Ubuntu Server 20.04 LTS operating system
- Node.js runtime environment
- 8GB RAM, 4-core processor
- 500GB SSD for application and database

**Database Server:**
- PostgreSQL 14.x installation (co-located with application server in initial deployment)
- Structured data storage for user accounts, metadata, attendance, evaluations

**Network-Attached Storage Layer:**
- Synology DiskStation DS920+ or equivalent 4-bay NAS
- 4 × 4TB enterprise NAS drives in RAID 5 configuration
- Provides ~12TB usable storage capacity
- SMB/CIFS file sharing protocol
- Gigabit Ethernet connectivity to campus network

**Network Infrastructure:**
- Gigabit Ethernet campus LAN backbone
- Managed layer-3 switch for application server subnet
- Institutional firewall protecting perimeter access
- VLAN segmentation for administrative traffic

### 2.2.3 Schematic Design

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Student    │  │  Instructor  │  │ Coordinator  │          │
│  │ Workstation  │  │     PC       │  │     PC       │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
                    ┌────────▼─────────┐
                    │  Campus Network  │
                    │   (Firewall)     │
                    └────────┬─────────┘
                             │
          ┌──────────────────┴──────────────────┐
          │                                     │
┌─────────▼──────────┐              ┌──────────▼───────────┐
│ APPLICATION SERVER │              │  NETWORK-ATTACHED    │
│                    │              │      STORAGE         │
│  ┌──────────────┐  │              │                      │
│  │   Node.js    │  │              │  ┌───────────────┐   │
│  │  Express.js  │  │◄────SMB──────┤  │ File Storage  │   │
│  │    API       │  │              │  │  (Documents)  │   │
│  └──────┬───────┘  │              │  └───────────────┘   │
│         │          │              │                      │
│  ┌──────▼───────┐  │              │  RAID 5 Array        │
│  │  PostgreSQL  │  │              │  12TB Capacity       │
│  │   Database   │  │              └──────────────────────┘
│  │  (Metadata)  │  │
│  └──────────────┘  │
│                    │
│  Ubuntu Server     │
└────────────────────┘
```

### 2.2.4 Illustrative Design

**Data Flow - Document Upload Process:**

1. Student accesses upload interface via web browser
2. Student selects file and submits upload form
3. React front-end sends POST request to API endpoint with multipart/form-data
4. Express.js middleware validates file type, size, and user authorization
5. API generates unique filename and constructs storage path
6. Application writes file to NAS mount point via SMB protocol
7. Upon successful write confirmation, application creates database record with metadata
8. API returns success response to client with document ID
9. Client updates interface to show uploaded document in student's document list

**Data Flow - Document Retrieval Process:**

1. Instructor/Coordinator requests document for review
2. Client sends GET request to API with document ID
3. API validates user authorization for document access
4. API queries PostgreSQL for document metadata and file path
5. API reads file content from NAS via file path
6. API streams file content to client as HTTP response
7. Client browser displays or downloads document based on MIME type

### 2.2.5 Design Standards

Design 1 adheres to the following technical standards and protocols:

- **SMB 3.0 Protocol**: Secure, encrypted file sharing between application server and NAS
- **PostgreSQL ACID Compliance**: Ensures transactional integrity for metadata operations
- **RESTful API Architecture**: Stateless client-server communication following REST principles
- **OAuth 2.0 / JWT Authentication**: Token-based authentication for API security
- **HTTPS/TLS 1.3**: Encrypted communication between clients and application server
- **ISO/IEC 25010 Quality Standards**: Software quality assurance framework
- **RAID 5 Data Protection**: Hardware redundancy for fault tolerance

### 2.2.6 Design Constraints

This design operates within the following constraints:

**Strengths:**
- Data sovereignty: All documents remain under institutional physical control
- Performance: Gigabit LAN provides high-speed file transfers (theoretical 125 MB/s)
- Cost: One-time NAS hardware purchase eliminates recurring subscription fees
- Integration: NAS integrates with existing campus backup systems
- Security: Network perimeter controls limit access to campus users
- Scalability: NAS capacity easily expanded by adding drives or expansion units

**Limitations:**
- Geographic restriction: NAS access limited to campus network (aligns with delimitation)
- Infrastructure dependency: Requires NAS hardware procurement and configuration
- Complexity: Additional infrastructure component increases system administration requirements
- Power dependency: NAS device requires continuous power and cooling
- Initial cost: Higher upfront capital expenditure compared to alternatives

**Alignment with Project Constraints:**
- Satisfies "local repository within PSU's network infrastructure" requirement
- Complies with institutional data governance policies requiring local data storage
- Supports long-term document retention without dependency on external services
- Enables compliance with Philippine Data Privacy Act through institutional data custody

## 2.3 Design 2: Cloud-Based Storage Architecture

### 2.3.1 Design Description

Design 2 implements a cloud-first architecture where document files are stored in third-party cloud storage services such as Amazon S3, Google Cloud Storage, or Microsoft Azure Blob Storage. The application tier (Node.js/Express.js API) and database tier (PostgreSQL) remain similar to Design 1, but file storage operations invoke cloud provider APIs rather than local file system operations.

When students upload documents, the application receives the file, performs validation, then transmits the file content to the cloud storage service via HTTPS API calls. The cloud service returns a unique object identifier or URL, which the application stores in the PostgreSQL database alongside document metadata. File retrieval operations fetch the cloud object URL from the database, then either redirect clients to the cloud URL or proxy the content through the application server.

Cloud storage services provide built-in redundancy, geographic distribution, and elastic scalability without infrastructure management requirements. Many services offer integrated features such as content delivery networks (CDN), automated backup, and sophisticated access control mechanisms.

### 2.3.2 Hardware/Network Design

**Client Layer:**
- Same as Design 1 (web browsers on student/faculty devices)

**Application Server Layer:**
- Virtual machine instance (e.g., AWS EC2 t3.medium, Google Cloud E2-medium)
- 2 vCPU, 4GB RAM
- Minimal local storage (OS and application code only)
- Cloud provider networking and security groups

**Database Layer:**
- Managed database service (e.g., AWS RDS for PostgreSQL, Google Cloud SQL)
- Automated backups, patches, and high availability
- Network-isolated database subnet

**Storage Layer:**
- Cloud object storage service (AWS S3, Google Cloud Storage, Azure Blob)
- Unlimited scalability
- Geographic redundancy
- Pay-per-GB pricing model

**Network Infrastructure:**
- Internet connectivity for campus users
- Cloud provider backbone for application-to-storage communication
- HTTPS/TLS encryption for all data transmission

### 2.3.3 Schematic Design

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                         │
│  Students, Instructors, Coordinators via Browsers       │
└────────────┬────────────────────────────────────────────┘
             │  HTTPS
             │
    ┌────────▼────────────┐
    │     Internet        │
    └────────┬────────────┘
             │
    ┌────────▼───────────────────────────────────────┐
    │         CLOUD PROVIDER INFRASTRUCTURE          │
    │                                                 │
    │  ┌──────────────────┐      ┌───────────────┐   │
    │  │ Application      │      │ Object        │   │
    │  │ Server (VM)      │◄────►│ Storage       │   │
    │  │                  │ API  │ (S3/GCS/Blob) │   │
    │  │  Node.js + API   │      │               │   │
    │  └────────┬─────────┘      │ Documents     │   │
    │           │                │ Stored Here   │   │
    │  ┌────────▼─────────┐      └───────────────┘   │
    │  │  Managed         │                           │
    │  │  PostgreSQL DB   │                           │
    │  │  (Metadata)      │                           │
    │  └──────────────────┘                           │
    │                                                  │
    └──────────────────────────────────────────────────┘
```

### 2.3.4 Illustrative Design

**Document Upload Flow:**
1. Student uploads file through web interface
2. API validates file and generates unique object key
3. Application invokes cloud storage API (e.g., S3 PutObject)
4. File content transmitted to cloud storage over HTTPS
5. Cloud service confirms successful storage and returns object URL
6. Application creates database record linking document metadata to cloud object
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

### 2.4.1 Design Description

Design 3 implements the simplest storage architecture where uploaded documents are stored directly on the application server's local file system. The Node.js/Express.js application writes files to designated directories on the server's hard drive, while the PostgreSQL database maintains metadata and file path references. This approach eliminates the need for additional storage infrastructure (NAS) or external services (cloud storage).

When students upload documents, the application validation process is identical to other designs, but the file write operation targets a local directory (e.g., `/var/intrak/uploads/documents/`) rather than a network share or cloud bucket. File paths are stored as relative paths in the database. Retrieval operations read files from the local filesystem and stream them to requesting clients.

This monolithic architecture co-locates all system components (application code, database, and file storage) on a single server or closely coupled server cluster. This simplification reduces system complexity and eliminates inter-system network dependencies.

### 2.4.2 Hardware/Network Design

**Unified Server:**
- Dell PowerEdge R440 or equivalent server
- Ubuntu Server 20.04 LTS
- Node.js application runtime
- PostgreSQL database
- 16GB RAM, 8-core processor
- 2TB RAID 1 array for OS, application, database, and documents

**Client Layer:**
- Same as previous designs (campus network users with browsers)

**Network:**
- Single gigabit Ethernet connection to campus network
- Standard firewall protection
- No additional storage network required

### 2.4.3 Schematic Design

```
┌─────────────────────────────────────────────┐
│           CLIENT LAYER                      │
│  Students, Instructors, Coordinators        │
└──────────────┬──────────────────────────────┘
               │
         ┌─────▼──────┐
         │  Campus    │
         │  Network   │
         └─────┬──────┘
               │
    ┌──────────▼──────────────────┐
    │   UNIFIED SERVER            │
    │                             │
    │  ┌──────────────────────┐   │
    │  │  Node.js Express.js  │   │
    │  │       API            │   │
    │  └──────┬───────────────┘   │
    │         │                   │
    │  ┌──────▼─────────┐         │
    │  │  PostgreSQL    │         │
    │  │  Database      │         │
    │  │  (Metadata)    │         │
    │  └────────────────┘         │
    │                             │
    │  ┌─────────────────────┐    │
    │  │  Local File System  │    │
    │  │  /var/intrak/       │    │
    │  │   └── uploads/      │    │
    │  │       └── docs/     │    │
    │  │  (Document Storage) │    │
    │  └─────────────────────┘    │
    │                             │
    │  RAID 1 - 2TB Storage       │
    └─────────────────────────────┘
```

### 2.4.4 Illustrative Design

**Document Upload Flow:**
1. Student uploads file through web interface
2. API validates file
3. Application generates unique filename
4. Application writes file to `/var/intrak/uploads/documents/{studentId}/{filename}`
5. Application creates database record with relative file path
6. Client receives confirmation

**Document Retrieval Flow:**
1. User requests document
2. API validates authorization and retrieves file path from database
3. Application reads file from local filesystem
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
- Performance: Heavy file operations impact application response times

**Comparison to NAS Design:**
- Lower initial cost but reduced fault tolerance
- Simpler architecture but limited scalability
- Faster local access but higher server resource utilization
- Easier initial setup but more complex long-term management

## 2.5 Software Design

### 2.5.1 Design Description

The software architecture of INTRAK implements a modern three-tier web application pattern with clear separation of concerns between presentation, business logic, and data persistence layers. The front-end user interface utilizes React, a component-based JavaScript library that enables dynamic, responsive interfaces adaptive to various device form factors. The back-end API layer employs Node.js with the Express.js framework to implement RESTful endpoints that process client requests, enforce business rules, and orchestrate data operations. The persistence layer leverages PostgreSQL, a mature open-source relational database management system, to maintain structured data with strong consistency guarantees.

The application adopts a role-based architecture with four distinct user personas—Students, Instructors, Coordinators, and Supervisors—each accessing role-specific interfaces and functions determined by their authentication credentials. The authorization system ensures users can only perform operations and access data appropriate to their role, implementing the principle of least privilege for security.

Document workflow logic represents a critical software component, implementing state machines for document lifecycle management. Documents progress through defined states (Pending → Under Review → Approved/Rejected → Resubmission Requested → Approved) with transitions controlled by business rules that enforce proper sequencing and authorization. Notification triggers fire automatically when document states change, alerting relevant stakeholders of actions requiring their attention.

The attendance logging subsystem captures timestamp-based records when students log in to the system during their internship periods. The system compares login timestamps against student-specific internship schedules to compute accumulated internship hours. Coordinators review attendance records and can flag discrepancies for investigation.

The evaluation module provides structured forms for instructors and supervisors to assess student performance across multiple criteria. Rating scales, comment fields, and competency checklists enable comprehensive performance documentation. The system aggregates evaluation data to generate student performance summaries and trend analyses.

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

**Infrastructure:**
- Ubuntu Server 20.04 LTS: Operating system
- Nginx: Reverse proxy and static file serving
- PM2: Node.js process manager
- Git: Version control

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
