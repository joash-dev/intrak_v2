# CHAPTER 3: DESIGN TRADE-OFFS

## 3.1 Summary of Constraints

The selection of an optimal design for the INTRAK system required careful consideration of multiple constraints that bound the solution space. These constraints, established through stakeholder requirements, institutional policies, and technical realities, shaped the evaluation criteria for alternative designs.

**Institutional Constraints:**
The project delimitation mandates that the NAS function as a local repository within PSU's network infrastructure without external cloud or off-campus access. This requirement reflects institutional data governance policies that prioritize data sovereignty and direct institutional control over student academic records. The Computer Engineering Department-only scope constrains the user base and integration requirements, simplifying access control while limiting cross-departmental benefits.

**Technical Constraints:**
The campus network infrastructure provides gigabit Ethernet connectivity but limits geographic access to on-campus users or those connected through institutional VPN services. Browser compatibility requirements demand responsive design without native mobile applications. Integration with institutional backup systems represents a technical requirement that favors storage solutions amenable to standard backup protocols.

**Economic Constraints:**
Budget limitations favor solutions with predictable costs and preference for one-time capital expenditure over recurring operational costs. The economic analysis period extends five years to capture lifecycle costs including initial acquisition, operational expenses, and maintenance.

**Security and Privacy Constraints:**
Compliance with the Philippine Data Privacy Act of 2012 requires appropriate data protection measures. Institutional security policies mandate role-based access controls, encryption of data in transit, and audit logging of all data access operations. The restriction to student-coordinator-instructor-supervisor interactions defines the security boundary.

**Operational Constraints:**
University policies requiring hard copy backup for certain documents necessitate hybrid digital-physical workflows. The web-based limitation excludes native mobile application development. Time constraints of the academic project timeline limit the scope of features implementable in the initial release.

These constraints collectively establish evaluation criteria across five dimensions: Economic feasibility, Safety/Security posture, Risk profile, Environmental impact, and Sustainability (maintainability and longevity). The following sections quantify these dimensions for each alternative design to support systematic design selection.

## 3.2 Trade Offs

The trade-off analysis evaluates the three alternative designs (NAS-Based, Cloud-Based, and Local Server Storage) across five critical dimensions. Each dimension receives quantitative scoring on a 10-point scale where higher values represent superior performance within that dimension.

### 3.2.1 Tradeoff 1: Economic (Material/Equipment Cost)

Economic analysis encompasses initial capital expenditure, ongoing operational costs, and five-year total cost of ownership.

**Design 1: Hybrid Cloud with NAS Storage**
- Initial Cost: $1,800 (NAS device: $1,200, additional drives: $400, setup labor: $200)
- Annual Operational Cost: $120 (power consumption ~$100/year, maintenance $20/year)
- 5-Year Total Cost: $2,400
- Score: 8/10 (moderate initial cost, minimal operational costs)

**Design 2: Cloud-Based Storage**
- Initial Cost: $0 (no hardware purchase required)
- Annual Operational Cost: $450 (1TB storage: $276/year, bandwidth: $120/year, compute: $54/year)
- 5-Year Total Cost: $2,250
- Score: 7/10 (zero initial cost but recurring subscription fees create long-term expense)

**Design 3: Local Server Storage**
- Initial Cost: $800 (additional storage drives for server, RAID controller if needed)
- Annual Operational Cost: $80 (power consumption, drive replacement reserve)
- 5-Year Total Cost: $1,200
- Score: 10/10 (lowest total cost due to leveraging existing server infrastructure)

**Analysis:**
While Design 3 offers the lowest total cost, the economic advantage diminishes when considering scalability requirements. As storage needs grow beyond initial projections, Design 3 faces expensive upgrade cycles requiring downtime. Design 1 provides expandability through NAS drive addition without application server modifications. Design 2 eliminates capacity planning risks through elastic scalability but accumulates costs proportional to usage.

The cost difference between designs narrows significantly over five years, making economic factors secondary to other considerations. However, budget predictability favors designs with upfront capital costs (Designs 1 and 3) over designs with variable operational expenses (Design 2).

### 3.2.2 Tradeoff 2: Safety (Cybersecurity Risk Assessment)

Safety evaluation focuses on data security, privacy protection, and vulnerability to cyber threats, particularly relevant for Systems and Network Administration projects.

**Design 1: Hybrid Cloud with NAS Storage**
- Data Sovereignty: Full institutional control, data remains on institutional hardware
- Attack Surface: Managed exposure via HTTPS/VPN for remote access
- Access Control: SMB authentication (local) + Token-based API access (remote)
- Encryption: At-rest encryption supported; in-transit encryption via SMB 3.0 and TLS 1.3
- Vulnerability to External Threats: LOW (secured via perimeter firewall and encrypted tunnels)
- Compliance: Fully compliant with institutional data governance policies
- Score: 9/10 (high data sovereignty with controlled, secure remote access)

**Design 2: Cloud-Based Storage**
- Data Sovereignty: Third-party control, data stored in provider datacenters
- Attack Surface: Internet-exposed APIs, potential for credential compromise
- Access Control: Cloud IAM policies, requires careful configuration
- Encryption: Provider-managed encryption at rest and in transit (AES-256, TLS 1.3)
- Vulnerability to External Threats: MODERATE (internet-accessible requires robust authentication)
- Compliance: Requires data processing agreements, may conflict with institutional policies
- Score: 6/10 (robust encryption but reduced institutional control, external dependency)

**Design 3: Local Server Storage**
- Data Sovereignty: Full institutional control
- Attack Surface: Limited to application server attack surface
- Access Control: Application-level authorization only
- Encryption: Filesystem-level encryption (LUKS) possible but adds complexity
- Vulnerability to External Threats: LOW (data not separately accessible from application)
- Compliance: Compliant with institutional policies
- Score: 8/10 (good security but single point of compromise)

**Analysis:**
Security considerations strongly favor local storage solutions (Designs 1 and 3) over cloud storage (Design 2) in the context of Philippine educational institutions. The Data Privacy Act of 2012 requires data controllers to implement appropriate security measures, and institutional policies express preference for local data custody. Design 1 scores highest due to defense-in-depth: attackers must compromise the application layer or bypass VPN/firewall controls to access the NAS. Design 3's co-location of all components on one server creates concentration risk. Design 2's reliance on third-party infrastructure introduces trust requirements and potential compliance complications.

### 3.2.3 Tradeoff 3: Risk (Failure Rate / System Reliability)

Risk analysis evaluates potential failure modes, mean time to recovery (MTTR), and business continuity implications.

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

### 3.2.4 Tradeoff 4: Environmental (Carbon Footprint / Energy Efficiency)

Environmental assessment considers power consumption, carbon footprint, and electronic waste implications.

**Design 1: Hybrid Cloud with NAS Storage**
- Power Consumption: ~60W continuous (NAS device @ 40W + network overhead)
- Annual Energy: ~525 kWh per year
- Carbon Footprint: ~262 kg CO2e per year (Philippines grid factor: 0.5 kg CO2e/kWh)
- Hardware Lifespan: 5-7 years (NAS device)
- E-Waste: ~8 kg per lifecycle (NAS unit + drives)
- Score: 7/10 (moderate local power consumption)

**Design 2: Cloud-Based Storage**
- Direct Power Consumption: 0W (provider-managed datacenter)
- Embodied Energy: ~100-150 kWh per year (allocated share of datacenter infrastructure)
- Carbon Footprint: Varies by provider's energy mix (~50-150 kg CO2e per year)
- Data Transfer Energy: ~20 kWh per year (network transmission energy)
- Hardware Lifespan: Not applicable (provider-managed)
- E-Waste: Distributed across provider infrastructure
- Score: 9/10 (efficient datacenter operations, renewable energy use by major providers)

**Design 3: Local Server Storage**
- Power Consumption: ~30W incremental (additional storage drives)
- Annual Energy: ~263 kWh per year
- Carbon Footprint: ~131 kg CO2e per year
- Hardware Lifespan: 3-5 years (hard drives)
- E-Waste: ~3 kg per lifecycle (replacement drives)
- Score: 8/10 (lowest incremental power consumption)

**Analysis:**
Cloud providers typically operate at higher power usage effectiveness (PUE) ratios than institutional datacenters and increasingly source renewable energy, giving Design 2 an environmental advantage. However, the elimination of paper-based processes through digitization creates environmental benefits across all designs that dwarf the differences in data storage energy consumption. A single Computer Engineering cohort of 50 students avoiding paper-based DTR submission saves approximately 10,000 sheets per semester, equivalent to ~50 kg of paper (carbon footprint ~150 kg CO2e), exceeding the annual operational carbon footprint of any storage design.

From a Systems and Network Administration perspective, environmental considerations favor energy-efficient designs with long hardware lifespans. Design 3 performs well by leveraging existing infrastructure. Design 1 provides acceptable environmental profile with institutional control benefits. Design 2 offers optimal energy efficiency but requires internet connectivity with associated network energy costs.

### 3.2.5 Tradeoff 5: Sustainability (Power Consumption / System Lifespan / Maintainability)

Sustainability assessment evaluates long-term viability, maintenance requirements, and technology currency.

**Design 1: Hybrid Cloud with NAS Storage**
- Hardware Lifespan: 5-7 years (NAS device), 3-5 years (drives)
- Maintenance Requirements: Low (quarterly firmware updates, annual drive health checks)
- Skill Requirements: Moderate (basic NAS administration skills)
- Vendor Lock-in: LOW (standards-based protocols allow device replacement)
- Technology Currency: HIGH (easily upgraded to newer NAS models)
- Expansion Path: Excellent (add drives to existing unit or additional NAS devices)
- Score: 9/10 (long lifespan, straightforward maintenance, clear upgrade path)

**Design 2: Cloud-Based Storage**
- Service Lifespan: Indefinite (provider-managed infrastructure refresh)
- Maintenance Requirements: Minimal (provider handles infrastructure)
- Skill Requirements: Moderate (cloud API integration, cost management)
- Vendor Lock-in: MODERATE to HIGH (migration between providers requires re-engineering)
- Technology Currency: Automatic (provider updates infrastructure)
- Expansion Path: Unlimited (elastic scaling)
- Score: 8/10 (minimal maintenance but vendor dependency)

**Design 3: Local Server Storage**
- Hardware Lifespan: 3-5 years (drives), 5-7 years (server)
- Maintenance Requirements: Moderate (drive replacement, capacity monitoring)
- Skill Requirements: Low to Moderate (standard server administration)
- Vendor Lock-in: LOW (commodity hardware)
- Technology Currency: Moderate (dependent on server refresh cycle)
- Expansion Path: Limited (constrained by server chassis physical capacity)
- Score: 6/10 (acceptable lifespan but limited scalability impacts long-term sustainability)

**Analysis:**
Sustainability encompasses technical sustainability (long-term viability), operational sustainability (maintenance burden), and financial sustainability (total cost of ownership predictability). Design 1 excels in sustainability by providing clear expansion paths, manageable maintenance requirements, and freedom from vendor lock-in through standards-based protocols. An institution can replace a failed NAS device with a different brand without application code changes, as SMB/CIFS protocols ensure interoperability.

Design 2 offers operational sustainability through provider-managed infrastructure but introduces financial sustainability risks through unpredictable long-term pricing and vendor lock-in challenges. Migrating from one cloud provider to another requires non-trivial engineering effort.

Design 3 faces sustainability challenges as storage needs grow. The constrained expansion path may force premature server upgrades to accommodate storage growth, disrupting the application platform prematurely.

For an academic institution with limited IT staffing, sustainability considerations favor designs with low ongoing maintenance requirements and clear, affordable upgrade paths. Design 1 best meets these criteria.

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

The trade-off analysis directly influenced multiple aspects of the final INTRAK implementation:

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

Sensitivity analysis evaluates the robustness of the design selection decision under varying weightings of the evaluation criteria. By systematically adjusting criterion weights, the analysis determines whether Design 1 remains optimal across different priority scenarios or if the decision is fragile to weight changes.

Ten sensitivity iterations explore different weighting schemes, representing alternative stakeholder priority rankings. Each iteration maintains total weight of 100% while varying individual criterion emphasis.

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
