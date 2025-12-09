# CHAPTER 3: DESIGN TRADE-OFFS

## 3.1 Summary of Constraints

The selection of an optimal design for the INTRAK system required careful consideration of multiple constraints that bound the solution space. These constraints, established through stakeholder requirements, institutional policies, and technical realities, shaped the evaluation criteria for alternative designs.

**Institutional Constraints:**
The project delimitation mandates that the NAS operate strictly as a local repository within PSU's internal network, with no cloud-based storage or off-campus access. This reflects institutional data governance policies that prioritize data sovereignty, confidentiality, and direct administrative control over student academic records. The system's limitation to the Computer Engineering Department further narrows the user base and integration requirements, simplifying access control but restricting applicability across other academic programs.

Institutional policies also require that the system align with existing campus infrastructure, meaning performance and accessibility are dependent on PSU's network stability and bandwidth constraints. Additionally, the absence of third-party integrations—such as external HR systems, partner company platforms, or university-wide authentication providers—reinforces the institution's preference for isolated, internally governed systems. This constraint reduces security risks but also limits opportunities for automated data exchange.

The project must also conform to PSU's established administrative workflows, which do not currently support digital signatures, automated approval chains, or mobile-first operations. As a result, official signatories must still follow traditional processes, and all practicum coordination must remain within the student–coordinator–instructor–supervisor structure defined by departmental policy. These institutional constraints ensure compliance with existing procedures while shaping the scope of system functionalities and user interactions.

**Technical Constraints:**

The campus network provides gigabit Ethernet connectivity, but access is limited to users on campus or connected through the university's VPN. This means the system depends on the reliability and speed of PSU's internal network.

The platform is designed as a web-based application with responsive layouts, ensuring usability across desktops, tablets, and mobile browsers. There are no native mobile applications, which simplifies development and maintenance but limits mobile-specific functionality.

All data is stored in a PostgreSQL database, requiring proper setup and management within the campus environment. Backup and recovery procedures must align with institutional practices, favoring local NAS storage that works with the university's standard backup protocols.

Security is enforced at every level, including authentication and role-based authorization. All communications between clients and the server are encrypted using HTTPS/TLS. Server-side validation of inputs, file type restrictions, and file size limits are applied to protect the system and data.

The system does not integrate with external HR platforms or partner company systems. Any coordination with outside organizations must be handled manually, which shapes how data flows between users and the system.

Finally, system performance is influenced by available hardware and network resources, including server capacity, storage, and the number of users accessing the system simultaneously. These technical limitations ensure the system remains stable, secure, and manageable within PSU's infrastructure.

**Economic Constraints**
The design and implementation of the INTRAK system take into account the financial limitations and priorities of the institution. Solutions are chosen with predictable costs in mind, giving preference to one-time capital expenditures rather than recurring operational expenses. This approach ensures that the university can plan its budget more effectively and avoid unforeseen financial burdens.
Key system components, such as the local NAS storage for document management and the PostgreSQL database for data handling, were selected for their cost-effectiveness and long-term sustainability. By relying on on-campus infrastructure instead of cloud-based services, recurring subscription costs are minimized, making the system more economical over time.
A five-year economic analysis period has been applied to capture the total lifecycle costs of the system. This includes initial acquisition costs, installation and configuration of hardware and software, operational expenses such as electricity and network maintenance, and ongoing maintenance activities like backups, system monitoring, and eventual hardware replacement. By considering these factors, the analysis provides a realistic estimate of the resources required to operate the system efficiently over its expected lifetime.

The design and implementation of the INTRAK system take into account the financial limitations and priorities of the institution. Solutions are chosen with predictable costs in mind, giving preference to one-time capital expenditures rather than recurring operational expenses. This approach ensures that the university can plan its budget more effectively and avoid unforeseen financial burdens.

Key system components, such as the local NAS storage for document management and the PostgreSQL database for data handling, were selected for their cost-effectiveness and long-term sustainability. By relying on on-campus infrastructure instead of cloud-based services, recurring subscription costs are minimized, making the system more economical over time.

A five-year economic analysis period has been applied to capture the total lifecycle costs of the system. This includes initial acquisition costs, installation and configuration of hardware and software, operational expenses such as electricity and network maintenance, and ongoing maintenance activities like backups, system monitoring, and eventual hardware replacement. By considering these factors, the analysis provides a realistic estimate of the resources required to operate the system efficiently over its expected lifetime.

**Security and Privacy Constraints:**

The INTRAK system is designed to comply with the Philippine Data Privacy Act of 2012, ensuring that all personal and academic information is properly protected. Access to the system is strictly role-based, allowing only students, coordinators, instructors, and company supervisors to view or modify data relevant to their responsibilities. All data transmitted between the client and server is encrypted using HTTPS/TLS protocols to prevent unauthorized interception.

Critical actions, such as document submissions, updates, and access to sensitive records, are recorded in audit logs with the user ID, timestamp, and performed action, supporting accountability and compliance reviews. Sensitive information is never stored in logs or exposed through error messages, and file uploads are restricted by type and size to prevent malicious activity.

All data is stored locally on a NAS within the campus network, with controlled physical and network access, reflecting institutional policies on data governance. Furthermore, interactions are limited to the student–coordinator–instructor–supervisor workflow, reducing the risk of unauthorized access or information leakage. These measures collectively ensure the confidentiality, integrity, and accountability of the INTRAK system.

**Operational Constraints:**

The INTRAK system must comply with university policies that require hard copy backups for certain official documents. This necessitates a hybrid workflow where digital submissions are complemented by physical records to ensure compliance and maintain data integrity.

The system is designed as a web-based platform only, excluding native mobile application development. While this simplifies deployment and maintenance, it limits mobile-specific features and offline access.

Additionally, the project operates under strict academic timelines, which constrain the scope of features that can be implemented in the initial release. Only core functionalities necessary for the practicum workflow are included in the first version, with provisions for future enhancements.

These operational constraints help define evaluation criteria across five key dimensions: economic feasibility, safety and security posture, risk profile, environmental impact, and sustainability in terms of maintainability and longevity. Each design alternative is assessed according to these dimensions to support a systematic and informed selection process.

## 3.2 Trade Offs

The trade-off analysis evaluates the three alternative designs (NAS-Based, Cloud-Based, and Local Server Storage) across five critical dimensions. Each dimension receives quantitative scoring on a 10-point scale where higher values represent superior performance within that dimension.

### 3.2.1 Tradeoff 1: Economic (Material/Equipment Cost)

Economic analysis encompasses initial capital expenditure, ongoing operational costs, and five-year total cost of ownership.

**Proposed Design Cost**
| ITEM/S | Cost |
|--------|------|
| Raspberry Pi | Php 5000.00 |
| Domain name | Php 300.00 |
| Render Database Activation | Php 1800.00 |
| Hostinger for NAS Tunelling | Php 1019.00 |
| **Total** | **Php 8119.00** |

**Alternative Design Cost**
| ITEM/S | Cost |
|--------|------|
| NAS device | Php 20,000.00 |
| Storage Drives (RAID) | Php 10,000.00 |
| Setup and Configuration | Php 1,000.00 |
| **Total** | **Php 31,000.00** |

The development and deployment of the Intrak System require an initial investment that covers essential hardware and service components. The setup includes a Raspberry Pi costing ₱5,000, which serves as the primary processing unit for the system. Additional expenses include a domain name priced at ₱300 to enable accessible and stable system routing, and Render database activation costing ₱1,800 to support backend data management and system operations.

To complete the infrastructure, the system also requires Hostinger services amounting to ₱1,019 for NAS tunneling, ensuring secure and continuous access to storage resources. These combined expenses reflect a practical and cost-efficient implementation framework for the Intrak System. The overall budget remains manageable while providing the necessary tools to support reliable performance, long-term stability, and ease of system maintenance.

**Cost Analysis:**

**PROPOSED DESIGN TOTAL PRICE VS ALTERNATIVE POSSIBLE DESIGN TOTAL PRICE**

### 3.2.2 Tradeoff 2: Safety : Cybersecurity Risk Assessment

The researchers applied a structured cybersecurity risk scoring approach to the INTRAK System to ensure that the platform is secure, reliable, and suitable for handling sensitive internship data. This method was selected because it provides a systematic way to identify assets, examine vulnerabilities, evaluate threats, and measure the overall level of risk in a clear and quantifiable manner. By following this framework, the researchers were able to understand the system's security posture, prioritize potential weaknesses, and recommend appropriate controls. Using this approach ensures that the INTRAK System is developed with strong cybersecurity foundations, supports safe data handling, and remains resilient against evolving cyber threats.

**Asset Identification**
The first step in the cybersecurity risk assessment of the INTRAK System is identifying the key assets that must be protected. These assets include the Raspberry Pi server or NAS used for storage, the INTRAK web application, the database containing student internship records, and the internal school network through which the system operates. It also covers documents uploaded by students and coordinators, user accounts, authentication mechanisms, and any third-party dependencies used by the application. Identifying these assets establishes the security baseline and clarifies what portions of the system require the most protection.

**Vulnerability Assessment**
After identifying the assets, the next step is determining the vulnerabilities present within the INTRAK System. These may include weak or reused passwords, outdated packages on the Raspberry Pi, misconfigured NAS storage, unprotected network ports, insecure coding practices such as lack of input validation, and exposure to third-party component flaws. Vulnerabilities are discovered through tools like vulnerability scanners, manual inspection, network scans, and internal audits. This process helps uncover weak points that an attacker might exploit.

**Threat Assessment**
Once vulnerabilities are identified, potential threats are assessed. For the INTRAK System, these threats may include unauthorized access by outsiders, data breaches, SQL injection attacks, insider misuse by students or staff, malware or ransomware, and sudden hardware or storage failure. Natural hazards such as power interruptions may also pose operational threats. Assessing these threats helps determine what events could realistically occur and endanger the system.

**Impact Assessment**
After understanding the threats, their potential impact on the INTRAK System is evaluated. A successful cyber incident could lead to unauthorized disclosure of student records, manipulation of internship evaluations, delays in internship processing, or complete system downtime. These consequences may damage institutional reputation, cause operational disruptions, or result in financial losses related to recovery. Rating the impact helps classify which risks can cause the most harm.

**Likelihood Estimation**
Each threat is then evaluated based on how likely it is to occur. Likelihood is estimated using past incidents in similar systems, the current exposure of the Raspberry Pi server, and the strength of existing security measures. For example, outdated software increases the likelihood of exploitation, while strong authentication lowers it. Measuring likelihood makes the risk scoring process more objective and measurable.

**Aggregate Risk**
After calculating individual risk scores, all values are combined to determine the overall risk posture of the INTRAK System. This aggregated score offers a clearer view of whether the system is generally secure, moderately exposed, or highly vulnerable. It simplifies communication with stakeholders by providing a single indicator of system risk.

**Normalization**
To enhance clarity, the aggregated risk may be normalized into a standard scoring range such as 0–10 or 0–100. Normalization ensures consistency in interpreting the severity of the system's cybersecurity condition. This makes the results easier to compare with future assessments or with other systems.

**Prioritization**
Based on the calculated risk scores, risks are ranked from highest to lowest, and mitigation actions are assigned. High-priority risks may require updates to server security, stronger password policies, additional access controls, improved input validation, or enhanced NAS security. This prioritization ensures that limited resources are focused on the areas that present the most danger to the INTRAK System.

**Continuous Monitoring and Updating**
The final step involves continuously monitoring the INTRAK System to detect new threats and re-evaluate existing risks. As cybersecurity conditions evolve, periodic updates, log monitoring, vulnerability scans, and system maintenance are essential. Regular reassessment ensures that the INTRAK System remains secure throughout its operation and adapts to new vulnerabilities and threats that may arise.

**Safety Analysis:**

The proponents evaluated the cybersecurity risk level of the INTRAK System by examining its core assets, identifying system weaknesses, and analyzing possible threats that may compromise its operation. This assessment focused on the Raspberry Pi or NAS storage, the INTRAK web platform, its database, network infrastructure, user accounts, and all internship-related documents managed by the system. By reviewing system configurations, software versions, coding practices, and third-party components, the team identified potential vulnerabilities such as weak authentication, outdated packages, misconfigured storage, and unprotected network access. These vulnerabilities were then paired with realistic threats including unauthorized intrusion, data breaches, malware attacks, insider misuse, and possible hardware failure.
Based on these threat–vulnerability combinations, the investigators assessed the potential impact on the institution, recognizing that incidents could result in data loss, altered internship records, operational delays, or damage to institutional credibility. The likelihood of each threat was also measured according to the system's exposure and the strength of existing safeguards. When combined, these factors provided an overall picture of the system's cybersecurity posture, allowing the team to determine whether the INTRAK System is at low, moderate, or high risk. To ensure clarity, the overall risk score may be normalized into a consistent range for easier communication to stakeholders.
This evaluation enabled the proponents to rank the most critical risks and define appropriate mitigation strategies, such as improving access controls, updating software, securing storage, and performing regular system maintenance. Continuous monitoring was also emphasized to ensure that the INTRAK System remains protected against evolving threats. Through this structured assessment, the study team was able to develop a clear and evidence-based understanding of the system's cybersecurity condition.

### 3.2.3 Tradeoff 3: Risk Management
The  research employs a structured cybersecurity risk management approach to handle the reliability of the INTRAK system. This method is widely used in information systems research because it provides a systematic way to identify assets, detect vulnerabilities, assess threats, and prioritize risks based on potential impact and likelihood. This framework allows researchers to evaluate risks comprehensively while implementing targeted mitigation strategies, ensuring that the system remains secure and resilient against evolving cyber threats.

**1. Asset Identification**
The first step in managing cybersecurity for the INTRAK System is to identify and understand all critical assets. These include the Raspberry Pi NAS storage, the web application, the database containing student internship records, network components, user accounts, and any third-party libraries or plugins. By cataloging each asset, administrators gain a clear picture of what needs protection and where potential vulnerabilities may exist. This foundational step ensures that the most critical components of the system, particularly those handling sensitive student data, are prioritized in security planning and assessment.

**2. Finding Security Gaps**

After identifying the system assets, the research  evaluates potential security gaps. Tools such as vulnerability scanners, malware detection software, and network analyzers help uncover weaknesses that could be exploited. In the INTRAK System, possible gaps include outdated Raspberry Pi packages, misconfigured NAS storage permissions, exposed network ports, weak passwords, and vulnerabilities in the web application. By carefully assessing these gaps, administrators can understand the system's exposure to threats and develop effective mitigation strategies.

**3. Risk Rating and Prioritization**

Once vulnerabilities are identified, the associated risks are rated and prioritized based on their likelihood of occurrence and potential impact. For INTRAK, risks such as unauthorized access, insider misuse, SQL injection, ransomware attacks, or hardware failure are evaluated. High-priority risks—like exposed directories on the NAS containing sensitive student records—are addressed first, ensuring that the most serious threats receive immediate attention. This structured prioritization allows resources to be focused on protecting the parts of the system with the greatest potential consequences.

**4. Fixing Security Issues**

.In the INTRAK System, this may involve updating the Raspberry Pi and web application software, configuring NAS storage with proper access permissions, enforcing strong password policies, and establishing regular backup routines. These measures reduce the likelihood of data breaches or system disruptions while maintaining the integrity and availability of student internship information.

**5. Tracking and Continuous Monitoring**

The final step in cybersecurity risk management is ongoing monitoring of the system's security status. For INTRAK, this includes reviewing activity logs, detecting unauthorized changes to files, and performing regular performance and vulnerability checks. Continuous monitoring ensures that new threats or suspicious activities are detected early, allowing timely intervention. It also supports the long-term sustainability and reliability of the Raspberry Pi NAS-based system, ensuring that sensitive internship data remains secure against evolving cyber threats.

**Risk Analysis**

The cybersecurity risk management approach applied to the INTRAK System has proven to be a practical and effective method for safeguarding sensitive student internship data. By systematically identifying assets, assessing vulnerabilities, evaluating threats, and prioritizing risks, this approach provides a clear framework for understanding the system's exposure to potential security incidents. The use of a Raspberry Pi NAS as the primary storage device highlights the importance of targeted risk assessment, as it combines cost-effective hardware with the need for robust access control, backup routines, and continuous monitoring.
This approach allows administrators and researchers to make informed decisions regarding mitigation strategies, focusing resources on the highest-priority risks while maintaining system availability and integrity. Furthermore, continuous monitoring ensures that the INTRAK System remains resilient to evolving threats, supporting both operational reliability and long-term sustainability. Overall, the structured risk management framework demonstrates its usefulness in creating a secure, efficient, and adaptable platform for managing internship data in an academic environment.

**Design 1: Hybrid Cloud with NAS Storage**
- Hardware Failure Rate: LOW (RAID 5 tolerates single drive failure)
- Network Dependency: Mixed (Local LAN for campus, Internet for remote access)
- Mean Time to Recovery: 2-4 hours (drive replacement in degraded RAID state)
- Single Point of Failure: None (RAID redundancy)
- Scalability Risk: LOW (capacity easily expanded)
- Score: 9/10 (high reliability through redundancy)

**Design 2: Cloud-Based Storage**
- Hardware Failure Rate: VERY LOW (provider-managed multi-datacenter redundancy)
- Network Dependency: High (requires internet connectivity)
- Mean Time to Recovery: Minutes (automatic failover to backup regions)
- Single Point of Failure: Internet connection, provider service availability
- Scalability Risk: NONE (unlimited elastic capacity)
- Provider Risk: Moderate (vendor lock-in, service discontinuation possibility)
- Score: 8/10 (excellent reliability but external dependency)

**Design 3: Local Server Storage**
- Hardware Failure Rate: Moderate (RAID 1 tolerates single drive failure)
- Network Dependency: Moderate (campus LAN)
- Mean Time to Recovery: 4-8 hours (drive replacement, potential data restore from backup)
- Single Point of Failure: Server hardware (all components on one system)
- Scalability Risk: HIGH (capacity expansion requires downtime, potential hardware limits)
- Score: 6/10 (acceptable redundancy but scalability constraints)

**Analysis:**
Design 2 offers the highest inherent reliability through provider-managed redundancy across multiple datacenters, but introduces dependency on external service availability and internet connectivity. Design 1 provides strong reliability through RAID redundancy while maintaining institutional control, with the flexibility to implement additional redundancy (second NAS for replication) if requirements evolve. Design 3's co-location of all functions increases blast radius of hardware failures: a single server issue impacts application, database, AND file storage simultaneously.

For a campus-based deployment with hybrid access requirements, Design 1's reliability profile proves most appropriate. It ensures high-speed local access even if internet connectivity fails, while supporting remote users when connectivity is available.

### 3.2.4 Tradeoff 4: Environmental Tradeoff

The researchers use environmental analysis to evaluate the ecological impact of technology alongside its operational and financial benefits. In this study, they apply this approach to the INTRAK System, which utilizes a Raspberry Pi NAS-based storage, to assess energy consumption, resource use, and sustainability. The findings are presented in a table highlighting key aspects such as hardware, operational costs, storage management, maintenance, and overall sustainability, with detailed explanations provided for each category. This method allows the researchers to demonstrate how the system reduces energy use, minimizes paper consumption, and limits electronic waste, highlighting its contribution to environmentally responsible and sustainable academic technology practices.

| Aspect | Description | Benefit/Cost | Impact on Environment |
|--------|-------------|--------------|----------------------|
| Hardware | Raspberry Pi NAS instead of Servers | Lower Energy consumptiON / Compact design | Reduces electricity and carbon footprint |
| Operational Cost | Power usage for system operation | Reduced electricity bills | Less environmental impact from energy production |
| Storage and Document Management | Centralized NAS storage replaces paper records | Decrease need for printing and paper storage | Conserve natural resources and reduces paper waste |
| Maintenance and Upgrades | Lightweight hardware with modular components | Easier to maintain and replace | Minimize electronic waste compared to large servers |
| Sustainability | Long-term deployment with low power devices | Continues to provide secure storage with minimal energy | Support eco-friendly practices and sustainability goals |

**1. Hardware**

The choice of a Raspberry Pi NAS as the primary hardware for the INTRAK System offers a significant environmental advantage compared to conventional servers. The Raspberry Pi consumes much less electricity due to its low-power design, which directly reduces the system's overall energy usage. This not only lowers operational costs but also decreases the carbon footprint associated with powering the system, making it a more sustainable solution for the institution.

**2. Operational Cost**

Lower energy consumption directly translates into cost savings for the school. Operating a Raspberry Pi NAS requires far less electricity than running standard desktop or server hardware. This reduction in energy usage not only benefits the institution financially but also indirectly contributes to environmental conservation by minimizing the energy demand and the associated emissions from electricity generation.

**3. Storage & Document Management**

The centralized NAS storage system in INTRAK reduces the need for physical documentation. By storing internship records and student documents digitally, the system significantly decreases paper consumption. This helps conserve natural resources and reduces the waste generated by traditional paper-based systems, making the overall process more environmentally friendly.

**4. Maintenance & Upgrades**

The modular and lightweight design of the Raspberry Pi makes it easy to maintain and upgrade individual components without replacing the entire system. This reduces electronic waste, which is a common issue with traditional servers that require complete replacement when components fail or become outdated. Efficient maintenance practices extend the system's lifecycle while minimizing environmental impact.

**5. Sustainability**

Overall, the INTRAK System's design supports long-term environmental sustainability. The combination of low power consumption, digital document management, and modular hardware ensures that the system remains energy-efficient and eco-friendly over time. By adopting such technologies, the institution can achieve secure and reliable data management while also promoting greener IT practices and reducing its ecological footprint.

**Environmental Analysis**

The implementation of the INTRAK System using a Raspberry Pi NAS-based storage offers significant environmental advantages. The low-power consumption of the Raspberry Pi reduces electricity usage, which in turn lowers operational costs and minimizes the system's carbon footprint. Additionally, the centralized digital storage reduces the need for paper-based records, conserving natural resources and decreasing waste. These features make the system more sustainable compared to traditional server setups, demonstrating that secure and efficient data management can be achieved with eco-friendly practices.

Furthermore, the modular and maintainable design of the Raspberry Pi ensures that hardware components can be upgraded or replaced without generating excessive electronic waste, extending the system's lifecycle. By combining energy efficiency, reduced material consumption, and long-term sustainability, the INTRAK System provides a responsible approach to managing student internship data. This approach not only supports the institution's operational goals but also promotes environmentally conscious IT practices, making the system a model for sustainable academic technology solutions.

### 3.2.5 Tradeoff 5: Sustainability : Power Consumption,  System Lifespan and Maintainability

The researchers consider the sustainability trade-offs of the INTRAK System by examining power consumption, system lifespan, and maintainability. Low power usage reduces energy costs and carbon footprint, while a long-lasting, maintainable Raspberry Pi NAS minimizes electronic waste and ensures the system remains functional over time. These factors together highlight the system's environmental and operational sustainability in an academic setting.

**Power Consumption** 
The Intrak System was evaluated based on its actual operating conditions, using an average measured power consumption of 12 kWh across 2,304 hours of operation. These values reflect the energy required to keep the Raspberry Pi–based NAS, network components, and related services running during their active periods. When translated into practical terms, this level of consumption indicates that the system uses approximately 0.0052 kWh per hour, which is relatively low compared to traditional server-based solutions.
This energy profile shows that the Intrak System is efficient in terms of electrical demand, largely due to the low-power nature of the Raspberry Pi. Even with continuous or extended operation, the system remains cost-effective to run and does not significantly add to institutional energy expenses. The modest energy usage also helps limit the system's environmental impact, resulting in a smaller carbon footprint compared with conventional NAS devices or cloud servers that require more substantial power and cooling resources.
This evaluation demonstrates that the Intrak System is capable of sustained operation while maintaining low energy consumption, making it a practical and environmentally conscious solution for institutional data management.

**System Lifespan**
The lifespan of the Intrak System depends on the durability of its hardware components—primarily the Raspberry Pi (4GB RAM model) and the 128GB external hard drive used for storage. Based on general NAS reliability guidelines, small-form devices such as the Raspberry Pi typically have long operational lives because they run on solid-state components and generate minimal heat. When operated under stable conditions with proper ventilation, a Raspberry Pi can remain functional for five years or more without significant performance degradation.

The more critical factor affecting lifespan is the external 512GB drive. Storage devices are usually the first components to show signs of aging in NAS environments due to constant read/write activity. Industry references on NAS maintenance suggest that consumer-grade external drives generally last 3 to 5 years under continuous or frequent use. However, with light to moderate workloads—such as storing institutional documents, logs, and small database files—the lifespan can extend to 5 to 7 years, provided the drive is kept in a cool, dust-free environment and monitored for early signs of wear.

Environmental conditions also play an important role. NAS storage tends to fail faster when exposed to heat, unstable power, or humidity. In the case of the Intrak System, the lightweight nature of the Raspberry Pi and the use of USB-based storage reduce heat buildup, which helps extend the system's operational life. Ensuring stable power, possibly through a UPS, further supports longevity by preventing sudden shutdowns that can damage the drive.
Routine maintenance contributes directly to lifespan. Periodic checking of drive health, updating software packages, and replacing the external drive before reaching its expected end-of-life can help the system maintain reliable performance throughout its operational cycle. Taking these factors into account, the Intrak System is expected to operate efficiently for approximately 5 to 7 years, with the external drive being the component most likely to require earlier replacement.

**Maintainability**
In developing the INTRAK platform, we made sure that the structure of the system would support long-term upkeep. The entire codebase was arranged into clear modules that separate the frontend interface, backend logic, and database operations. This separation ensures that adjustments to one section do not unintentionally disrupt the others. As a result, new features can be added more easily, and troubleshooting becomes less time-consuming for future developers.

Another key maintainability practice applied to INTRAK is the use of readable code supported by meaningful comments and descriptive filenames. Instead of writing long and complex scripts, the system follows a consistent coding style that prioritizes clarity. Each major process—such as authentication, data retrieval, and record updating—is documented to guide anyone who may need to modify the system later. This approach reduces the learning curve for new development team members and minimizes the risk of errors caused by misunderstandings or misinterpretation of the code.

We also adopted a structured design philosophy for the website layout and user interface. Reusable components, such as navigation elements, buttons, and input fields, were implemented to maintain consistency across different sections of the platform. This strategy not only speeds up the development process but also ensures that future revisions maintain the same visual and functional standards. When pages need to be redesigned or expanded, developers can rely on established templates rather than rebuilding elements from scratch, making the system more efficient to update.

To further support long-term system stability, routine maintenance practices were integrated into the workflow. These include periodic database cleanup to prevent unnecessary storage growth, monitoring of system logs to identify unusual behavior, and regular updates to software dependencies to reduce vulnerabilities. By incorporating these practices early in the project, the INTRAK system is better positioned to adapt to institutional needs, remain secure, and continue operating smoothly with minimal disruptions. Overall, these maintainability strategies ensure that INTRAK will remain functional, modifiable, and reliable throughout its expected operational lifespan.

**Sustainability Analysis:**
The sustainability evaluation of the INTRAK System demonstrates that it is an environmentally conscious and operationally efficient platform for managing institutional data. The system's low power consumption, averaging approximately 0.0052 kWh per hour, reflects the energy efficiency of the Raspberry Pi NAS-based storage and associated components. This low energy profile not only reduces operational costs but also minimizes the system's carbon footprint compared to conventional servers or cloud-based storage solutions. Combined with its capacity for sustained operation, the INTRAK System provides a practical and cost-effective solution that balances energy efficiency with institutional data management needs.

In terms of longevity and maintainability, the INTRAK System is designed to support long-term use with minimal environmental and operational impact. The Raspberry Pi hardware and external storage drive are expected to function reliably for 5 to 7 years under stable conditions, with routine maintenance practices such as monitoring drive health, updating software, and database cleanup further extending the system's lifespan. Additionally, the modular and well-documented code structure ensures ease of future updates, reduces the risk of errors, and facilitates ongoing maintenance without major overhauls. These factors collectively highlight the INTRAK System's sustainability, showing that it is a secure, adaptable, and environmentally responsible platform capable of long-term operation in an academic setting.

## 3.3 Summary of Normalized Values and Design Selection

The trade-off scores are summarized in the following table:

| Design Criteria | Weight | Design 1 (Hybrid) | Design 2 (Cloud) | Design 3 (Local) |
|---|---|---|---|---|
| Economic Cost | 20% | 8 | 7 | 10 |
| Safety/Security | 25% | 9 | 6 | 8 |
| Risk/Reliability | 20% | 9 | 8 | 6 |
| Environmental | 15% | 7 | 9 | 8 |
| Sustainability | 20% | 9 | 8 | 6 |
| **Weighted Score** | **100%** | **8.50** | **7.45** | **7.60** |

**Weighting Rationale:**
- **Safety/Security (25%)**: Highest weight reflects critical importance of data protection for student academic records and compliance with Data Privacy Act
- **Economic (20%)**: Significant but not dominant; budget constraints are real but not the primary driver
- **Risk/Reliability (20%)**: High weight reflects importance of system availability for academic operations
- **Sustainability (20%)**: Long-term viability crucial for institutional systems with multi-year lifecycles
- **Environmental (15%)**: Meaningful consideration but lower priority than functional and security requirements

**Design Selection Decision:**
Design 1 (Hybrid Cloud with NAS Storage) emerges as the optimal solution with a weighted score of 8.50/10, significantly outperforming the alternatives. The selection is driven by several factors:

1. **Alignment with Constraints**: Design 1 satisfies the project requirement for institutional data custody while flexibly supporting remote access needs through secure gateway configuration.

2. **Security Excellence**: The high security score addresses the paramount concern of protecting student data under institutional control, even with the expanded access model.

3. **Balanced Performance**: Design 1 scores well across all dimensions without critical weaknesses. It avoids the scalability limitations of Design 3 and the vendor dependency of Design 2.

4. **Institutional Fit**: Design 1 aligns with university IT practices, integrating naturally with existing backup systems and network infrastructure.

5. **Future-Proofing**: The NAS architecture provides clear expansion paths as the system potentially expands to additional departments.

While Design 3 scores highest on economic criteria (10/10), its poor performance on scalability-related dimensions (Risk: 6/10, Sustainability: 6/10) disqualifies it for a system expected to accommodate growing user bases and data volumes over time.

Design 2, despite offering operational advantages (elastic scaling, zero maintenance), fails the fundamental preference for local data residency and introduces unacceptable external dependencies for an institutional academic system.

## 3.3 Influence of the Design Tradeoff in the Final Design

Economic Trade-off: The researchers prioritized cost-effectiveness by selecting a Raspberry Pi NAS-based storage instead of a traditional server. This choice reduced initial investment and operational expenses while still providing sufficient performance for managing student internship data.

Safety Trade-off: Security measures, such as user authentication and access controls, were implemented to protect sensitive information. The design ensured that these safety features did not complicate system use, maintaining a balance between protection and user convenience.

Risk Trade-off: The system focused on mitigating high-impact vulnerabilities, such as unsecured NAS directories or outdated software packages, while lower-risk issues received fewer resources. This allowed efficient allocation of security measures without overcomplicating the system.

Environmental Trade-off: The INTRAK System was designed with low-power hardware and digital document management to minimize energy consumption and reduce paper usage. These measures limit the system's carbon footprint and contribute to sustainable IT practices.

Sustainability Trade-off: Long-term maintainability and system lifespan were emphasized through modular software design, well-documented code, and routine maintenance. These practices ensure the system remains functional, adaptable, and reliable over time, supporting institutional needs without frequent overhauls.

By carefully considering these trade-offs, the researchers developed a final INTRAK design that is cost-efficient, secure, environmentally responsible, and sustainable, providing a reliable platform for managing internship data in an academic setting.

**Storage Architecture Decision:**
The selection of NAS-based storage fundamentally shapes the system architecture. File upload workflows incorporate SMB protocol operations for local access and HTTPS API calls for remote access. The application requires SMB client libraries and appropriate network permissions to access NAS resources. Error handling logic addresses network storage-specific failure modes such as connection losses or insufficient NAS capacity.

**API Design:**
The document storage design influences API endpoint implementation. File upload endpoints perform two distinct operations: writing binary content to NAS via system file operations, then committing metadata to PostgreSQL. This two-phase approach requires transaction management to maintain consistency between filesystem state and database records.

**Security Implementation:**
The high weighting of security criteria drove specific implementation decisions. All file operations enforce authorization checks before executing. Audit logs capture file access operations with user identity, timestamp, and action type. The NAS configuration restricts access to dedicated service accounts, preventing direct student/faculty access to the underlying filesystem. The addition of remote access capabilities necessitated strict firewall rules and VPN/HTTPS requirements.

**Capacity Planning:**
The sustainability dimension consideration led to capacity planning guidelines. The NAS deployment specifies 12TB initial usable capacity, calculated to accommodate 5 years of growth based on projected document volumes (50 students × 200 MB average documents per student × 5 years = ~50 GB per cohort year). The 12TB provision provides ~24x overhead for conservative capacity planning.

**Infrastructure Requirements:**
The trade-off analysis results informed infrastructure procurement specifications. The final design specifies enterprise-grade NAS hardware with RAID 5 configuration, rejecting consumer-grade devices inadequate for reliability requirements identified in the risk dimension analysis.

**Backup Strategy:**
The NAS selection enables integration with institutional backup systems through standard network share backup. The backup strategy implements daily incremental backups of the NAS document repository with weekly full backups, addressing the sustainability dimension's long-term data preservation requirements.

**Deployment Architecture:**
The network topology places the NAS on the same subnet as the application server to maximize throughput and minimize latency. Gigabit Ethernet connectivity ensures file transfer performance meets user experience expectations. The configuration of a secure internet gateway enables the required remote access for industry partners.

**Alternative Rejected Features:**
The decisioning process explicitly rejected *pure* cloud storage integration (Design 2), ruling out features such as public CDN acceleration. However, the requirement for remote access was met through the hybrid NAS configuration rather than adopting a full cloud architecture, preserving data sovereignty while delivering necessary functionality.

The systematic trade-off analysis ensured that design decisions aligned with project priorities, explicitly valuating security and sustainability over raw performance or cost minimization. This stakeholder-informed prioritization produced an architecture appropriate for the institutional academic context.

## 3.4 Sensitivity Analysis
A sensitivity analysis was conducted to evaluate how changes in key independent variables influence the performance, security, and sustainability outcomes of the INTRAK System. This approach helps identify which factors have the most significant impact on the system and informs priorities for optimization and resource allocation.

**1. Hardware Configuration**
This includes the choice of NAS device (Raspberry Pi), storage capacity, and memory. In the INTRAK System, hardware configuration directly affects system performance, energy consumption, and reliability. For example, the Raspberry Pi's low-power design reduces electricity usage and operational costs, but its limited processing capability could affect performance when handling multiple simultaneous requests. Adjusting hardware specifications allows researchers to analyze trade-offs between performance, cost, and energy efficiency.

**2. Software Setup**
Software setup encompasses the web application configuration, database design, and security settings. In the INTRAK System, optimized software improves system responsiveness, ensures secure access to student internship records, and minimizes vulnerabilities. Researchers can vary configurations—such as enabling stricter authentication or input validation—to see how these changes impact system security, user experience, and operational efficiency.

**3. User Activity**
This variable includes the number of active users, frequency of data uploads, and types of operations performed. In the INTRAK System, high user activity can affect processing speed, response time, and energy consumption. Sensitivity analysis allows researchers to determine system capacity and identify how the system performs under peak usage, ensuring it remains reliable during periods of heavy workload.

**4. Network Environment**
Network environment refers to bandwidth, latency, and connectivity stability. For the INTRAK System, network conditions influence access speed, data transfer reliability, and overall system performance. Researchers can simulate different network conditions to evaluate how the system responds to slow connections, intermittent outages, or high-latency scenarios, which informs network optimization strategy.

**5. Maintenance Practices**
Maintenance practices include software updates, backups, monitoring, and database cleanup. In the INTRAK System, regular maintenance directly impacts security, reliability, and sustainability. By varying the frequency and thoroughness of maintenance, researchers can assess how these practices affect system lifespan, vulnerability management, and operational stability, highlighting the importance of proactive upkeep in maintaining a secure and efficient system.

**Dependent Variables**

**1. System Performance**
System performance refers to how efficiently the INTRAK System processes requests, retrieves data, and responds to users. In the INTRAK System, performance was measured through response time, uptime, and transaction processing speed. Researchers monitored how changes in hardware, software, and user activity affected performance, ensuring the system could handle multiple users and large data uploads without significant delays.

**2. Data Security**
Data security measures the protection of sensitive information, such as student internship records. In INTRAK, security outcomes included the effectiveness of authentication mechanisms, access controls, and vulnerability mitigation. Researchers used this variable to evaluate whether the system could prevent unauthorized access, SQL injection, and other potential cyber threats, guiding the implementation of robust security features.

**3. System Reliability**
Reliability refers to the system's ability to operate continuously without errors or crashes. For INTRAK, this included monitoring for unexpected downtime, database errors, and hardware failures. By analyzing reliability, researchers ensured that the system remained stable over time, providing uninterrupted access for both students and administrators.

**4. Energy Consumption**
Energy consumption reflects the amount of electricity used by the Raspberry Pi NAS and associated components. Researchers measured this variable to evaluate the environmental and operational efficiency of the INTRAK System. Low energy consumption confirmed the system's sustainability and cost-effectiveness compared to traditional servers or cloud-based storage.

**5. User Satisfaction / Efficiency**
User satisfaction measures how easily and efficiently students, coordinators, and administrators could interact with the INTRAK System. Researchers evaluated this variable by observing how intuitive the interface was, how quickly tasks could be completed, and how responsive the system felt during typical use. High satisfaction indicates that the system meets user needs while supporting institutional internship management goals.

**Conclusion**
The sensitivity analysis of the INTRAK System evaluates how variations in independent variables influence the performance, security, reliability, energy consumption, and user experience of the platform. Hardware configuration, such as the use of a Raspberry Pi NAS and its storage capacity, has a direct impact on system performance and energy consumption. For example, upgrading to higher-spec hardware improves response time and processing speed but increases power usage, demonstrating a trade-off between efficiency and operational cost.

Software setup—including database structure, authentication mechanisms, and application configuration—affects data security, system reliability, and user satisfaction. Stricter security settings reduce vulnerabilities but may slightly increase response time, showing the sensitivity of performance to software design choices. User activity, such as the number of concurrent users or frequency of document uploads, directly influences system performance, energy consumption, and response times. The analysis shows that moderate workloads maintain optimal system efficiency, while high activity periods may slow operations and slightly increase energy use.

Network environment—bandwidth, latency, and connectivity stability—also affects system responsiveness and reliability. Sensitivity analysis highlights that even with low-power hardware, poor network conditions can degrade performance and reduce user satisfaction. Finally, maintenance practices, including software updates, backups, and database cleanup, influence system reliability, security, and sustainability. Regular maintenance reduces the risk of failures, prevents data loss, and extends the system's lifespan, emphasizing the importance of proactive upkeep.

Overall, the sensitivity analysis reveals that system performance, security, and sustainability are most influenced by hardware, software configuration, and user activity. By identifying these critical variables, researchers can optimize the INTRAK System to ensure it operates reliably, securely, and efficiently under varying conditions, supporting institutional goals while maintaining energy efficiency and environmental sustainability.

### 3.4.1 Iteration 1: Economic-Focused (10-9-8-7-6)

**Weighting:** Economic: 35%, Safety: 25%, Risk: 20%, Environmental: 10%, Sustainability: 10%

| Design | Weighted Score |
|---|---|
| Design 1 (NAS) | 8.60 |
| Design 2 (Cloud) | 7.05 |
| Design 3 (Local) | 8.50 |

**Result:** Design 1 remains optimal but margin narrows. High economic weighting benefits Design 3's low cost.

### 3.4.2 Iteration 2: Security-Focused (6-10-7-8-9)

**Weighting:** Economic: 10%, Safety: 40%, Risk: 15%, Environmental: 15%, Sustainability: 20%

| Design | Weighted Score |
|---|---|
| Design 1 (NAS) | 9.05 |
| Design 2 (Cloud) | 7.60 |
| Design 3 (Local) | 7.25 |

**Result:** Design 1 margin increases significantly. High security weighting emphasizes Design 1's data sovereignty advantage.

### 3.4.3 Iteration 3: Environmental-Focused (6-8-10-7-9)

**Weighting:** Economic: 10%, Safety: 20%, Risk: 10%, Environmental: 35%, Sustainability: 25%

| Design | Weighted Score |
|---|---|
| Design 1 (NAS) | 8.45 |
| Design 2 (Cloud) | 8.20 |
| Design 3 (Local) | 6.95 |

**Result:** Design 1 maintains lead. Environmental focus helps Design 2 but not enough to overcome security disadvantage.

### 3.4.4 Iteration 4: Reliability-Focused (9-7-10-8-6)

**Weighting:** Economic: 20%, Safety: 20%, Risk: 35%, Environmental: 15%, Sustainability: 10%

| Design | Weighted Score |
|---|---|
| Design 1 (NAS) | 8.80 |
| Design 2 (Cloud) | 7.75 |
| Design 3 (Local) | 7.35 |

**Result:** Design 1 strengthens position. High reliability weighting favors Design 1's RAID redundancy.

### 3.4.5 Iteration 5: Sustainability-Focused (8-7-6-9-10)

**Weighting:** Economic: 15%, Safety: 20%, Risk: 15%, Environmental: 20%, Sustainability: 30%

| Design | Weighted Score |
|---|---|
| Design 1 (NAS) | 8.70 |
| Design 2 (Cloud) | 7.90 |
| Design 3 (Local) | 7.05 |

**Result:** Design 1 maintains advantage. Sustainability emphasis highlights Design 3's scalability limitations.

### 3.4.6 Iteration 6: Balanced Uniform (10-9-6-7-8)

**Weighting:** Economic: 20%, Safety: 20%, Risk: 20%, Environmental: 20%, Sustainability: 20%

| Design | Weighted Score |
|---|---|
| Design 1 (NAS) | 8.60 |
| Design 2 (Cloud) | 7.60 |
| Design 3 (Local) | 7.60 |

**Result:** Design 1 clear winner under uniform weighting. Designs 2 and 3 tie for second.

### 3.4.7 Iteration 7: Cost-Minimization (7-9-8-6-10)

**Weighting:** Economic: 40%, Safety: 15%, Risk: 15%, Environmental: 10%, Sustainability: 20%

| Design | Weighted Score |
|---|---|
| Design 1 (NAS) | 8.35 |
| Design 2 (Cloud) | 7.00 |
| Design 3 (Local) | 8.85 |

**Result:** Design 3 wins under extreme cost prioritization. Design 1 remains competitive.

### 3.4.8 Iteration 8: Risk-Averse (8-6-9-10-7)

**Weighting:** Economic: 15%, Safety: 30%, Risk: 10%, Environmental: 20%, Sustainability: 25%

| Design | Weighted Score |
|---|---|
| Design 1 (NAS) | 8.75 |
| Design 2 (Cloud) | 7.65 |
| Design 3 (Local) | 7.30 |

**Result:** Design 1 optimal. Risk-averse profile favors local control and proven reliability.

### 3.4.9 Iteration 9: Cloud-Friendly (9-10-8-6-7)

**Weighting:** Economic: 20%, Safety: 10%, Risk: 20%, Environmental: 30%, Sustainability: 20%

| Design | Weighted Score |
|---|---|
| Design 1 (NAS) | 8.10 |
| Design 2 (Cloud) | 7.90 |
| Design 3 (Local) | 7.50 |

**Result:** Design 1 survives even under cloud-favorable weighting due to constraint violations by Design 2.

### 3.4.10 Iteration 10: Operations-Focused (7-10-9-6-8)

**Weighting:** Economic: 15%, Safety: 25%, Risk: 20%, Environmental: 10%, Sustainability: 30%

| Design | Weighted Score |
|---|---|
| Design 1 (Hybrid) | 8.90 |
| Design 2 (Cloud) | 7.55 |
| Design 3 (Local) | 7.10 |

4. **Minimum Margin of Victory:** Design 1's smallest margin occurs in Iteration 1 (economic-focused: 8.60 vs 8.50), a difference of only 0.10 points. However, this scenario unrealistically weights economics at 35% while downweighting security to 25% and sustainability to 10%, contrary to institutional priorities.

5. **Maximum Margin of Victory:** Design 1's largest margin occurs in Iteration 2 (security-focused: 9.05 vs 7.60), a difference of 1.45 points. This scenario aligns well with institutional context where data protection represents paramount concern.

6. **Stability Analysis:** The standard deviation of Design 1's weighted scores across all iterations is 0.24, compared to 0.35 for Design 2 and 0.69 for Design 3. Design 1's lower variability indicates consistent performance across diverse criteria weightings, while Design 3's high variability reflects extreme sensitivity to economic weighting.

7. **Constraint Violation Impact:** Design 2's hard constraint violation (local storage requirement) effectively eliminates it from consideration regardless of weighted score. Even achieving a hypothetically higher numeric score would not overcome the binary compliance failure.

The sensitivity analysis validates the design selection methodology and confirms that Design 1 represents a robust choice resilient to variations in stakeholder priorities. The decision would require extraordinary circumstances (cost prioritization exceeding 35%, complete disregard for security below 20%) to justify alternative selections, scenarios inconsistent with educational institution contexts and Philippine data governance environment.

This thorough trade-off analysis and sensitivity assessment provide confidence that INTRAK's NAS-based storage architecture appropriately serves the Computer Engineering Department's OJT management requirements within project constraints.
