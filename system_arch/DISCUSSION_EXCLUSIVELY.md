# Discussion: The Term "Exclusively" in the Approved Capstone Scope

> **Note:** This is a draft section for the thesis Discussion chapter. Transfer the final version to your Word document.

---

## Context

Item 8 of the approved capstone project scope states:

> "Cover exclusively the Computer Engineering Department of PSU–Urdaneta City Campus."

This section discusses what "exclusively" means in the context of INTRAK, why this boundary was set, and what it implies for the study.

---

## Meaning of "Exclusively"

The term "exclusively" establishes that INTRAK was designed, developed, tested, and deployed **solely** for the Computer Engineering (CpE) Department of Pangasinan State University (PSU), Urdaneta City Campus. This exclusivity applies to the following dimensions:

1. **Academic Program.** The system is built around the internship requirements, document templates, evaluation forms, and compliance workflow specific to the BS Computer Engineering program. Other departments (e.g., Information Technology, Electrical Engineering, or non-engineering programs) have their own internship procedures, forms, and coordinators that are not represented in the system.

2. **Campus.** The system targets PSU–Urdaneta City Campus only. Other PSU campuses (e.g., Lingayen, Alaminos, Bayambang) are not included. Network infrastructure, NAS deployment, and user accounts are scoped to this single campus.

3. **User Base.** All user accounts — students, instructors, coordinators, industry partners, and administrators — belong to or are associated with the CpE department of PSU–Urdaneta. The role-based access model and program field (fixed to "Computer Engineering") reflect this restriction.

4. **Data and Records.** Student records, company partnerships, MOA documents, attendance logs, and evaluations stored in the system pertain exclusively to CpE interns. The system does not aggregate or share data with other departments.

---

## Rationale for Exclusive Scope

The decision to limit the system exclusively to one department and one campus was based on the following considerations:

1. **Focused Requirements Gathering.** Working with a single department allowed the development team to conduct thorough requirements analysis with the actual stakeholders — CpE coordinators, instructors, industry partners, and students — ensuring the system accurately reflects real workflows rather than generalized assumptions.

2. **Controlled Testing and Validation.** Limiting scope to one department enabled rigorous testing with actual users in a known environment, providing reliable results for validation and evaluation.

3. **Resource Constraints.** As a capstone project, development time, team size, and infrastructure resources were limited. Supporting multiple departments or campuses would have required additional coordination with multiple sets of stakeholders, varying document requirements, and different approval workflows — all beyond the practical scope of the project timeline.

4. **Consistent Document Standards.** The CpE department uses specific PSU forms (e.g., Form 11 for internship evaluation, Form 18 for supervisor feedback, Form 19b for agency self-evaluation) and a defined set of pre-deployment documents. Building the system around these exact documents ensures accuracy and usability. Other departments may use different forms, phases, or compliance criteria.

5. **NAS and Deployment Feasibility.** The NAS-based document storage was planned for deployment within the CpE department's network at PSU–Urdaneta. Extending to other campuses would require separate NAS hardware, network configuration, and administration at each location.

---

## Implications

1. **Not a limitation of the technology.** The exclusive scope is a project boundary, not a technical constraint. The system architecture (role-based access, configurable document types, company management) could be adapted for other departments or campuses with additional configuration and stakeholder requirements gathering.

2. **Generalizability.** While the system is exclusive to CpE at PSU–Urdaneta, the underlying design patterns — document compliance tracking, attendance verification, multi-role approval workflows, and evaluation management — are applicable to other internship programs. Future work could extend the system to support multiple departments by adding department-specific configurations.

3. **Evaluation validity.** Results from user acceptance testing, usability evaluation, and performance testing reflect the CpE department context. Findings may not directly transfer to departments with significantly different internship structures, but the methodology and system design remain relevant as a reference implementation.

---

## Summary

The term "exclusively" in the approved scope defines a clear boundary: INTRAK serves only the Computer Engineering Department of PSU–Urdaneta City Campus. This boundary was set intentionally to ensure focused development, accurate requirements, controlled testing, and feasible deployment within the constraints of a capstone project. It does not reflect a technical limitation of the system, and future iterations could expand coverage to additional departments or campuses.
