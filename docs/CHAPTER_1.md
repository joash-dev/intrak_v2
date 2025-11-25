# CHAPTER 1: THE PROJECT AND ITS BACKGROUND

## 1.1 The Problem

The Bachelor of Science in Computer Engineering program at Pangasinan State University – Urdaneta City Campus requires students to complete On-the-Job Training (OJT) as a critical component of their curriculum. This practicum period bridges the gap between theoretical classroom instruction and practical industry application, enabling students to develop professional competencies and apply technical knowledge in real-world scenarios. However, significant challenges persist in managing and monitoring student internships effectively.

Traditional OJT management at PSU–Urdaneta City Campus relies heavily on manual, paper-based processes. Coordinators and instructors utilize physical logbooks, printed timesheets, and fragmented communication channels such as email and messaging applications to track student progress. These conventional methods introduce critical inefficiencies that hinder the effectiveness of the internship program.

The reliance on physical documentation creates substantial risks of data redundancy and loss. Essential records including Daily Time Records (DTR), evaluation forms, and internship agreements can be easily misplaced, damaged, or destroyed, resulting in permanent loss of critical academic documentation. This vulnerability compromises the integrity of student records and creates administrative burdens when reconstructing lost data.

Delayed feedback mechanisms further compound these challenges. The manual submission and review of reports and evaluations introduce significant time lags between student performance and instructor response. This delay prevents timely intervention for students who may be struggling with their internship responsibilities, potentially impacting their learning outcomes and professional development.

Attendance verification presents another significant obstacle in the current system. Without real-time tracking mechanisms, coordinators and instructors face difficulties in confirming the actual presence of students at their deployment sites. This limitation creates potential discrepancies between reported hours and actual time spent on internship activities, undermining the accuracy of completion records.

The administrative burden on faculty members represents a substantial inefficiency in the current system. Coordinators and instructors allocate disproportionate time to manually aggregating data for compliance reports, time that could be better invested in mentorship and student guidance. This administrative overhead reduces the quality of supervision and support available to students during their internship period.

Document security and accessibility present additional concerns in the paper-based system. Physical storage of confidential student documents raises questions about data privacy, authorized access, and long-term preservation. The lack of centralized, secure storage makes it difficult to maintain proper document retention policies and ensure compliance with data protection requirements.

These challenges collectively highlight the urgent need for a modernized, digital solution to OJT management at PSU–Urdaneta City Campus. The inefficiencies inherent in manual processes negatively impact all stakeholders: students receive delayed feedback, instructors spend excessive time on administrative tasks, and coordinators struggle to maintain accurate, comprehensive records of the internship program.

## 1.2 The Client

The primary client for this project is the Computer Engineering Department of Pangasinan State University – Urdaneta City Campus. The department serves as the administrative unit responsible for the academic and professional development of Computer Engineering students, including the management and oversight of their On-the-Job Training programs.

The Computer Engineering Department functions as a key stakeholder in this project, with specific needs and requirements for internship management. The department currently oversees multiple cohorts of students simultaneously engaged in internships across various industry partners. This scale of operation demands efficient tracking systems, comprehensive reporting capabilities, and streamlined communication channels between all parties involved in the internship program.

Within the department structure, several user roles interact with the internship management process, each with distinct responsibilities and system requirements. The OJT Coordinator serves as the primary administrator, responsible for overall program oversight, student assignment to companies, document validation, and compliance reporting. The coordinator requires comprehensive access to all system functions to fulfill these duties effectively.

Faculty members serving as Instructors constitute another critical user group within the departmental structure. Instructors are assigned specific cohorts of students and bear responsibility for monitoring their progress, reviewing submitted documents, providing feedback on performance, and conducting evaluations. The system must facilitate these instructional duties while maintaining appropriate access controls and data privacy.

Students represent the direct beneficiaries of the system, interfacing with the platform to submit required documentation, log attendance, track their progress toward completion requirements, and receive feedback from supervisors and instructors. The student user experience directly impacts engagement with the internship program and compliance with submission requirements.

Industry partners, specifically on-site supervisors at companies hosting interns, constitute an external client group with limited but important system interactions. These supervisors require the capability to verify student attendance, submit performance evaluations, and provide feedback on intern contributions. Their participation in the system ensures accurate assessment of student performance in actual workplace environments.

The department's operational context within PSU–Urdaneta City Campus imposes specific technical and policy constraints on system implementation. The campus network infrastructure provides the foundation for system deployment, with particular emphasis on local network access and institutional data security requirements. University policies regarding document retention, data privacy, and academic record-keeping inform system design decisions and functional specifications.

The client's ultimate objective centers on enhancing the quality, efficiency, and transparency of the OJT program for Computer Engineering students. By implementing a centralized digital platform, the department aims to reduce administrative overhead, improve feedback timeliness, ensure accurate record-keeping, and ultimately provide a superior internship experience that effectively prepares students for professional engineering careers.

## 1.3 The Project/Solution

INTRAK (Internship Tracking System) represents a comprehensive web-based solution designed specifically to address the internship management challenges faced by the Computer Engineering Department at PSU–Urdaneta City Campus. The system provides a centralized digital platform that streamlines all aspects of the internship lifecycle, from initial student deployment through final evaluation and completion certification.

The core architecture of INTRAK integrates a modern web application with Network-Attached Storage (NAS) infrastructure to deliver secure, efficient document management capabilities. This hybrid approach combines the accessibility benefits of web-based interfaces with the data sovereignty and security advantages of local institutional storage. The system operates within the campus network environment, ensuring compliance with university data governance policies while providing reliable service to authorized users.

INTRAK replaces fragmented, paper-based processes with an integrated digital workflow that encompasses document submission, review, approval, and archival. Students upload required internship documents directly through the web interface, where they are automatically routed to appropriate reviewers based on document type and student assignment. This automated workflow eliminates manual document routing and reduces processing delays inherent in physical document handling.

The system implements role-based access control to ensure appropriate data privacy and functional access for each user category. Coordinators receive comprehensive administrative capabilities including student management, company assignment, bulk document review, and system-wide reporting. Instructors access functions relevant to their assigned student cohorts, including document review, attendance verification, and evaluation submission. Students interact with self-service functions for document uploads, attendance logging, and progress tracking. Industry supervisors access limited functions focused on attendance verification and evaluation submission for their assigned interns.

A distinguishing feature of INTRAK lies in its integration with Network-Attached Storage for document repository management. Rather than storing files directly within the application database or utilizing third-party cloud services, the system leverages institutional NAS infrastructure to maintain all uploaded documents. This approach ensures data residency within university-controlled systems, addresses security concerns associated with external cloud storage, and provides scalable storage capacity without ongoing subscription costs.

The attendance tracking functionality provides multiple verification methods to accommodate diverse internship environments. Students log daily attendance through the web interface, creating timestamp-based records of their internship activities. The system maintains comprehensive attendance logs including time-in, time-out, and total hours accumulated, enabling coordinators and instructors to monitor progress toward required hour completion. Login-based validation serves as the primary attendance tracking mechanism, focusing on timestamp verification rather than real-time geolocation tracking, balancing security requirements with privacy considerations.

Document management capabilities extend beyond simple file storage to include status tracking, review workflows, and feedback mechanisms. Each submitted document progresses through defined approval states (pending, approved, rejected, resubmission requested), providing students with clear visibility into document status and any required remediation. Instructors and coordinators provide structured feedback on document submissions, creating an auditable record of review comments and approval decisions.

The evaluation system facilitates structured performance assessments from both instructors and industry supervisors. Standardized evaluation forms capture quantitative ratings and qualitative feedback across multiple performance dimensions, creating comprehensive performance profiles for each student. The system aggregates evaluation data to support student counseling, program improvement initiatives, and quality assurance activities.

Reporting capabilities provide coordinators with tools to generate compliance documentation, track program metrics, and identify students requiring intervention. The system produces attendance summaries, document submission status reports, evaluation summaries, and completion verification documentation. These reports support various stakeholders including academic administration, accreditation bodies, and industry partners.

The web-based deployment model ensures accessibility from various devices and locations while maintaining security through authentication and authorization controls. The responsive interface adapts to different screen sizes, though mobile application development falls outside the current project scope. Users access the system through standard web browsers, eliminating client-side software installation requirements and simplifying system administration.

INTRAK fundamentally transforms OJT management at PSU–Urdaneta City Campus from a manual, paper-intensive process into a streamlined, digital workflow. By centralizing information, automating routine tasks, and providing real-time visibility into student progress, the system enables the department to deliver a higher quality internship experience while reducing administrative burden on faculty members.

## 1.4 The Project Objectives

### 1.4.1 General Objective

To develop and implement INTRAK, a centralized web-based Internship Tracking and Evaluation System with integrated NAS-based document storage, specifically designed to streamline the management, monitoring, and assessment of On-the-Job Training activities for Computer Engineering students at Pangasinan State University – Urdaneta City Campus.

### 1.4.2 Specific Objectives

1. To establish a centralized platform that consolidates all internship activity tracking and document submission processes for Computer Engineering students, eliminating fragmented record-keeping systems and providing a single source of truth for internship data.

2. To enable students to submit digital copies of all required internship documentation, including Daily Time Records (DTR), performance evaluations, Memorandum of Agreement (MOA), acceptance letters, and other mandated forms, through a user-friendly web interface accessible from standard browsers.

3. To provide coordinators with validation tools and workflows that facilitate document review, feedback provision, approval processing, and compliance report generation, reducing manual administrative overhead while maintaining quality standards.

4. To implement a secure login-based attendance monitoring system that captures date and time logs of student activities, creating an auditable record of internship hours while respecting privacy considerations through timestamp-based verification rather than real-time geolocation tracking.

5. To furnish coordinators and instructors with comprehensive evaluation and performance assessment tools that enable systematic monitoring of intern progress, identification of students requiring intervention, and objective measurement of learning outcomes.

6. To generate automated reports for students, coordinators, instructors, and university administration that support documentation requirements, assessment activities, and program improvement initiatives, reducing time spent on manual report compilation.

7. To integrate Network-Attached Storage (NAS) infrastructure for secure, centralized storage of all internship-related documents, ensuring data residency within institutional control, providing controlled access mechanisms, and supporting long-term document retention requirements without dependency on external cloud services.

## 1.5 Scope and Delimitation

### 1.5.1 Scope

The project focuses on the development of INTRAK: A Centralized Internship Tracking and Evaluation System with NAS-Based Document Storage, specifically designed for Computer Engineering students of Pangasinan State University – Urdaneta City Campus. The system aims to streamline the monitoring, evaluation, and documentation of student internship activities. Specifically, the system will:

1. Serve as a centralized platform for tracking internship activities and document submissions of Computer Engineering students.

2. Allow students to submit digital copies of internship requirements, including Daily Time Records (DTR), performance evaluations, and other related documents.

3. Enable coordinators to validate student submissions, provide feedback, and generate reports.

4. Monitor attendance through secure date and time logs of student logins.

5. Provide coordinators with evaluation and performance assessment tools to monitor intern progress.

6. Generate reports for students, coordinators, and the university to support documentation and assessment requirements.

7. Utilize a Network-Attached Storage (NAS) for secure, centralized storage and controlled access to internship-related documents.

8. Cover exclusively the Computer Engineering Department of PSU–Urdaneta City Campus.

9. Use login-based validation as the primary attendance tracking method; real-time geolocation tracking will not be implemented, focusing instead on timestamp-based verification.

### 1.5.2 Delimitation

The study is limited to the following parameters:

1. The system will not initially support ISO-compliant e-signatures; physical signatures may still be required for official documents.
2. The system employs a Hybrid Cloud Architecture, making the application accessible via the internet for remote users (students, industry partners) while retaining physical document storage on a local NAS within the campus network.


Browser compatibility requirements necessitate responsive design implementation to support various devices (desktop computers, tablets) and multiple browser platforms (Chrome, Firefox, Edge, Safari). While a dedicated mobile application falls outside project scope, the web interface must provide usable experiences on mobile browsers for basic functions.

### 1.6.2 Operational Constraints

University policies regarding document retention, academic record-keeping, and data privacy impose operational constraints on system functionality. Certain official documents may require physical signatures and hard copy retention as backup, requiring the system to accommodate hybrid digital-physical workflows rather than complete digitization.

The project timeline, driven by academic calendar constraints and resource availability, limits the scope of features that can be implemented in the initial system release. Advanced features such as ISO-compliant digital signatures and integration with external company HR systems fall outside the current project timeline.

User training and change management represent operational constraints that influence interface design and feature complexity. The system must provide intuitive interfaces that minimize training requirements for students, instructors, and coordinators, facilitating adoption and reducing resistance to transitioning from familiar paper-based processes.

### 1.6.3 Economic Constraints

Budget limitations constrain technology selections, particularly regarding NAS hardware acquisition, development tools, and ongoing operational costs. The preference for one-time capital expenditure (NAS hardware) over recurring operational expenditure (cloud storage subscriptions) reflects these economic constraints and influences the storage architecture decision.

The utilization of open-source technologies and frameworks (PostgreSQL, React, Node.js) addresses economic constraints by eliminating licensing costs while providing robust, well-supported development platforms. This approach enables professional-quality system development within budgetary limitations.

### 1.6.4 Environmental Constraints

Power consumption considerations influence hardware selection decisions, particularly regarding NAS device specifications. Energy-efficient storage solutions that balance performance requirements with operational power consumption align with institutional sustainability objectives.

The transition from paper-based to digital processes advances environmental sustainability by reducing paper consumption, physical storage requirements, and transportation of documents. This environmental benefit represents a positive externality of the system implementation.

### 1.6.5 Security and Privacy Constraints

Data protection requirements mandated by Philippine laws (Data Privacy Act of 2012) and university policies impose constraints on data storage, access controls, and audit logging. The system must implement appropriate security measures to protect personally identifiable information while maintaining accessibility for authorized users.

The restriction to Computer Engineering Department users represents a security boundary that simplifies access control implementation but limits cross-departmental integration possibilities. This constraint reduces system complexity while ensuring clear data ownership and responsibility structures.

## 1.7 Engineering Standards

The development, implementation, and operation of INTRAK adhere to established engineering standards that ensure quality, security, and maintainability throughout the system lifecycle.

### 1.7.1 Software Quality Standards

**ISO/IEC 25010:2011 - Systems and Software Quality Requirements and Evaluation (SQuaRE)**

This international standard provides the framework for evaluating software quality across multiple dimensions. INTRAK's development process incorporates the following quality characteristics defined in ISO 25010:

*Functional Suitability*: The system provides functions that meet stated and implied needs, specifically addressing OJT management requirements identified by the Computer Engineering Department.

*Performance Efficiency*: Resource utilization optimizations ensure responsive operation under expected user loads, with particular attention to document upload/download performance via NAS integration.

*Usability*: Interface design prioritizes recognizability, learnability, operability, and user error protection, addressing the needs of users with varying technical proficiency levels.

*Reliability*: System architecture incorporates fault tolerance mechanisms, data backup procedures, and recovery capabilities to ensure consistent service availability.

*Security*: Access control, authentication, data encryption, and audit logging implementations protect against unauthorized access and data breaches while ensuring accountability.

*Maintainability*: Modular code organization, comprehensive documentation, and adherence to coding standards facilitate ongoing maintenance and future enhancement activities.

*Portability*: Web-based deployment ensures cross-platform compatibility, while standards-based development practices support potential future platform migrations.

### 1.7.2 Information Security Standards

**ISO/IEC 27001:2013 - Information Security Management**

Given the system's handling of sensitive student data and academic records, INTRAK's security architecture draws upon ISO 27001 principles for information security management:

*Confidentiality*: Role-based access controls and authentication mechanisms ensure that information is accessible only to authorized users.

*Integrity*: Database transaction controls, data validation, and audit logging protect against unauthorized modification or destruction of information.

*Availability*: System architecture and infrastructure design ensure authorized users have reliable access to information systems and data when needed.

### 1.7.3 Database Management Standards

**ACID Properties (Atomicity, Consistency, Isolation, Durability)**

The PostgreSQL database implementation adheres to ACID transaction properties, ensuring data integrity across concurrent operations and system failures. This standard is particularly critical for attendance logging, document status updates, and evaluation submissions where data consistency directly impacts academic records.

### 1.7.4 Web Development Standards

**W3C Web Content Accessibility Guidelines (WCAG) 2.1**

Interface development incorporates accessibility principles to ensure usability for individuals with disabilities, including semantic HTML markup, keyboard navigation support, and appropriate color contrast ratios.

**RESTful API Design Principles**

The system's API architecture follows REST (Representational State Transfer) principles, providing stateless, resource-oriented interfaces that facilitate maintainability and potential future integrations.

### 1.7.5 Data Privacy Standards

**Republic Act No. 10173 - Data Privacy Act of 2012 (Philippines)**

System design incorporates data privacy principles mandated by Philippine law, including consent mechanisms, purpose limitation, data minimization, and subject access rights. Personal data processing activities comply with National Privacy Commission guidelines applicable to educational institutions.

### 1.7.6 Network Storage Standards

**SMB/CIFS Protocol Standards**

NAS integration utilizes industry-standard network file sharing protocols (Server Message Block/Common Internet File System) to ensure interoperability with institutional storage infrastructure and future-proof the storage implementation.

The application of these engineering standards throughout the INTRAK development lifecycle ensures that the system meets professional quality expectations, protects sensitive data, complies with legal requirements, and supports long-term sustainability and enhancement.

## 1.8 Engineering Design Process

The development of INTRAK follows a structured engineering design process that adapts the traditional engineering design cycle to software system development. This iterative approach ensures systematic problem-solving, user-centered design, and continuous improvement throughout the project lifecycle.

### 1.8.1 Ask: Identify the Need and Constraints

The initial phase involved comprehensive stakeholder engagement to identify specific needs and constraints affecting OJT management at PSU–Urdaneta City Campus. Through interviews with coordinators, instructors, and students, the development team documented pain points in the existing manual system, including delayed document processing, attendance verification challenges, and administrative overhead.

Constraint identification activities examined technical, operational, economic, and policy limitations that would shape system design. The requirement for NAS-based storage emerged from institutional data governance policies, while the web-based delivery model addressed accessibility needs within budget constraints.

### 1.8.2 Research the Problem

The research phase involved multi-faceted investigation into existing solutions, technical approaches, and best practices relevant to internship management systems. The team analyzed commercial OJT management platforms to understand common feature sets and architectural patterns, while recognizing that off-the-shelf solutions did not adequately address the specific requirements and constraints of the PSU–Urdaneta City Campus environment.

Technical research focused on evaluating storage architecture alternatives (NAS vs. cloud vs. local server), database technologies suitable for academic record management, and web development frameworks offering appropriate security, performance, and maintainability characteristics. Literature review of software engineering best practices informed architectural decisions and development methodology selection.

Regulatory research examined data privacy requirements under Philippine law, document retention policies applicable to educational institutions, and accessibility standards for public sector web applications. This research ensured that design decisions would produce a legally compliant, policy-aligned system.

### 1.8.3 Imagine: Develop Possible Solutions

The ideation phase generated three alternative architectural approaches for consideration:

*Design 1 (Hybrid Cloud with NAS Architecture)*: Internet-accessible web application hosted on **Northflank** (Managed PaaS) integrated with on-premise Network-Attached Storage (NAS) for secure document retention.

*Design 2 (Cloud-Based Architecture)*: Web application with cloud storage services (e.g., AWS S3, Google Cloud Storage) for document repository, enabling external accessibility.

*Design 3 (Local Server Storage)*: Web application with file storage directly on the application server's local file system, minimizing infrastructure complexity.

Each alternative design was elaborated with architectural diagrams, technology stack specifications, estimated implementation efforts, and preliminary cost analyses. Use case scenarios were developed to evaluate how each design would support critical workflows such as document submission, coordinator review, and report generation.

### 1.8.4 Plan: Select a Promising Solution

The planning phase employed structured trade-off analysis to evaluate the three alternative designs against key criteria including economic cost, data security, system performance, scalability, and alignment with project constraints. This analysis, detailed in Chapter 3, led to the selection of Design 1 (NAS-Based Architecture) as the optimal solution.

The selected design best satisfied the constraint of local data residency while providing superior scalability compared to local server storage and lower ongoing costs compared to cloud storage. Security advantages of institutional NAS control and high-performance local network access further supported this selection.

Detailed implementation planning followed design selection, including database schema design, API endpoint specification, user interface wireframing, and development sprint planning. Risk assessment identified potential challenges such as NAS integration complexity and user adoption resistance, with corresponding mitigation strategies.

### 1.8.5 Create: Build a Prototype

The creation phase involved iterative development of the INTRAK system through multiple sprint cycles. Initial development focused on core infrastructure: database implementation, NAS connectivity, and authentication mechanisms. Subsequent sprints built out key functional modules including student registration, document upload/review workflows, attendance logging, and reporting capabilities.

Prototyping followed an agile methodology with regular demonstrations to stakeholders (coordinators and instructors) to gather feedback and validate that implemented features met operational needs. This iterative approach enabled course corrections during development rather than discovering misalignments late in the project.

Version control (Git), automated testing, and continuous integration practices ensured code quality and facilitated collaborative development. The development environment mirrored the planned production deployment environment to minimize deployment risks.

### 1.8.6 Test and Evaluate Prototype

Testing activities encompassed multiple levels to ensure system quality and reliability. Unit tests validated individual functions and components in isolation, while integration tests verified correct interaction between system modules (e.g., web application and NAS storage). User interface testing assessed usability, browser compatibility, and responsive design effectiveness.

User acceptance testing involved actual end-users (students, instructors, coordinators) performing realistic tasks with the system in a staging environment that replicated production conditions. Feedback from these sessions identified usability improvements, clarified workflow inefficiencies, and validated that the system met operational requirements.

Performance testing under simulated load conditions verified that the system could handle expected concurrent user volumes and document upload activities without degradation. Security testing, including penetration testing and vulnerability scanning, assessed the effectiveness of authentication, authorization, and data protection mechanisms.

### 1.8.7 Improve: Redesign as Needed

The improvement phase encompasses both pre-deployment refinements based on testing feedback and planned post-deployment enhancement cycles. Test results drove specific improvements including interface refinements for mobile browsers, optimization of database queries for report generation, and strengthening of file validation logic for document uploads.

User feedback from acceptance testing led to workflow adjustments, such as simplifying the document approval process and enhancing notification mechanisms to alert students of document status changes. These improvements addressed usability concerns while maintaining functional requirements.

The iterative nature of the engineering design process enables continuous improvement beyond initial deployment. Post-implementation monitoring, user feedback collection, and periodic system reviews will identify opportunities for enhancement, feature additions, and performance optimization in future releases.

This systematic engineering design process ensured that INTRAK development proceeded methodically from problem identification through solution implementation, with continuous validation that the evolving system addressed stakeholder needs and operated within identified constraints.
