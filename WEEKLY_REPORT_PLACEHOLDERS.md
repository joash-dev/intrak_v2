# Weekly Report Template Placeholders

## Template File
**File Name:** `17 INTERNSHIP WEEKLY REPORT_2024.docx`  
**Location:** `server/src/templates/`

## Placeholders to Use in the Word Template

### Student Information
- `${student_name}` - Student's full name (UPPERCASE)
- `${instructor_name}` - Instructor's full name (UPPERCASE)
- `${company_name}` - Company name (UPPERCASE)
- `${job_description}` - Job description/position (UPPERCASE)
- `${start_date}` - Internship start date (e.g., "JUNE 17, 2025")
- `${end_date}` - Internship end date (e.g., "JUNE 27, 2025")
- `${total_hours}` - Total required hours (e.g., "240 HOURS")

### Week Data (7 weeks total)
For each week (1-7), use these placeholders:

- `${week_1_date_range}` - Date range for Week 1 (e.g., "June 17 – June 20, 2025")
- `${week_1_tasks}` - Tasks accomplished for Week 1
- `${week_1_learned}` - Knowledge, skills, values learned for Week 1

- `${week_2_date_range}` - Date range for Week 2
- `${week_2_tasks}` - Tasks accomplished for Week 2
- `${week_2_learned}` - Knowledge, skills, values learned for Week 2

- `${week_3_date_range}` - Date range for Week 3
- `${week_3_tasks}` - Tasks accomplished for Week 3
- `${week_3_learned}` - Knowledge, skills, values learned for Week 3

- `${week_4_date_range}` - Date range for Week 4
- `${week_4_tasks}` - Tasks accomplished for Week 4
- `${week_4_learned}` - Knowledge, skills, values learned for Week 4

- `${week_5_date_range}` - Date range for Week 5
- `${week_5_tasks}` - Tasks accomplished for Week 5
- `${week_5_learned}` - Knowledge, skills, values learned for Week 5

- `${week_6_date_range}` - Date range for Week 6
- `${week_6_tasks}` - Tasks accomplished for Week 6
- `${week_6_learned}` - Knowledge, skills, values learned for Week 6

- `${week_7_date_range}` - Date range for Week 7
- `${week_7_tasks}` - Tasks accomplished for Week 7
- `${week_7_learned}` - Knowledge, skills, values learned for Week 7

## Template Structure Example

Based on the image provided, the template should have:

1. **Header Section:**
   - University logo
   - Report title: "INTERNSHIP/PRACTICUM WEEKLY REPORT"
   - Institution name
   - Document ID: "FM-AA-INT-17"

2. **Student Information Section:**
   - NAME OF STUDENT-INTERN: `${student_name}`
   - INTERNSHIP INSTRUCTOR: `${instructor_name}`
   - NAME OF COMPANY: `${company_name}`
   - JOB DESCRIPTION: `${job_description}`
   - START DATE: `${start_date}`
   - END DATE: `${end_date}`
   - NUMBER OF HOURS: `${total_hours}`

3. **Weekly Report Table:**
   - Columns: DATE, TASKS ACCOMPLISHED, KNOWLEDGE, SKILLS, VALUES LEARNED
   - For each week (1-7), populate:
     - DATE column: `${week_X_date_range}`
     - TASKS ACCOMPLISHED column: `${week_X_tasks}`
     - KNOWLEDGE, SKILLS, VALUES LEARNED column: `${week_X_learned}`

## Notes

- All placeholders use `${}` syntax for docxtemplater
- Text fields will be automatically converted to UPPERCASE where specified
- Date fields are formatted as "MONTH DAY, YEAR" (e.g., "JUNE 17, 2025")
- If a week is not filled out, the placeholders will be empty strings
- The template should handle line breaks in the tasks and learned fields

