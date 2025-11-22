# Form 19b - Evaluation Instrument of PSU Partner Agencies (Self Ratee) Placeholders

**Template File:** `19b Evaluation Instrument of PSU Partner Agencies (Self Ratee)_2024.docx`  
**Location:** `server/src/templates/`  
**Form ID:** FM-AA-INT-19b

## Overview
This document contains all available placeholders for the Evaluation Instrument of PSU Partner Agencies (Self Ratee) template. The form is used by agencies/companies to self-evaluate their partnership and training program.

## Available Placeholders

### Header Information
- `${name}` or `${supervisor_name}` - Name of the supervisor (evaluator/representative of HTE) - **This comes from the supervisor's account**
- `${agency_name}` or `${agency_institution}` or `${company_name}` - **Name of the company/agency/institution** (from supervisor's company - same as company name)
- `${unit_division}` or `${department}` - Unit/Division/Department name (from supervisor's profile)
- `${age}` - Age of supervisor (if available in profile, otherwise optional)
- `${sex}` or `${gender}` - Sex/Gender of supervisor (if available in profile, otherwise optional)
- `${date}` - Date of evaluation (current date when form is filled)

### Type of Rater (Checkmark System)
- `${rater_self_ratee}` - ✓ if rater is "Self Ratee (Representative of HTE)"
- `${rater_faculty}` - ✓ if rater is "Faculty"
- `${rater_student}` - ✓ if rater is "Student"

### Rating Scale
The form uses a 5-point satisfaction scale:
- **5 - Extremely Satisfied**
- **4 - Highly Satisfied**
- **3 - Satisfied**
- **2 - Moderately Satisfied**
- **1 - Not Satisfied**

### Evaluation Criteria (Checkmark System)
Each criterion has 5 placeholders (one for each rating column). The system will place a ✓ in the appropriate column:

#### 1. COMMUNICATION

**1.1 High connectivity through electronic communication:**
- `${communication_connectivity_5}` - ✓ if rating is 5 (Extremely Satisfied)
- `${communication_connectivity_4}` - ✓ if rating is 4 (Highly Satisfied)
- `${communication_connectivity_3}` - ✓ if rating is 3 (Satisfied)
- `${communication_connectivity_2}` - ✓ if rating is 2 (Moderately Satisfied)
- `${communication_connectivity_1}` - ✓ if rating is 1 (Not Satisfied)

**1.2 Management frequently accepts request for dialogue:**
- `${communication_dialogue_5}` - ✓ if rating is 5
- `${communication_dialogue_4}` - ✓ if rating is 4
- `${communication_dialogue_3}` - ✓ if rating is 3
- `${communication_dialogue_2}` - ✓ if rating is 2
- `${communication_dialogue_1}` - ✓ if rating is 1

**1.3 Management willing to participate in university activities:**
- `${communication_participation_5}` - ✓ if rating is 5
- `${communication_participation_4}` - ✓ if rating is 4
- `${communication_participation_3}` - ✓ if rating is 3
- `${communication_participation_2}` - ✓ if rating is 2
- `${communication_participation_1}` - ✓ if rating is 1

#### 2. ETHICAL DEALINGS

**2.1 High reputations and stature of the industry:**
- `${ethical_reputation_5}` - ✓ if rating is 5
- `${ethical_reputation_4}` - ✓ if rating is 4
- `${ethical_reputation_3}` - ✓ if rating is 3
- `${ethical_reputation_2}` - ✓ if rating is 2
- `${ethical_reputation_1}` - ✓ if rating is 1

**2.2 Established Corporate Social Responsibility:**
- `${ethical_csr_5}` - ✓ if rating is 5
- `${ethical_csr_4}` - ✓ if rating is 4
- `${ethical_csr_3}` - ✓ if rating is 3
- `${ethical_csr_2}` - ✓ if rating is 2
- `${ethical_csr_1}` - ✓ if rating is 1

**2.3 Manifested support for mandate and program:**
- `${ethical_support_5}` - ✓ if rating is 5
- `${ethical_support_4}` - ✓ if rating is 4
- `${ethical_support_3}` - ✓ if rating is 3
- `${ethical_support_2}` - ✓ if rating is 2
- `${ethical_support_1}` - ✓ if rating is 1

#### 3. STUDENT SATISFACTION - PSU

**3.1 Assigned Internship/Practicum Supervisor are qualified:**
- `${psu_supervisor_qualified_5}` - ✓ if rating is 5
- `${psu_supervisor_qualified_4}` - ✓ if rating is 4
- `${psu_supervisor_qualified_3}` - ✓ if rating is 3
- `${psu_supervisor_qualified_2}` - ✓ if rating is 2
- `${psu_supervisor_qualified_1}` - ✓ if rating is 1

**3.2 University provides support to various activities:**
- `${psu_support_activities_5}` - ✓ if rating is 5
- `${psu_support_activities_4}` - ✓ if rating is 4
- `${psu_support_activities_3}` - ✓ if rating is 3
- `${psu_support_activities_2}` - ✓ if rating is 2
- `${psu_support_activities_1}` - ✓ if rating is 1

**3.3 Availability of facilities for student-interns:**
- `${psu_facilities_5}` - ✓ if rating is 5
- `${psu_facilities_4}` - ✓ if rating is 4
- `${psu_facilities_3}` - ✓ if rating is 3
- `${psu_facilities_2}` - ✓ if rating is 2
- `${psu_facilities_1}` - ✓ if rating is 1

#### 4. STUDENT SATISFACTION - HOST TRAINING ESTABLISHMENT

**4.1 Partner-agencies provides required supervision:**
- `${hte_supervision_5}` - ✓ if rating is 5
- `${hte_supervision_4}` - ✓ if rating is 4
- `${hte_supervision_3}` - ✓ if rating is 3
- `${hte_supervision_2}` - ✓ if rating is 2
- `${hte_supervision_1}` - ✓ if rating is 1

**4.2 Assigned Host Training Supervisors are qualified:**
- `${hte_supervisor_qualified_5}` - ✓ if rating is 5
- `${hte_supervisor_qualified_4}` - ✓ if rating is 4
- `${hte_supervisor_qualified_3}` - ✓ if rating is 3
- `${hte_supervisor_qualified_2}` - ✓ if rating is 2
- `${hte_supervisor_qualified_1}` - ✓ if rating is 1

**4.3 Provide feedback and coaching activities:**
- `${hte_feedback_5}` - ✓ if rating is 5
- `${hte_feedback_4}` - ✓ if rating is 4
- `${hte_feedback_3}` - ✓ if rating is 3
- `${hte_feedback_2}` - ✓ if rating is 2
- `${hte_feedback_1}` - ✓ if rating is 1

#### 5. QUALITY DELIVERY

**5.1 Timeliness are strictly observed:**
- `${quality_timeliness_5}` - ✓ if rating is 5
- `${quality_timeliness_4}` - ✓ if rating is 4
- `${quality_timeliness_3}` - ✓ if rating is 3
- `${quality_timeliness_2}` - ✓ if rating is 2
- `${quality_timeliness_1}` - ✓ if rating is 1

**5.2 Objectives specified in Internship Plan are met:**
- `${quality_objectives_5}` - ✓ if rating is 5
- `${quality_objectives_4}` - ✓ if rating is 4
- `${quality_objectives_3}` - ✓ if rating is 3
- `${quality_objectives_2}` - ✓ if rating is 2
- `${quality_objectives_1}` - ✓ if rating is 1

**5.3 Adequate resources are made accessible:**
- `${quality_resources_5}` - ✓ if rating is 5
- `${quality_resources_4}` - ✓ if rating is 4
- `${quality_resources_3}` - ✓ if rating is 3
- `${quality_resources_2}` - ✓ if rating is 2
- `${quality_resources_1}` - ✓ if rating is 1

### Signature Section
- `${evaluator_signature}` or `${supervisor_name}` - Signature line (supervisor's name)
- `${evaluator_name}` - Name of evaluator (same as supervisor name)
- `${evaluator_title}` or `${supervisor_position}` - "Self Ratee (Representative of Host Training Establishment)" or supervisor's position/title
- `${signature_date}` - Date signed (current date when form is filled)

## Summary of All Criteria Placeholders

**Total: 15 criteria × 5 ratings each = 75 rating placeholders**

Plus:
- 6 header information placeholders
- 3 rater type placeholders
- 3 signature section placeholders

**Grand Total: 87 placeholders**

## Implementation Notes

1. **Checkmark System:** Similar to Form 18, each criterion will have 5 placeholders, and only the one matching the rating will contain "✓", others will be empty.

2. **Rater Type:** Only one of the three rater type placeholders should be checked (typically "Self Ratee" for this form).

3. **Date Format:** Use standard date format (e.g., "November 21, 2025" or "21 November 2025").

4. **Template Format:** Placeholders should use `${placeholder_name}` format for docxtemplater compatibility.

5. **Data Sources for Backend Implementation:**
   - `${name}` / `${supervisor_name}` - From `req.user.name` (authenticated supervisor)
   - `${agency_name}` / `${agency_institution}` / `${company_name}` - **From supervisor's company name** (`req.user.company?.name` or supervisor's associated company name - same as company name used in other forms)
   - `${unit_division}` / `${department}` - From supervisor's profile (`req.user.department`)
   - `${age}` - From supervisor's profile (if available, otherwise optional/empty)
   - `${sex}` / `${gender}` - From supervisor's profile (if available, otherwise optional/empty)
   - `${date}` - Current date when form is submitted
   - `${evaluator_title}` / `${supervisor_position}` - From supervisor's profile (`req.user.position`) or default to "Self Ratee (Representative of Host Training Establishment)"

