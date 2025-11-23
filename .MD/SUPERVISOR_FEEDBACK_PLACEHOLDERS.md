# Training Supervisor's Feedback Form Placeholders

**Template File:** `18 TRAINING SUPERVISOR_S FEEDBACK FORM_2024.docx`  
**Location:** `server/src/templates/`  
**Form ID:** FM-AA-INT-18

## Overview
This document contains all available placeholders for the Training Supervisor's Feedback Form template. The form is used by training supervisors to provide feedback on student-intern performance.

## Available Placeholders

### Header Information
- `${supervisor_name}` - Name of the training supervisor
- `${department}` - Department name
- `${company_name}` - Company/agency name
- `${student_name}` - Name of the student-intern

### Evaluation Criteria (Checkmark System)
Each criterion has 5 placeholders (one for each rating column). The system will place a ✓ in the appropriate column:

#### 1. Punctuality and Attendance
- `${punctual_strongly_agree}` - ✓ if rating is 5
- `${punctual_agree}` - ✓ if rating is 4
- `${punctual_neither}` - ✓ if rating is 3
- `${punctual_disagree}` - ✓ if rating is 2
- `${punctual_strongly_disagree}` - ✓ if rating is 1

#### 2. Knowledge Contribution
- `${knowledge_strongly_agree}` - ✓ if rating is 5
- `${knowledge_agree}` - ✓ if rating is 4
- `${knowledge_neither}` - ✓ if rating is 3
- `${knowledge_disagree}` - ✓ if rating is 2
- `${knowledge_strongly_disagree}` - ✓ if rating is 1

#### 3. Teamwork
- `${teamwork_strongly_agree}` - ✓ if rating is 5
- `${teamwork_agree}` - ✓ if rating is 4
- `${teamwork_neither}` - ✓ if rating is 3
- `${teamwork_disagree}` - ✓ if rating is 2
- `${teamwork_strongly_disagree}` - ✓ if rating is 1

#### 4. Task Performance
- `${task_performance_strongly_agree}` - ✓ if rating is 5
- `${task_performance_agree}` - ✓ if rating is 4
- `${task_performance_neither}` - ✓ if rating is 3
- `${task_performance_disagree}` - ✓ if rating is 2
- `${task_performance_strongly_disagree}` - ✓ if rating is 1

#### 5. Policy Compliance
- `${policy_compliance_strongly_agree}` - ✓ if rating is 5
- `${policy_compliance_agree}` - ✓ if rating is 4
- `${policy_compliance_neither}` - ✓ if rating is 3
- `${policy_compliance_disagree}` - ✓ if rating is 2
- `${policy_compliance_strongly_disagree}` - ✓ if rating is 1

#### 6. Conduct
- `${conduct_strongly_agree}` - ✓ if rating is 5
- `${conduct_agree}` - ✓ if rating is 4
- `${conduct_neither}` - ✓ if rating is 3
- `${conduct_disagree}` - ✓ if rating is 2
- `${conduct_strongly_disagree}` - ✓ if rating is 1

#### 7. Desirable Traits
- `${traits_strongly_agree}` - ✓ if rating is 5
- `${traits_agree}` - ✓ if rating is 4
- `${traits_neither}` - ✓ if rating is 3
- `${traits_disagree}` - ✓ if rating is 2
- `${traits_strongly_disagree}` - ✓ if rating is 1

### Additional Information
- `${comments}` - Other comments and suggestions
- `${supervisor_signature}` - Signature of training supervisor (placeholder)
- `${date}` - Date of evaluation

## Rating Scale
- **5** - Strongly Agree
- **4** - Agree
- **3** - Neither Agree nor Disagree
- **2** - Disagree
- **1** - Strongly Disagree

## Template Structure Example
```
TRAINING SUPERVISOR'S FEEDBACK FORM
PANGASINAN STATE UNIVERSITY
URDANETA Campus

NAME OF TRAINING SUPERVISOR: ${supervisor_name}
DEPARTMENT: ${department}
COMPANY NAME: ${company_name}
NAME OF STUDENT-INTERN: ${student_name}

CRITERIA                                                    | Rating |
-----------------------------------------------------------|--------|
The student-trainee is punctual in attending works...      | ${punctual_rating}
The student-trainee has sufficient knowledge...            | ${knowledge_rating}
The student-trainee knows how to work with the group.      | ${teamwork_rating}
The student-trainee performs tasks as prescribed...        | ${task_performance_rating}
The student-trainee follows and abides with policies...    | ${policy_compliance_rating}
The student-trainee maintains an upright conduct...        | ${conduct_rating}
The student-trainee shows desirable traits...              | ${traits_rating}

OTHER COMMENTS AND SUGGESTIONS:
${comments}

Signature of Training Supervisor: _________________
Date: ${date}
```

## Notes
- All rating placeholders expect numeric values (1-5)
- The template uses a table structure for the criteria
- Comments field supports multi-line text
- Date should be formatted as needed (e.g., "November 21, 2025")
