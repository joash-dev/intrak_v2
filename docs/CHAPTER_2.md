# CHAPTER 2: PROJECT DESIGN

## 2.1 Discussion of Alternative Designs

The design phase of INTRAK development explored three distinct architectural approaches, each offering different solutions to the document storage and network infrastructure requirements identified in Chapter 1. The comparison focused specifically on storage architecture alternatives, as this represents the critical design decision that distinguishes INTRAK's implementation from generic web application solutions.

Three primary design alternatives emerged from the ideation process: Network-Attached Storage (NAS) based architecture, Cloud-based storage architecture, and Local Server storage architecture. Each design variant shares common components—a PostgreSQL relational database for structured data management, a Node.js/Express.js backend API, and a React-based front-end interface—but differs fundamentally in how and where internship documents (PDFs, images, Word files) are stored and accessed.

The evaluation criteria for these alternative designs encompassed multiple dimensions aligned with project constraints and objectives. Economic considerations examined both initial capital expenditure and ongoing operational costs. Security analysis assessed data sovereignty, access control mechanisms, and compliance with institutional data governance policies. Performance evaluation focused on file upload/download speeds, concurrent user support, and scalability under growing data volumes. Risk assessment considered potential failure modes, recovery complexities, and dependencies on external services.

Each design alternative presented distinct trade-offs that required careful analysis to determine the optimal solution for PSU–Urdaneta City Campus's specific context. The following sections detail each design's architecture, advantages, limitations, and alignment with project constraints.

## 2.2 Design 1: Hybrid Cloud with NAS Architecture

Design 1 implements a Hybrid Cloud with NAS Architecture that strategically combines cloud-based application hosting with locally hosted document storage. This approach uses the scalability and reliability offered by modern Platform-as-a-Service (PaaS) providers for running the application and managing the database. At the same time, it keeps sensitive documents under the institution's control by storing them on a cost-efficient Network-Attached Storage (NAS) system.

In this system structure, The client tier (web browsers) connects to the application's frontend, backend API, and database all hosted on Hostinger VPS. Consequently, as the student uploads a necessary document, the Hostinger VPS-hosted API receives the file stream and securely transmits it to the locally deployed Raspberry Pi 4 NAS located within the campus network via Tailscale VPN tunnel. Metadata is stored in a PostgreSQL database on the same Hostinger VPS. This setup allows the application to remain accessible and scalable, while keeping the large binary files stored in a cost-efficient system that remains under local control.

### 2.2.2 Hardware/Network Design

**Client Layer:**
- Student workstations, faculty computers, and mobile devices
- The researchers used these functions  as the primary access points for all users of the INTRAK system. Students and faculty access the platform through desktop computers, laptops, tablets, or smartphones to accomplish academic and administrative tasks. The researchers designed the system to accommodate a wide range of user devices to ensure accessibility, convenience, and consistent system interaction regardless of hardware differences.

- Web browsers (Chrome, Firefox, Edge, Safari)
- Web browsers will serve as the interface through which users interact with the INTRAK system. Browsers such as Chrome, Firefox, Edge, and Safari interpret the system's web content, process user inputs, and ensure stable rendering of system features. The proponents selected a browser-based interface to promote ease of use, platform independence, and compatibility across various operating systems.

- Connect via Internet (HTTPS) to the Cloud Application
- Communication between user devices and the INTRAK system occurs through the internet using the HTTPS protocol. This secure communication channel encrypts data exchanges, protecting sensitive information from unauthorized access. The development team implemented HTTPS to uphold data confidentiality, maintain integrity during transmission, and comply with established security and privacy requirements.

**Application Layer (Cloud-Hosted):**
- **Platform: Hostinger VPS (Virtual Private Server)**
- The researchers implemented the INTRAK system on Hostinger VPS, which hosts the frontend, backend API, and database on a single virtual private server. The frontend provides the React-based interface that delivers the system's pages, forms, and visual components to users. The backend Node.js application processes the system's logic, manages user requests, handles authentication, data operations, and communication with the database. The PostgreSQL database stores all system data, including records, submissions, and activity logs. The project team selected Hostinger VPS to ensure fast loading times, stable performance, dependable access to the system interface, and centralized management of all application components. This setup provides structured data handling, automated maintenance capabilities, and reliable backup management while enhancing data security, maintaining consistency, and simplifying long-term data administration.

- **Architecture: Microservices / Decoupled Frontend–Backend**
- The project team adopted a decoupled architecture where the frontend and backend operate as separate but interconnected components. This approach allows each part to function independently while exchanging information through secure API calls. The chosen architecture improves system flexibility, supports easier updates, and allows future enhancements without disrupting existing functions.

**Network-Attached Storage Layer (On-Premise):**
- **Device: Raspberry Pi 4 Model B 4GB** 
- The project team used a Raspberry Pi 4 Model B as the main hardware component for the system. Its available RAM options support stable performance and smooth execution of required tasks. The device provides sufficient processing capability for continuous system operation. This makes it suitable for lightweight server functions within the INTRAK system.

- **Storage: External USB 3.0 Hard Drives (RAID 1 via software)**
- The system stores its data using external USB 3.0 hard drives configured in a software-based RAID 1 setup. This arrangement creates a mirrored copy of all stored files, ensuring data protection if one drive fails. The use of RAID 1 strengthens system reliability by preserving data integrity. It also supports consistent access to stored information during regular operations.

- **Operating System: Raspberry Pi OS:OpenMediaVault (Debian-based)**
- The Raspberry Pi runs Raspberry Pi OS with OpenMediaVault installed to manage storage and network functions. This combination provides a stable operating environment suited for handling system services. OpenMediaVault offers organized control of shared files, device settings, and storage operations. Together, they support efficient and reliable backend processes for the INTRAK system.

- **Connectivity**
- The device connects to the campus network through a Gigabit Ethernet link to ensure fast and stable communication. It is securely accessible outside the network using DDNS or a static IP address. Port forwarding is configured on ports 5001 and 443 to allow controlled API communication with external services. This setup maintains secure and consistent connectivity for backend operations.

**Network Infrastructure:**
- **Cloud: Hostinger VPS Infrastructure** The system uses Hostinger VPS to host the frontend application, backend API services, and PostgreSQL database on a single virtual private server. This cloud platform provides stable performance, automatic scaling capabilities, and secure access for users. By hosting all system components on Hostinger VPS, the project team ensures that the application remains available even during high user activity. This setup also reduces hardware maintenance and improves long-term reliability through centralized management and monitoring.

- **Campus Infrastructure**
- The campus network uses a fiber-based internet gateway, an institutional firewall, and a structured LAN to support the system's operations. The fiber connection provides fast and stable access to the Hostinger VPS services, while the firewall manages security through NAT and port forwarding. The Raspberry Pi NAS is connected to the campus LAN and communicates with the Hostinger VPS through a Tailscale VPN tunnel, allowing it to communicate safely and efficiently with both internal users and the cloud-hosted application. Together, these components ensure secure, reliable, and continuous system connectivity.

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

**React Vite**
The project team used React 18.x to build the system's user interface through reusable components. This approach allows the team to organize the interface into smaller parts that are easier to update and maintain. React also improves performance by efficiently handling changes on the screen. It was chosen to ensure a clean, responsive, and consistent user experience.

**React Router (Client-side routing)**
React Router is used to manage navigation within the system without reloading the entire page. It allows users to move between different sections smoothly, such as dashboards, forms, and records. The project team selected React Router because it supports a clear navigation structure. This helps maintain a seamless and faster interaction for users.

**Axios (HTTP client for API communication)**
The project team used Axios to send and receive data between the frontend and the backend API. It handles requests such as logging in, retrieving records, and submitting forms. Axios was chosen because it is reliable, easy to configure, and works well with React applications. It ensures secure and consistent communication with the system's backend.

**Tailwind CSS (Utility-first CSS framework)**
Tailwind CSS was used to style the system interface using small utility classes. This allows the team to design layouts and visuals quickly without writing long CSS files. The project team selected Tailwind to maintain a clean and uniform design across all pages. It also speeds up development and keeps the interface easy to adjust when needed.

**Chart.js (Data visualization for dashboards)**
Chart.js is used to display graphs and charts within the system dashboard. It helps transform numerical data into clear visual summaries that are easier for users to interpret. The project team chose Chart.js because it is lightweight and provides ready-made charts suitable for reports. This supports better presentation and understanding of system data.

**React Hook Form (Form validation and management)**
React Hook Form is used to manage user inputs in forms, such as login details and submission fields. It helps check if the information entered by users is complete and valid before being processed. The project team selected this tool because it reduces errors and keeps forms responsive and efficient. It improves data accuracy and simplifies handling of form-related tasks.

**Back-End Layer:**

**Node.js 22.13  LTS  for JavaScript runtime environment**
The project team used Node.js 18.x LTS to run the backend services of the system. It executes JavaScript on the server side and handles requests from the frontend. Node.js was chosen for its stability, long-term support, and ability to manage multiple tasks efficiently. This ensures smooth and reliable backend operations.

**Express.js 4.x  for Web application framework**
Express.js is used to structure the backend routes and manage how the system responds to API requests. It simplifies the creation of endpoints for authentication, data retrieval, and file processing. The project team selected Express.js because it is lightweight, flexible, and easy to organize. This helps maintain clear and manageable backend logic.

**Prisma for Type-safe ORM for database operations**
The project team used Prisma to handle database operations such as creating, updating, and retrieving records. It provides a structured and type-safe way to interact with the PostgreSQL database. Prisma was chosen because it reduces errors and improves the accuracy of database queries. It also simplifies maintenance and speeds up development.

**JSON Web Tokens for JWT Stateless authentication**
JWT is used to manage user authentication without storing session data on the server. It generates secure tokens that verify user identity during each request. The project team selected JWT to maintain a simple, scalable, and secure login system. This approach helps protect user data while keeping authentication fast.

**Multer for Middleware for file upload handling**
Multer is used to process file uploads such as documents and attachments submitted through the system. It handles how files are received and stored by the backend. The project team chose Multer because it integrates well with Express and supports controlled file handling. This ensures safe and organized processing of uploaded files.

**Bcrypt for Password hashing**
bcrypt is used to convert passwords into secure hashed values before storing them in the database. This prevents actual passwords from being exposed even if the data is accessed illegally. The project team selected bcrypt for its strong security and reliability. It helps protect user accounts from unauthorized access.

**Socket.io for Real-time communication**
Socket.io enables real-time features such as instant updates and live notifications within the system. It allows the server and client to exchange information immediately without refreshing the page. The project team used Socket.io to improve user interaction and support time-sensitive processes. This contributes to a more responsive system experience.

**docxtemplater  for Document template processing**
docxtemplater is used to generate formatted Word documents based on templates, such as weekly reports or issuance forms. It fills predefined fields using system data to produce ready-to-download files. The project team selected this tool because it simplifies document automation and ensures consistent formatting. This reduces manual work and supports efficient reporting.

**Exceljs for Excel file generation**
exceljs is used to create Excel files containing summaries, logs, or reports generated by the system. It allows structured data to be exported in a format familiar to users. The project team chose exceljs because it offers reliable Excel handling and supports various formatting needs. This makes report generation more efficient and accessible.

**Qrcode for QR code generation**
The qrcode library is used to generate QR codes for functions such as attendance tracking and quick verification. It converts system data into scannable codes that can be read by mobile devices. The project team selected this tool to support fast and convenient identity or event checking. It improves workflow efficiency and reduces manual encoding.

**Data Layer**

**PostgreSQL 14.alpine  for Relational database system**
The project team used PostgreSQL 14.x to store all structured system data such as records, logs, and user information. It provides strong support for relational data and ensures data accuracy through strict validation rules. PostgreSQL was chosen because it is stable, reliable, and capable of handling large datasets without performance issues. Its security features also support the safe management of sensitive information.

**Prisma Schema for Database modeling and migrations**
The project team used Prisma Schema to define how tables, relationships, and fields are organized within the database. It also manages database migrations, ensuring that any updates to the structure are applied consistently. Prisma Schema was selected because it provides clear modeling and reduces errors during development. This helps maintain a well-organized and scalable data structure.

**Infrastructure Layer (Cloud-Native)**

**Platform: Hostinger VPS (Virtual Private Server)**
The project team deployed the entire INTRAK system on Hostinger VPS, which hosts the frontend React application, backend Node.js services, and PostgreSQL database on a single virtual private server. Hostinger VPS provides fast delivery of pages, stable uptime for user access, and a controlled environment for running all system components. It was chosen because it simplifies deployment, centralizes management, and ensures a smooth and consistent user experience. The platform offers automatic scaling capabilities, handles backups, security updates, and performance optimization, making it dependable, easy to configure, and suitable for continuous operations. This centralized approach reduces maintenance work and ensures that all system components remain stable and secure.

**NAS OS: Raspberry Pi OS: OpenMediaVault (Debian-based)**
The Raspberry Pi NAS operates on Raspberry Pi OS, a Debian-based system optimized for the device's hardware. It provides a reliable environment for running storage services and backend functions. The project team selected this OS because it is lightweight, stable, and well-supported for long-term operation.

**Version Control: Git (GitHub)**
The project team used Git to track code changes and manage collaboration throughout the development process. GitHub serves as the remote repository where all updates, branches, and revisions are stored. This setup was chosen to maintain organized version control and support efficient teamwork.

### 2.5.3 Database Schema Design 

The database schema uses a normalized relational design following third normal form (3NF) to reduce duplicate data and keep queries efficient. The researchers used an Entity-Relationship (ER) Model to show how different data items are connected before building the database. This model helped identify the tables, their fields, and relationships clearly, making it easier to organize the database. Using the ER Model ensured the data structure was logical, consistent, and met the system's requirements.

**Key entities used includes:**

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

**Authentication**
• Passwords hashed using bcrypt (cost factor 10)
All user passwords are transformed into secure hash values using the bcrypt algorithm. The cost factor of 10 means the system performs multiple rounds of processing so that passwords are difficult to crack even if someone gains access to the stored hashes.

• JSON Web Tokens (JWT) for stateless session management
The system issues a token to a user after successful login. This token, called a JWT, allows the server to verfy the user's identity without storing session data on the server itself. As a result, authentication becomes faster and easier to scale.

• Refresh token rotation to limit exposure window
A refresh token is used to obtain a new access token when the old one expires. The system generates a new refresh token each time it is used, invalidating the previous one. This reduces the risk of unauthorized access if a token is stolen.

• Account lockout after failed login attempts
To prevent brute-force attacks, the system temporarily locks an account after several incorrect login attempts. This protects users by stopping automated guessing of passwords.

**Authorization**
• Role-based access control (RBAC) enforced at the API layer
 The system assigns each user a specific role, and these roles determine what actions they are allowed to perform. The API checks the user's role before granting access to any protected function or resource.
• Function-level permissions checked before operation execution
 Before a user performs any action—such as creating, updating, or deleting data—the system verifies whether the user has permission to carry out that specific function. This prevents unauthorized operations.
• Data-level authorization ensures users access only permitted records
 The system also validates whether a user is allowed to view or modify individual data records. This ensures that users see only the information relevant to them and cannot access data belonging to others.

**Input Validation**
• Server-side validation of all client inputs
 All data sent by the client is checked on the server to ensure it is complete, correctly formatted, and safe to process. This prevents invalid or harmful data from entering the system.
• File type restrictions (whitelist approach) for uploads
 Only specific file types approved by the system are allowed to be uploaded. This whitelist method reduces the risk of malicious files being accepted.
• File size limits enforced to prevent storage or bandwidth abuse
 The system sets a maximum file size for uploads to avoid excessive use of server storage and network resources. This helps maintain system performance and stability.
• SQL injection prevention through parameterized queries (ORM)
 Database operations use parameterized queries provided by the ORM framework. This ensures user input cannot alter the structure of SQL commands, protecting the system from SQL injection attacks.
• XSS prevention through output encoding
 Before displaying user-generated content, the system encodes it to ensure that any embedded scripts cannot run in a user's browser. This prevents cross-site scripting (XSS) attacks.

**Data Protection**
• HTTPS/TLS encryption for all client–server communication
 All communication between the client and the server is encrypted using HTTPS/TLS. This prevents attackers from reading or altering data while it is being transmitted over the network.
• Database connection encryption
 Connections between the application and the database are also encrypted. This ensures that data moving between these components remains protected from interception or tampering.
• Sensitive data logging restrictions
 The system avoids recording sensitive information—such as passwords, tokens, or personal identifiers—in logs. This reduces the risk of exposing confidential data through log files.

**Audit Logging**
• All state-changing operations logged with user ID, timestamp, and action
 The system records every action that alters data or system state. Each log entry includes the user who performed the action, the exact time it occurred, and a description of what was changed. This provides a reliable record of system activity.
• Log retention for compliance and security investigation
 Logs are stored for a defined period to meet organizational policies and legal requirements. Keeping these records supports security reviews, incident analysis, and compliance audits.

### 2.5.6 User Interface Design

The interface uses responsive design principles to ensure that the system displays and functions properly on desktop, tablet, and mobile browsers. Key Features include:

**Student Dashboard:**
• Progress indicators showing completion status
The system provides clear visual indicators that reflect the user's overall progress in the practicum process. These indicators show which requirements have been completed, which tasks are currently in progress, and which steps still need to be accomplished. This helps students stay organized and ensures they are aware of their standing at all times.
• Attendance log with accumulated hours display
A built-in attendance module allows users to view their daily attendance records and see the total number of hours they have completed. The accumulated hours are automatically calculated by the system, helping students monitor their compliance with the practicum hour requirements and enabling coordinators to validate attendance easily.
• Evaluation summary view
The system compiles all evaluation results into a single, easy-to-read summary. This view allows students to understand their performance in various criteria, while coordinators can quickly review assessment outcomes. The summary provides transparency and supports continuous improvement throughout the practicum.
• Document management (upload, view, track status)
Users can upload all required documents directly through the platform. Once submitted, the system allows them to view uploaded files and check their current status—whether they are under review, approved, or require resubmission. This centralized document handling reduces manual errors and ensures smoother communication between students and coordinators.
• Document templates download
Standard templates for required documents, such as forms and reports, are readily available within the system. Students can download these templates to ensure their submissions follow the correct structure, formatting rules, and content requirements. This feature promotes uniformity and reduces confusion.
• Company selection and applications
Students can browse a list of accredited and available companies directly within the platform. Each company includes important details, such as location, contact information, and available slots. Students may then submit their application through the system, making the entire placement process more convenient and transparent.
• Find Company / Partnership Assistance
For students who have difficulty securing a host company, the system provides assistance by suggesting potential organizations or showing available partner companies. This feature helps ensure that no student is left without placement opportunities and streamlines the coordination between the institution and external partners.
• Weekly Reports (Form FM-AA-INT-16)
The system includes a dedicated module for preparing and submitting weekly practicum reports using the official Form FM-AA-INT-16. Students can input their weekly activities, accomplishments, and reflections directly into the system, allowing coordinators to review submissions efficiently and maintain proper documentation throughout the practicum period.

**Instructor Dashboard:**
• Assigned student list with status indicators
The system provides coordinators with a complete list of students under their supervision. Each student entry includes clear status indicators showing their current progress, such as Not Started, Ongoing, For Review, or Completed. This allows coordinators to quickly identify which students need assistance or follow-up.

• Document review queue with filtering
Coordinators can access a centralized queue where all submitted documents appear in an organized list. The queue supports filtering by document type, submission date, student name, or status. This makes it easier to process large volumes of submissions and ensures timely feedback for students.
• Bulk student enrollment (bulk create and bulk assign)
The system allows administrators to upload or enter multiple student records at once, making enrollment faster and more efficient. Students can also be assigned to coordinators in bulk, reducing repetitive manual work and simplifying administrative setup at the beginning of each term.
• Document checklist tracking
Each student is provided with a checklist of required practicum documents. Administrators and coordinators can track which documents have been submitted, which are pending, and which require revision. This ensures that all requirements are monitored consistently and reduces the risk of missing or incomplete paperwork.
• Student monitoring interface
A dedicated dashboard allows coordinators to monitor student activities and progress. This includes attendance, submitted reports, evaluation results, and company assignment details. The interface provides a centralized view that supports efficient oversight and timely intervention when needed.
• Company applications management
Administrators and coordinators can review, approve, or decline student applications to partner companies. The system displays each application's details, allowing reviewers to check student information, company requirements, and submitted documents before deciding. This ensures proper matching between students and host organizations.

• Document template management
Administrators can upload, update, or replace official document templates used by students and coordinators. This feature ensures that all users have access to the latest and correct versions of forms, evaluation sheets, and reports, promoting consistency across all submissions.
• Student evaluations
The system supports digital encoding and viewing of student evaluation results. Coordinators and company supervisors can input performance ratings and comments directly into the platform. Once completed, the evaluations are compiled into an accessible summary for easy review and academic processing.
• Settings and profile management
Users can update their personal information, such as name, email, and profile photo, through the settings page. Administrators can also configure system-wide settings, including academic year information, document requirements, and company lists. This ensures that the system remains up-to-date and aligned with institutional policies.

**Coordinator Dashboard:**
• System-wide statistics and metrics
 The system provides an overview of key data across the entire platform, such as the total number of enrolled students, active company partners, submitted documents, completed evaluations, and ongoing applications. These metrics help administrators monitor overall system activity and identify areas that may require attention or improvement.
• Student management interface (CRUD operations)
 Administrators can manage student records through a dedicated interface that supports creating new accounts, viewing existing profiles, updating information, and removing inactive or incorrect entries. This ensures that student data remains accurate and easy to maintain throughout the practicum cycle.
• Company management
 The system includes tools for managing company partners, allowing administrators to add new organizations, update company details, and deactivate companies that are no longer accepting interns. This helps maintain an up-to-date list of placement options and supports efficient coordination with external partners.
• Report generation interface
 Administrators can generate various reports, such as attendance summaries, student progress reports, company placement statistics, and document compliance lists. The interface provides options to filter data and export reports for academic review, documentation, or administrative use.
• Announcements management
 Important updates, deadlines, and reminders can be posted through the system's announcement module. Administrators can create, edit, schedule, or remove announcements, ensuring that students and coordinators receive timely and accurate information.
• Document review (all students)
 Unlike the coordinator's view, which only shows assigned students, administrators have access to a platform-wide document review interface. This allows them to view, filter, and evaluate document submissions from all students, ensuring oversight, consistency, and quality control across all practicum sections.
• Settings and system configuration
 Administrators can modify system-wide settings such as academic term details, document requirements, form templates, allowed file types, and user roles. This ensures the platform remains aligned with institutional policies and can adapt to changing academic or administrative needs.

**Supervisor Dashboard:**
• Overview of assigned interns
 Supervisors have access to a dashboard showing all interns assigned to their company or department. This includes basic information such as names, contact details, and current practicum status. The overview helps supervisors keep track of their interns and understand their progress at a glance.
• Attendance verification
 Supervisors can review and confirm the attendance logs submitted by interns. This ensures that recorded hours are valid and match the actual time spent at the company. Verified attendance supports accurate tracking of practicum requirements.
• Student evaluations
 Supervisors are able to complete evaluation forms directly through the system. They can rate the intern's performance, work ethic, skills, and overall conduct. These evaluations become part of the student's official practicum record and help coordinators assess final grades.
• Progress tracking
 The system allows supervisors to monitor the overall development of each intern. Progress indicators show completed tasks, submitted reports, and remaining requirements. This helps supervisors understand how well interns are meeting expectations during their stay.
• Notifications
 Supervisors receive system notifications related to attendance submissions, evaluation deadlines, document reviews, and student updates. This ensures that important actions are completed on time and that communication between interns and supervisors remains efficient.
• Settings
 Supervisors can update basic profile details such as email, password, and contact information. They may also adjust interface preferences or company-related settings depending on their level of access.

**Common Components:**
• Navigation sidebar with role-specific menu items
The system includes a navigation sidebar that displays menu options based on the user's assigned role. Students, coordinators, and administrators see only the features relevant to their responsibilities, reducing clutter and improving ease of use. This role-based menu design helps users quickly find the tools and sections they need.
• Notification page
A dedicated notification page allows users to view important updates, such as document feedback, application decisions, reminders, and new announcements. Notifications are organized chronologically to help users stay informed about recent actions and pending tasks.
• Profile menu with settings access
Users can access their personal profile through a dropdown menu located in the interface header. From this menu, they can update personal information, change their password, upload a profile photo, or adjust basic account settings. This feature gives users control over their account details in a simple and secure manner.
• Search and filter controls for list views
List pages—such as student lists, documents, companies, and applications—include search and filtering options to help users find specific records quickly. Filters may include categories like status, name, date submitted, or company type. This improves navigation efficiency and supports faster data management, especially when handling large datasets.

### 2.5.7 Design Standards
• RESTful API design principles for stateless communication
 The system uses RESTful API standards to ensure clear and consistent communication between the client and server. Each request from the client is treated independently, with no session data stored on the server. This stateless approach improves scalability, simplifies debugging, and allows the system to handle higher volumes of requests efficiently.

• Component-based architecture for UI reusabilityThe interface is built using reusable components, such as buttons, forms, tables, and cards. These components are used across different parts of the system, ensuring visual consistency and reducing development time. When a component is updated, the changes automatically apply wherever it is used, making maintenance easier.
• MVC pattern separation (Model–View–Controller)
 The system follows the Model–View–Controller pattern to organize its structure.
The Model handles data and business logic.


The View manages the user interface.


The Controller processes user input and connects the model and view.
 This separation makes the code more organized, easier to update, and simpler to test.


• SOLID principles for object-oriented design
 The design follows SOLID guidelines to ensure clean and maintainable code. These principles promote single responsibilities for classes, clear interfaces, flexible extensions, and minimal coupling between components. As a result, the system becomes more stable, predictable, and easier to improve over time.


• Security by design: authentication/authorization at every layer Security measures are integrated throughout the entire system, not added afterward. All layers—API, database, services, and user interface—include built-in checks that verify identity, validate permissions, and protect data. This reduces vulnerabilities and ensures that only authorized users can access sensitive functions.


• Responsive design for multi-device support
 The interface is designed to adapt to different screen sizes and devices, such as desktops, tablets, and mobile phones. Layouts and components automatically adjust to ensure readability, usability, and consistency regardless of the device being used.

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
