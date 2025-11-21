# DOCX Template Placeholders

Here are the placeholders you need to use in your Word documents (`.docx`) for the export features to work correctly.

## 1. Weekly Report Template
**File:** `17 INTERNSHIP WEEKLY REPORT_2024.docx`

### Header Info
- `{student_name}`
- `{instructor_name}`
- `{company_name}`
- `{job_description}`
- `{start_date}`
- `{end_date}`
- `{total_hours}`

### Weekly Data (Weeks 1-7)
For each week, use these specific placeholders:

| Week | Date Range | Tasks Accomplished | Knowledge/Skills Learned |
|------|------------|-------------------|--------------------------|
| 1 | `{week_1_date_range}` | `{week_1_tasks}` | `{week_1_learned}` |
| 2 | `{week_2_date_range}` | `{week_2_tasks}` | `{week_2_learned}` |
| 3 | `{week_3_date_range}` | `{week_3_tasks}` | `{week_3_learned}` |
| 4 | `{week_4_date_range}` | `{week_4_tasks}` | `{week_4_learned}` |
| 5 | `{week_5_date_range}` | `{week_5_tasks}` | `{week_5_learned}` |
| 6 | `{week_6_date_range}` | `{week_6_tasks}` | `{week_6_learned}` |
| 7 | `{week_7_date_range}` | `{week_7_tasks}` | `{week_7_learned}` |

---

## 2. DTR / Timeframe Template
**File:** `14 INTERNSHIP TIMEFRAME_2024.docx`

### Student & Company Info
- `{student_name}`
- `{year_and_course}` (e.g., "BSIT – 4th YEAR")
- `{year}` (e.g., "4th YEAR")
- `{course}` (e.g., "BSIT")
- `{company_name}`
- `{company_address}`
- `{number_of_hours}` (Total hours)
- `{instructor_name}`
- `{date_started}`
- `{date_ended}`
- `{period_from}`
- `{period_to}`

### Attendance Table (Loop)
To list all attendance logs, you must use a loop.
**Start Loop:** `{#attendance_logs}`
**End Loop:** `{/attendance_logs}`

Inside the loop rows:
- `{date}`
- `{day}`
- `{hours}`

**Example Table Row:**
| Date | Day | Hours |
|------|-----|-------|
| `{#attendance_logs}{date}` | `{day}` | `{hours}{/attendance_logs}` |

---

## 3. Evaluation Form Template
**File:** `11 INTERNSHIP EVALUATION FORM_2024.docx`

### General Info
- `{student_name}`
- `{company_name}`
- `{company_address}`
- `{date_started}`
- `{date_ended}`
- `{evaluator_name}`
- `{evaluator_position}`
- `{supervisor_name}`
- `{supervisor_position}`
- `{ojt_grade}`

### Competencies (Rating 1-5)
For each category, use the placeholder corresponding to the rating (5, 4, 3, 2, 1). The system will put an "X" in the matching box.

| Category | 5 | 4 | 3 | 2 | 1 | Remarks |
|----------|---|---|---|---|---|---------|
| Ability to Learn | `{ability_to_learn_5}` | `{ability_to_learn_4}` | `{ability_to_learn_3}` | `{ability_to_learn_2}` | `{ability_to_learn_1}` | `{ability_to_learn_remarks}` |
| Work Attitude | `{work_attitude_5}` | `{work_attitude_4}` | `{work_attitude_3}` | `{work_attitude_2}` | `{work_attitude_1}` | `{work_attitude_remarks}` |
| Conduct | `{conduct_5}` | `{conduct_4}` | `{conduct_3}` | `{conduct_2}` | `{conduct_1}` | `{conduct_remarks}` |
| Motivation | `{motivation_5}` | `{motivation_4}` | `{motivation_3}` | `{motivation_2}` | `{motivation_1}` | `{motivation_remarks}` |
| Quality of Work | `{quality_5}` | `{quality_4}` | `{quality_of_work_3}` | `{quality_2}` | `{quality_1}` | `{quality_remarks}` |
| Quantity of Work | `{quantity_of_work_5}` | `{quantity_of_work_4}` | `{quantity_of_work_3}` | `{quantity_of_work_2}` | `{quantity_of_work_1}` | `{quantity_of_work_remarks}` |
| Safety Practices | `{safety_practice_5}` | `{safety_practice_4}` | `{safety_practice_3}` | `{safety_practice_2}` | `{safety_practice_1}` | `{safety_practice_remarks}` |
| Appearance | `{apperance_5}` | `{apperance_4}` | `{apperance_3}` | `{apperance_2}` | `{apperance_1}` | `{apperance_remarks}` |

### Termination / Checkboxes
These will be marked with an "X" if selected.
- `{termination_lack_of_work}`
- `{termination_violation_rules}`
- `{termination_unfavorable_habits}`
- `{termination_altercation}`
- `{termination_absences_tardiness}`
- `{termination_disrespectful}`
- `{termination_no_interest}`
- `{termination_other}` (Specify: `{termination_other_specify}`)
- `{future_employment}`
- `{needs_improvement}`
