# CHAPTER 1: THE PROJECT AND ITS BACKGROUND

## 1.1 The Problem

The Bachelor of Science in Computer Engineering program at Pangasinan State University – Urdaneta City Campus requires students to complete On-the-Job Training (OJT) as a critical component of their curriculum. This practicum period helps students connect what they learn in the classroom with real work in the industry. It lets them practice their skills, gain experience, and use their technical knowledge in real situations.. However, significant challenges persist in managing and monitoring student internships effectively.

Traditional OJT management at PSU–Urdaneta City Campus relies heavily on manual, paper-based processes. Coordinators and instructors utilize physical logbooks, printed timesheets, and confusing communication channels such as email and messaging applications to track student progress. These conventional methods introduce critical inefficiencies that hinder the effectiveness of the internship program.

Relying on physical documentation creates risks of data redundancy and loss. Essential records including Daily Time Records (DTR), evaluation forms, and internship agreements can be easily misplaced, damaged, or destroyed, resulting in permanent loss of critical academic documentation.This weakness endangers the accuracy of student records and adds extra administrative work when lost data must be restored. 

Likewise, delayed feedback mechanisms also become a real problem. The manual submission and review of reports and evaluations introduce significant time lags between student performance and instructor response. This delay prevents instructors from providing timely support to students who are struggling with their internship tasks, which may affect their learning outcomes and professional development.

Moreover, Attendance verification shows another difficulty in the current system. Without real-time tracking mechanisms, coordinators and instructors face difficulties in confirming the actual presence of students at their deployment sites.This problem can cause differences between the hours students report and the time they actually spend on internship tasks, making the records less accurate.

The administrative burden on faculty members represents a major inefficiency in the current system. Coordinators and instructors allocate unequal time to manually gathering data for compliance reports, time that could be better invested in mentorship and student guidance. Excessive administrative tasks reduce the level of supervision and support available to students during their internship.

Document security and accessibility are also concerns in the paper-based system. Storing confidential student documents in physical form raises concerns about data privacy, authorized access, and long-term preservation. Without centralized and secure storage, it is difficult to follow proper document retention policies and meet data protection requirements.

These challenges demonstrate the need for a modernized, digital solution to OJT management at PSU–Urdaneta City Campus.Inefficiencies in manual processes affect all stakeholders: students experience delayed feedback, instructors spend too much time on administrative tasks, and coordinators face difficulties keeping accurate and complete internship records.

## 1.2 The Client
The primary client for this project is the Computer Engineering Department of Pangasinan State University – Urdaneta City Campus. The department manages the academic and professional development of Computer Engineering students, including the supervision of their On-the-Job Training programs. The Computer Engineering Department is a key stakeholder in this project, with specific needs for managing internships. The department supervises multiple student cohorts across various industry partners, requiring efficient tracking systems, detailed reporting, and clear communication between all parties involved.

Within the department, different user roles participate in managing internships, each with specific responsibilities and system needs.  The OJT Coordinator serves as the primary administrator, responsible for overall program oversight, student assignment to companies, document validation, and compliance reporting. The coordinator requires comprehensive access to all system functions to fulfill these duties effectively.
The students will use the modernized system to submit documents, record attendance, track progress, and receive feedback from supervisors. Their experience with the system directly affects their engagement in the internship program and adherence to submission requirements.

Industry partners, specifically assigned supervisors at internship host companies, form an external client group with limited interactions with the system. These supervisors are able to verify student attendance, submit performance evaluations, and provide feedback on intern contributions. Their participation in the system ensures accurate assessment of student performance in actual workplace environments.

The client's ultimate objective centers on enhancing the quality, efficiency, and transparency of the OJT program for Computer Engineering students. By implementing a centralized digital platform, the department aims to reduce administrative overhead, improve feedback timeliness, ensure accurate record-keeping, and ultimately provide a superior internship experience that effectively prepares students for professional engineering careers.

## 1.3 The Project/Solution

The INTRAK system represents a comprehensive web-based solution designed specifically to address the internship management challenges faced by the Computer Engineering Department at PSU–Urdaneta City Campus.The system offers a centralized digital platform that streamlines the entire internship process, from student deployment to final evaluation and certification. It also incorporates a Raspberry Pi used as Network Attached Storage (NAS) for secure data management.

The core architecture of INTRAK integrates a modern web application with Network-Attached Storage (NAS) infrastructure to deliver secure, efficient document management capabilities. This hybrid approach combines the accessibility benefits of web-based interfaces with the data sovereignty and security advantages of local institutional storage.  The system is deployed on cloud infrastructure, ensuring compliance with university data policies and providing secure, role-based access to authorized users including students, instructors, coordinators, industry partners and administrators.

The system completes disjointed paper-based processes with a unified digital workflow for document submission, review, approval, and storage. Students upload required internship documents directly through the web interface, where they are automatically routed to appropriate reviewers based on document type and student assignment. This automated workflow eliminates manual document routing and reduces processing delays inherent in physical document handling.

The researchers  implement role-based access control in the system to ensure appropriate data privacy and functional access for each user category. Coordinators have extensive program-level administrative capabilities, including managing students, assigning students to instructors, managing company partnerships and MOAs, reviewing documents for all students, verifying attendance, and generating comprehensive reports. Instructors can access functions for their assigned student cohorts, such as reviewing documents, verifying attendance, submitting evaluations, managing document templates, and reviewing company applications. Students use self-service functions to upload documents, log attendance, apply to companies, track their progress, and view evaluations. Industry supervisors access limited functions focused on attendance verification, evaluation submission (Supervisor Feedback Form), and document review for their assigned interns.

The INTRAK system is integrated with Network-Attached Storage for document repository management. Files are stored on the filesystem (NAS when available, with automatic fallback to local storage), while only metadata such as filepath, filename, and file size are stored in the application database. Rather than utilizing third-party cloud storage services, the system leverages institutional NAS infrastructure to maintain all uploaded documents by interns. This approach keeps data within university-controlled systems, addresses security risks associated with external cloud storage, and offers scalable storage capacity without recurring subscription costs.

The tracking of attendance has multiple verification features to support different internship settings. Students record their daily attendance through the web interface, creating timestamped records of their internship activities. The system keeps detailed logs of time-in, time-out, and total hours, allowing instructors to track progress toward required hours.

Document management goes beyond basic file storage to include tracking document status, managing review workflows, and providing feedback. Each submitted document progresses through various approval states such as pending, approved, rejected, or resubmission requested. Both instructors and coordinators can provide structured feedback on document submissions, which helps improve the overall quality of internship documentation. Additionally, the system includes a direct messaging feature that enables coordinators, students, and instructors to communicate directly within the system. Students can message their assigned instructors and coordinators, instructors can message their assigned students, and coordinators can message any student, facilitating real-time communication and collaboration throughout the internship process.

The evaluation system facilitates structured performance assessments from industry supervisors. Standard evaluation forms collect both numerical ratings and written feedback on various performance aspects, producing complete performance profiles for each student. As the INTRAK system gathers data from students (such as attendance logs and document submissions) and receives evaluations from industry supervisors, the evaluation data supports interns through counseling and other program improvement initiatives.

The reporting features allow coordinators to generate compliance documents, monitor program metrics, and identify students needing support. The system produces attendance summaries, document status reports, evaluation summaries, and completion records. These reports assist stakeholders such as academic administration, accreditation bodies, and industry partners.

The chosen web-based deployment model is used for easy access of various devices in different locations while maintaining security with different controls. The responsive interface adapts to different screen sizes, though mobile application development falls outside the current project scope. Users access the system through standard web browsers, avoiding client software installation and streamlining system management.

INTRAK transforms OJT management at PSU–Urdaneta City Campus from a manual, paper-intensive process into a streamlined, digital workflow. By centralizing information, automating routine tasks, and providing real-time visibility into student progress, the system enables the department to deliver a higher quality internship experience while reducing administrative burden on faculty members.

## 1.4 The Project Objectives
### 1.4.1 General Objective

To develop and implement INTRAK, a centralized web-based Internship Tracking and Evaluation System with integrated NAS-based document storage implemented using a Raspberry Pi as the local NAS server., specifically designed to streamline the management, monitoring, and assessment of On-the-Job Training activities for Computer Engineering students at Pangasinan State University – Urdaneta City Campus.

### 1.4.2 Specific Objectives

1. To establish a centralized platform that consolidates all internship activity tracking and document submission processes for Computer Engineering students, eliminating traditional  record-keeping systems and providing accurate internship data.

2. To enable students to submit digital copies of all required internship documentation, including Daily Time Records (DTR), performance evaluations, Memorandum of Agreement (MOA), endorsement letters, and other required forms, through a user-friendly web interface accessible from standard browsers.

3. To provide coordinators with validation tools that facilitate document review, feedback provision, approval processing, and compliance report generation, minimizing manual administrative tasks without compromising quality.

4. To implement a secure login-based attendance monitoring system that captures date and time logs of student activities, creating an auditable record of internship hours while respecting privacy considerations through timestamp-based verification.

5. To equip coordinators and instructors with comprehensive evaluation and performance assessment tools that enable systematic monitoring of intern progress, identification of students requiring intervention, and objective measurement of learning outcomes.

6. To generate automated reports for students, coordinators, instructors, and university administration that support documentation requirements, assessment activities, and program improvement initiatives,  minimizing time spent on manual report preparation

7. To integrate a Raspberry Pi–based Network-Attached Storage (NAS) for secure, centralized storage of all internship-related documents, ensuring data remains under institutional control, providing controlled access, and supporting long-term document retention without relying on external cloud services.

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

2. The study is limited to Computer Engineering students and coordinators only; other departments are included

3. Hard copy submission of certain requirements may still be required as back up depending on the University policy.

4. The system will be web-based only; no mobile application will be developed within this study.

## 1.6 Constraints

### 1.6.2 Operational Constraints
The INTRAK system must follow university policies on document retention, academic record-keeping, and data privacy, which place limits on what the system can do. For example, some official internship documents still require physical signatures or must be kept as hard copies. Because of this, the system cannot be fully digital and must support a combination of digital and physical processes, known as a hybrid workflow.
The academic calendar and available resources also limit the system's development timeline. Only essential features can be implemented in the initial version. More advanced features, such as ISO-compliant digital signatures or automatic integration with external company HR systems, are not included in this first release due to time constraints.
User training and change management are additional operational considerations. Since students, instructors, and coordinators may be used to paper-based processes, the system must have simple and intuitive interfaces. This ensures that users can easily navigate the system, submit documents correctly, and monitor internship progress without needing extensive training. Designing the system in this way also helps reduce resistance to change and encourages adoption across all user groups.

### 1.6.3 Economic Constraints
The project's budget limits the choice of hardware, software tools, and ongoing operational costs. For instance, the system uses a Raspberry Pi as a Network-Attached Storage (NAS) device instead of relying on cloud storage, reducing recurring subscription costs. This one-time investment aligns with budget constraints while still providing sufficient storage capacity for all internship documents.
Using open-source technologies such as PostgreSQL, React, and Node.js also helps address economic limitations. These platforms are free to use, well-supported, and reliable, which allows the development of a professional-quality system without spending extra funds on software licenses. By choosing cost-effective solutions, the project can remain within budget while maintaining system quality and reliability.

### 1.6.4 Environmental Constraints
The system's hardware, including the Raspberry Pi NAS, must be energy-efficient to minimize electricity consumption. Selecting hardware that uses less power helps the university save energy and supports institutional sustainability goals.
In addition, moving from paper-based to digital workflows reduces environmental impact. Less paper is needed, and there is a smaller need for physical storage and transportation of documents. This shift contributes positively to the environment and aligns with sustainable practices encouraged by the university.

### 1.6.5 Security and Privacy Constraints
The system must comply with the Data Privacy Act of 2012 and university policies, which impose rules on how student data is stored, accessed, and monitored. Only authorized users, such as coordinators and instructors, should have access to sensitive information, while students should only see data relevant to them. This ensures that personal information is protected from unauthorized access or misuse.
Restricting system access to Computer Engineering Department users simplifies security management. It creates a clear boundary of responsibility, ensures that all data is managed under a single department, and reduces the risk of data breaches. However, this restriction also limits the ability to integrate the system across other departments or units in the university.

## 1.7 Engineering Standards
The development, implementation, and operation of INTRAK adhere to established engineering standards that ensure quality, security, and maintainability throughout the system lifecycle.

### 1.7.1 Software Quality Standards

**ISO/IEC 25002:2024 - Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE)**
This document uses a quality model to describe how the INTRAK system is evaluated and improved. The quality model serves as a guide for defining requirements, checking whether these requirements are met, and understanding how the system performs in different areas. The sections below present the main quality characteristics considered in the development and assessment of INTRAK.

**Functional Suitability**
 This characteristic explains how well the system supports the needs of its users. For INTRAK, it involves making sure that all required functions for OJT management are present and working as intended, based on the needs identified by the Computer Engineering Department.

**Performance Efficiency**
 This focuses on how the system uses its resources. INTRAK is designed to respond smoothly to user actions and handle expected workloads. Extra attention is given to the speed and stability of file uploads and downloads, especially when using Network Attached Storage (NAS).

**Usability**
 Usability refers to how easy the system is to understand and operate. The interface is designed to be simple and clear so that users with different levels of technical knowledge can navigate the system, reduce mistakes, and perform tasks without difficulty.

**Reliability**
This characteristic deals with the system's ability to run consistently without failure. INTRAK includes backup and recovery measures so that data and services remain available even when unexpected issues occur.

**Security**
Security ensures that information is protected from unauthorized access. INTRAK uses features such as user authentication, access control, data encryption, and activity logging to keep records safe and maintain accountability.

**Maintainability**
Maintainability describes how easily the system can be updated or improved. INTRAK follows a modular structure and uses organized documentation and coding practices, making it easier for developers to add new features or fix issues in the future.

**Portability**
Portability refers to the system's ability to work on different platforms. Since INTRAK is web-based and built using standard technologies, it can be adapted to new environments or systems when needed.

These quality characteristics serve as a foundation for measuring the system's performance and ensuring that INTRAK meets the expectations set for its development and use.

### 1.7.2 ISO/IEC 27001: Information Security Management
ISO/IEC 27001 is an international standard that provides guidance for protecting information within an organization. It describes how an institution can set up, maintain, and improve a system for managing information security. The standard helps organizations understand the risks that may affect the data they handle and identify the controls needed to keep that information safe. It can be applied to any type of institution, regardless of size or field.
Following ISO/IEC 27001 shows that an organization has established clear processes for securing the information it stores or manages. It also means that the organization follows recognized practices for handling risks and preventing unauthorized access, loss, or misuse of data.
Cybersecurity threats continue to grow, and institutions face different types of risks every day. Managing these risks can be difficult without a proper system in place. ISO/IEC 27001 helps organizations become more aware of possible threats and take steps to reduce or prevent them. Instead of focusing only on technical tools, the standard encourages a balanced approach that includes policies, procedures, and technology.
By using this standard, an organization can strengthen its resilience, improve the protection of its information, and maintain stable and secure operations even during unexpected events.
INTRAK adopts several core ideas from ISO/IEC 27001 to protect student information and academic records. These principles guide how the system is designed and maintained.

**Confidentiality** 
Access to sensitive information is restricted to authorized users. INTRAK uses defined user roles, login requirements, and controlled permissions to ensure that only individuals with the proper authority can view or manage specific data.

**Integrity**
The system includes mechanisms that help keep data accurate and unaltered. Input checks, database safeguards, and activity logs are used to prevent unauthorized changes and to track actions taken within the system.

**Availability**
 INTRAK is built to provide users with reliable access to information. Its system setup, backup routines, and server configuration help reduce downtime and ensure that data remains reachable when needed.

### 1.7.3 Database Management Standards
**ACID Properties in PostgreSQL**
PostgreSQL follows the ACID principles to keep the data in INTRAK accurate and dependable. These properties are important because the system records attendance, updates documents, and receives evaluation results, all of which must remain correct even when many users are active.

**Atomicity**
 In INTRAK, atomicity ensures that operations such as attendance entries, document status updates, and evaluation submissions are completed as a single unit. If any part of the process fails—such as a network interruption or invalid input—the entire transaction is cancelled and no partial data is saved. This prevents incomplete records that could affect academic monitoring.

**Consistency**
 Consistency allows INTRAK to maintain accurate and valid information throughout the system. All database rules, such as required fields, allowed values, and defined relationships between student records and OJT data, must be met before any transaction is accepted. If an operation would lead to incorrect or conflicting information, it is blocked, helping preserve reliable academic and administrative data.

**Isolation**
 Isolation is important in INTRAK because multiple users—such as coordinators, advisers, and students—often access the system at the same time. Each user's transaction is processed separately, so changes made by one user are not visible to others until the transaction is completed. This prevents issues such as overwritten entries or inconsistent document statuses during simultaneous updates.

**Durability**
 Durability ensures that once INTRAK saves a transaction, such as a finalized attendance log or approved document, the data remains stored even if the system encounters an unexpected shutdown or failure. PostgreSQL writes committed transactions to stable storage, allowing the system to recover without losing confirmed information.

### 1.7.4 Web Development Standards
**W3C Web Content Accessibility Guidelines (WCAG) 2.1**
WCAG 2.1 provides guidelines for making web content more accessible to people with disabilities, including visual, hearing, physical, or cognitive limitations. The goal is to ensure websites are accessible on various devices—computers, laptops, and mobile phones—and that users can read, understand, and navigate content. While WCAG 2.1 cannot cover every individual need, following it improves overall usability.
The standard is organized into testable success criteria applicable to any web technology. WCAG 2.1 expands on WCAG 2.0 with updates for modern devices and user requirements. Content that follows WCAG 2.1 also meets WCAG 2.0, and using the newer version is recommended for long-term accessibility and relevance.
INTRAK incorporates key WCAG 2.1 principles to support accessible and user-friendly interaction. The interface uses semantic HTML elements and ARIA labels to help screen readers interpret content accurately. Keyboard navigation is supported through focusable elements and visible focus indicators, assisting users who cannot rely on a mouse. Color choices are selected with contrast considerations, including dark mode support, allowing users with low vision to distinguish elements more easily. These measures help ensure that students, advisers, and staff—including those with disabilities—can access and use the system without difficulty.

### 1.7.5 Data Privacy Standards
**RESTful API Design Principles**
The system uses a REST-based API design to provide clear and organized access to its resources. This approach supports easy maintenance and allows the system to be expanded or connected to other platforms in the future. The API structure follows the main REST principles, which guide how the system communicates and handles data.

**Uniform Interface.**
The API follows a consistent structure for all endpoints. Each resource uses standard methods such as GET, POST, PUT, and DELETE. This uniform design makes the system easier to understand and reduces errors in data handling.

**Client–Server.**
The system separates the user interface from the server processes. The client handles the display and input, while the server manages data processing and storage. This separation allows both parts to be improved or updated without affecting each other.

**Stateless.**
Each request from the client contains all the information needed for the server to process it, including a JWT token in the Authorization header. The server validates the token on each request without storing session state between requests. While refresh tokens are stored in the database for token renewal, the API requests themselves are stateless, improving reliability and making the system easier to scale.

**Cacheable.**
The API supports client-side caching strategies where appropriate. While explicit HTTP cache headers are not fully implemented, the system's stateless design and consistent resource structure allow clients to implement caching mechanisms. Response data can be temporarily stored on the client side to reduce repeated requests, helping speed up response times and decrease server load for frequently accessed resources.

**Layered System.**
The system is organized in layers, separating the interface, application logic, and data storage. This structure improves security and makes maintenance and upgrades easier.

**Republic Act No. 10173 - Data Privacy Act of 2012 (Philippines)**
The system adheres to the provisions of Republic Act No. 10173, also known as the Data Privacy Act of 2012. Its design applies the core principles required by Philippine data privacy regulations to ensure the safe and lawful handling of personal information within the INTRAK platform. The system includes consent mechanisms through the required Consent Form document submission, limits data use only to approved and stated purposes related to OJT management, and collects only the information necessary for system operations through data minimization practices.
In addition, the system upholds the rights of data subjects by allowing users to view, verify, and directly update their personal data through their profile settings. Users can access their information, review their records, and make corrections to their personal details without requiring administrative intervention. All data processing activities follow the guidelines issued by the National Privacy Commission for educational institutions. These measures help maintain confidentiality, integrity, and responsible management of personal information throughout the system lifecycle.

### 1.7.6 Network Storage Standards
NAS integration in INTRAK uses standard network file sharing protocols, specifically the Server Message Block (SMB) and its dialect, the Common Internet File System (CIFS). These protocols, commonly implemented in Microsoft Windows and other operating systems, allow the system to work seamlessly with existing institutional storage and ensure compatibility with future storage solutions. The NAS share is mounted at the operating system level, allowing the application to access files through standard filesystem operations.
Both SMB and CIFS play a role in network communication, file access control, and data integrity. SMB facilitates secure file sharing over a network by defining a set of message packets, or dialects, that determine how clients and servers interact. CIFS, as a widely used SMB dialect, provides compatibility with multiple operating systems, enabling INTRAK to integrate with diverse storage environments while supporting scalability and future system upgrades. Understanding these protocols also aids in optimizing system performance and troubleshooting potential network-related issues.
The use of these engineering standards throughout the development of INTRAK ensures that the system maintains professional quality, protects sensitive information, complies with legal requirements, and can be reliably maintained and enhanced over time.

## 1.8 Engineering Design Process
The development of INTRAK follows a structured engineering design process adapted for software systems. It begins with identifying user requirements and defining both functional and non-functional needs, followed by system design, prototyping, and implementation according to best engineering practices. Testing ensures functionality, performance, and compliance with data privacy regulations. After deployment, the system is maintained and continuously improved to ensure long-term reliability, efficiency, and adaptability.

### 1.8.1 Requirements Analysis
The development of the INTRAK system begins with requirements analysis, where the needs of all users, including students, faculty, and administrative staff, are identified. This stage defines both functional requirements, such as document submission, retrieval, and approval workflows, and non-functional requirements, including system security, performance, and interoperability with NAS storage and network protocols.

### 1.8.2 System Design
The system design phase establishes the overall architecture of the system, detailing modules, databases, and network components. During this stage, appropriate engineering standards and protocols, such as SMB/CIFS for NAS integration and secure authentication mechanisms, are selected. Considerations for scalability and future enhancements are also incorporated to ensure the system remains adaptable and sustainable.

### 1.8.3 Prototyping or Modeling
In the prototyping or modeling phase, low-fidelity mockups or working prototypes are created to validate system features. Network interactions and storage operations are simulated, and feedback from stakeholders is gathered to refine the design and address any potential issues before full implementation.

### 1.8.4 Implementation or Coding
The implementation or coding phase involves developing the application using the chosen programming languages and frameworks. This stage includes integrating NAS storage, user authentication, and workflow automation while adhering to engineering best practices such as modularity, proper documentation, and version control to ensure a maintainable and reliable system.

### 1.8.5 Testing and Validation
During testing and validation, the system is evaluated to ensure that all functional and non-functional requirements are met. Functional testing focuses on document submission, retrieval, and approval workflows, while performance testing examines file transfer speeds and system response times. Compliance with data privacy regulations, particularly RA 10173 (Data Privacy Act), is verified to protect sensitive information and prevent unauthorized access.

### 1.8.6 Deployment
In the deployment phase, the system is deployed on a cloud-hosted Virtual Private Server (VPS) provided by Hostinger, with the application and database hosted in the cloud for global accessibility and scalability. The on-premise Raspberry Pi NAS storage located within the campus network is connected to the cloud application server via a Tailscale VPN tunnel, enabling secure document storage while maintaining institutional control over sensitive data. Training is provided to end-users and administrators to ensure effective system usage and smooth operational transition from traditional paper-based processes to the digital platform.

### 1.8.7 Operation and Maintenance
The operation and maintenance phase involves monitoring system performance, applying updates and patches, and addressing any issues that arise during regular use. Continuous feedback is collected to identify areas for improvement and ensure the system remains functional and efficient.

### 1.8.8 Evaluation and Continuous Improvement
Finally, evaluation and continuous improvement are conducted to review system performance and user satisfaction. Adjustments are made based on evolving institutional requirements, and lessons learned are documented to guide future engineering projects and ensure the system's long-term reliability and adaptability.

### 1.8.9 Research the Problem
The research phase involved multi-faceted investigation into existing solutions, technical approaches, and best practices relevant to internship management systems. The team analyzed commercial OJT management platforms to understand common feature sets and architectural patterns, while recognizing that standard solutions did not adequately address the specific requirements and constraints of the Computer Engineering Department in PSU–Urdaneta City Campus.
Technical research was conducted to compare different storage options, including NAS, cloud, and local servers, as well as database systems suitable for managing academic records. Web development frameworks were also evaluated for their security, performance, and ease of maintenance. Insights from software engineering literature guided the choice of system architecture and the development approach.
Regulatory research examined data privacy requirements under Philippine law, document retention policies for educational institutions, and accessibility standards for public sector web applications. This ensured that the system's design would comply with legal and institutional requirements while remaining secure and user-friendly.

### 1.8.10 Imagine: Develop Possible Solutions
The ideation phase generated three alternative architectural approaches for consideration:

**Design 1: Hybrid Cloud with Raspberry Pi as the NAS Storage**
 This design uses a web application hosted on cloud platforms sepcifically Render or Railway, while documents are stored on an on-site Network-Attached Storage (NAS) system in Raspberry Pi. Users can access the application online, but sensitive records remain stored securely within the institution. NAS provides fast internal file access, redundancy, and compliance with school data rules. This approach balances remote access with security.

The INTRAK system includes several user roles that match the needs of the internship process. Each role has specific tasks and permissions to ensure that information is handled properly and responsibilities are clearly assigned. Students can submit requirements and track their internship status. Instructors and coordinators can review submissions, monitor progress, and give feedback. Host institutions can confirm attendance, evaluate performance, and communicate concerns. Administrators oversee the whole system, manage accounts, and ensure that all data remains accurate and up to date.

The chosen design—a hybrid cloud setup supported by a Raspberry Pi–based NAS for centralized document storage—works effectively with this role structure. It supports secure access, organized data management, and smooth information flow between users. By combining cloud accessibility with local storage control, the system reduces delays, keeps records consistent, and improves coordination among all parties. This approach directly addresses common problems in internship processing, such as scattered files, slow manual monitoring, and communication gaps. Overall, the design makes the INTRAK system more reliable, efficient, and easier to manage.

### 1.8.11 Plan: Select a Promising Solution
During the planning phase, the team compared the chosen design to other possible solutions based on important factors such as cost, data security, system performance, ability to grow, and fit with project requirements. This comparison shows the design (NAS-Based Architecture) is an optimal solution.
The chosen design meets the requirement to keep data stored locally while allowing the system to grow more easily than a local server setup. It also has lower ongoing costs than a fully cloud-based system. The security of keeping data on the institution's NAS and the fast access provided by the local network made this design the best option.
Overall, the planning led to the selection of Design 1 (NAS-Based Architecture) as the most suitable solution. It meets the institution's need to keep data stored locally, offers better scalability than a local server, and has lower ongoing costs than a full cloud system. In addition, the security provided by the institutional NAS and the fast access through the local network make it the most practical and reliable choice for the INTRAK system.

### 1.8.12 Create: Build a Prototype
The creation phase involved building the INTRAK system step by step through several development cycles. The first stage focused on the core parts of the system, including setting up the database, connecting to the NAS storage, and creating secure login features. Later cycles added the main functions, such as student registration, uploading and reviewing documents, tracking attendance, and generating reports.
Prototyping followed an agile methodology with regular demonstrations to coordinators and instructors to gather feedback and validate that implemented features met operational needs. This iterative method enabled course corrections during development rather than discovering misalignments late in the project.

**AGILE METHODOLOGY**
Version control, automated testing, and continuous integration were used to ensure code quality and allow the team to work together smoothly. The development setup closely matched the final deployment environment, helping reduce problems when the system went live.

### 1.8.13 Test and Evaluate Prototype
Testing activities encompassed multiple levels to ensure system quality and reliability. Unit tests validated individual functions and components in isolation, while integration tests verified correct interaction between system modules. User interface testing assessed usability, browser compatibility, and responsive design effectiveness.
User acceptance testing was done with real users, including students, instructors, and coordinators, using a test version of the system that worked like the final system. During these tests, users performed normal tasks to see how the system worked in practice. Their feedback helped identify ways to make the system easier to use and improve workflow. The testing also confirmed that the system met the needs of the users and the institution.
Performance testing will be conducted using students from the Computer Engineering Department, OJT coordinators, and assigned coordinators from partner companies. These tests will simulate real usage to check if the system can handle multiple users and document uploads at the same time without slowing down. Security testing, including checking for vulnerabilities and attempting simulated attacks, will evaluate how well the system protects data and controls access through authentication and authorization mechanisms.

### 1.8.14 Improve: Redesign as Needed
The improvement phase encompasses both pre-deployment refinements based on testing feedback and planned post-deployment enhancement cycles. Results show specific improvements including interface refinements for mobile browsers, optimization of database queries for report generation, and strengthening of file validation logic for document uploads.
Performance testing will be done with students from the Computer Engineering Department, OJT coordinators, and company coordinators. The tests will check if the system can handle many users and document uploads at the same time without slowing down. Security testing will also be done to make sure the system keeps data safe and that only authorized users can access it.
The INTRAK system is developed using an iterative engineering design process, which allows for continuous improvement even after the system is first deployed. After implementation, the system will be monitored, and feedback from users will be collected. Regular reviews will help identify opportunities to enhance the system, add new features, and optimize performance in future updates.
This iterative engineering design process ensured that INTRAK development continued in multiple sprint cycles, allowing continuous improvement even after deployment. The system will be monitored, and feedback from users will be collected to validate performance and usability. Regular reviews will identify opportunities to enhance features, add new functions, and optimize the system in future updates.
