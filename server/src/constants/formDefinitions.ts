/**
 * Form definitions for each document type that has an HTML template.
 * Maps document type → template file + form fields with auto-fill keys.
 */

export interface FormField {
  name: string;           // Variable name in template (e.g., 'student_name')
  label: string;          // Display label (e.g., 'Student Name')
  type: 'text' | 'date' | 'number' | 'textarea' | 'select' | 'image';
  required: boolean;
  autoFillKey?: string;   // Key to auto-fill from student data (null = user must fill)
  placeholder?: string;
  options?: { value: string; label: string }[]; // For select type
  section?: string;       // Group label for form layout
  repeatGroup?: string;   // Group key for repeatable rows (e.g., 'work_experience')
  repeatIndex?: number;   // 1-based index within the repeat group
  repeatMax?: number;     // Max number of rows in the repeat group (only needed on first field)
  /** Used when type === 'number' (HTML min / validation). */
  min?: number;
  max?: number;
  step?: number | string;
}

export interface FormDefinition {
  documentType: string;
  templateFile: string;
  title: string;
  description: string;
  fields: FormField[];
}

// Which document types have HTML templates (Fill Up flow)
export const FORM_DOCUMENT_TYPES = [
  'APPLICATION_INTERNSHIP',
  'RECORD_FILE',
  'CERTIFICATION_UNITS',
  'INTERNSHIP_RESUME',
  'CONSENT_FORM',
  'ENDORSEMENT_LETTER',
  'ENDORSEMENT_LETTER_MULTI',
  'INTERNSHIP_RELEASE',
  'STUDENT_FEEDBACK',
  'INTERNSHIP_AGREEMENT',
  'TRAINING_AGREEMENT',
] as const;

export type FormDocumentType = (typeof FORM_DOCUMENT_TYPES)[number];

export const hasFormTemplate = (type: string): boolean => {
  return FORM_DOCUMENT_TYPES.includes(type as FormDocumentType);
};

/**
 * Auto-fill key mappings:
 * - student_name     → User.name
 * - campus           → 'Urdaneta City' (from coordinator settings)
 * - course / program → Student.program
 * - total_hours      → Student.totalHours
 * - company_name     → Company.name
 * - company_address  → Company.address
 * - email            → User.email
 * - student_number   → Student.studentNumber
 * - date             → current date
 */

export const formDefinitions: Record<string, FormDefinition> = {
  // ========== CONSENT FORM ==========
  CONSENT_FORM: {
    documentType: 'CONSENT_FORM',
    templateFile: 'consent_form.html',
    title: 'Consent Form',
    description: 'FM-AA-INT-03 — Consent and declaration form for internship',
    fields: [
      // Auto-filled
      { name: 'campus', label: 'Campus', type: 'text', required: true, autoFillKey: 'campus', section: 'University Details' },
      { name: 'student_name', label: 'Full Name', type: 'text', required: true, autoFillKey: 'student_name', section: 'Student Information' },
      { name: 'course', label: 'Course / Program', type: 'text', required: true, autoFillKey: 'course', section: 'Student Information' },
      { name: 'total_hours', label: 'Total Hours Required', type: 'number', required: true, autoFillKey: 'total_hours', section: 'Internship Details' },
      { name: 'company_name', label: 'Company / Agency Name', type: 'text', required: true, autoFillKey: 'company_name', section: 'Company Details' },
      { name: 'coordinator_name', label: 'Campus Internship Coordinator', type: 'text', required: false, autoFillKey: 'coordinator_name', section: 'Signatories' },
      { name: 'campus_exec_director', label: 'Campus Executive Director', type: 'text', required: false, autoFillKey: 'campus_exec_director', section: 'Signatories' },
      { name: 'parent_guardian', label: 'Parent/Guardian Name', type: 'text', required: false, autoFillKey: 'parent_guardian', section: 'Signatories' },
      // Manual
      { name: 'address', label: 'Residential Address', type: 'text', required: true, section: 'Student Information', placeholder: 'e.g., Brgy. San Vicente, Urdaneta City, Pangasinan' },
      { name: 'signed_location', label: 'Signed At (Location)', type: 'text', required: false, section: 'Signing Details', placeholder: 'e.g., Urdaneta City' },
      { name: 'signed_date', label: 'Date Signed', type: 'date', required: false, section: 'Signing Details' },
      { name: 'res_cert_no', label: 'Community Tax Certificate No.', type: 'text', required: false, section: 'Certificate Details', placeholder: 'Certificate number' },
      { name: 'res_cert_issued_at', label: 'Issued At', type: 'text', required: false, section: 'Certificate Details', placeholder: 'e.g., Urdaneta City' },
      { name: 'res_cert_issued_on', label: 'Issued On', type: 'date', required: false, section: 'Certificate Details' },
    ],
  },

  // ========== ENDORSEMENT LETTER ==========
  ENDORSEMENT_LETTER: {
    documentType: 'ENDORSEMENT_LETTER',
    templateFile: 'endorsement_letter.html',
    title: 'Endorsement Letter',
    description: 'FM-AA-INT-05 — Endorsement letter for internship deployment',
    fields: [
      { name: 'campus', label: 'Campus', type: 'text', required: true, autoFillKey: 'campus', section: 'University Details' },
      { name: 'student_name', label: 'Full Name', type: 'text', required: true, autoFillKey: 'student_name', section: 'Student Information' },
      { name: 'course', label: 'Course / Program', type: 'text', required: true, autoFillKey: 'course', section: 'Student Information' },
      { name: 'company_name', label: 'Company / Agency Name', type: 'text', required: true, autoFillKey: 'company_name', section: 'Company Details' },
      { name: 'company_address', label: 'Company Address', type: 'text', required: true, autoFillKey: 'company_address', section: 'Company Details' },
      { name: 'date', label: 'Date', type: 'date', required: true, autoFillKey: 'date', section: 'Letter Details' },
      { name: 'company_head', label: 'Company Head / Manager Name', type: 'text', required: true, section: 'Company Details', placeholder: 'Name of the person to address' },
      { name: 'company_head_title', label: 'Company Head Title', type: 'text', required: false, section: 'Company Details', placeholder: 'e.g., HR Manager, CEO' },
      { name: 'degree', label: 'Degree', type: 'text', required: true, autoFillKey: 'course', section: 'Student Information' },
      { name: 'campus_exec_director', label: 'Campus Executive Director', type: 'text', required: false, autoFillKey: 'campus_exec_director', section: 'Signatories' },
    ],
  },

  // ========== ENDORSEMENT LETTER (MULTIPLE STUDENTS) ==========
  ENDORSEMENT_LETTER_MULTI: {
    documentType: 'ENDORSEMENT_LETTER_MULTI',
    templateFile: 'endorsement_letter_multi.html',
    title: 'Endorsement Letter (Multiple Students)',
    description: 'FM-AA-INT-05 — Endorsement letter for multiple students applying to the same company',
    fields: [
      { name: 'campus', label: 'Campus', type: 'text', required: true, autoFillKey: 'campus', section: 'University Details' },
      { name: 'course', label: 'Course / Program', type: 'text', required: true, autoFillKey: 'course', section: 'Student Information' },
      { name: 'company_name', label: 'Company / Agency Name', type: 'text', required: true, autoFillKey: 'company_name', section: 'Company Details' },
      { name: 'company_address', label: 'Company Address', type: 'text', required: true, autoFillKey: 'company_address', section: 'Company Details' },
      { name: 'date', label: 'Date', type: 'date', required: true, autoFillKey: 'date', section: 'Letter Details' },
      { name: 'company_head', label: 'Company Head / Manager Name', type: 'text', required: true, section: 'Company Details', placeholder: 'Name of the person to address' },
      { name: 'degree', label: 'Degree', type: 'text', required: true, autoFillKey: 'course', section: 'Student Information' },
      { name: 'campus_exec_director', label: 'Campus Executive Director', type: 'text', required: false, autoFillKey: 'campus_exec_director', section: 'Signatories' },
      // selected_students is handled specially by the frontend (student picker) — stored as JSON string of student names
      { name: 'selected_students', label: 'Students', type: 'textarea', required: true, section: 'Students' },
    ],
  },

  // ========== INTERNSHIP RELEASE ==========
  INTERNSHIP_RELEASE: {
    documentType: 'INTERNSHIP_RELEASE',
    templateFile: 'internship_release.html',
    title: 'Internship Release Form',
    description: 'FM-AA-INT-12 — Release form for internship deployment',
    fields: [
      { name: 'campus', label: 'Campus', type: 'text', required: true, autoFillKey: 'campus', section: 'University Details' },
      { name: 'date', label: 'Date', type: 'date', required: true, autoFillKey: 'date', section: 'Form Details' },
      { name: 'surname', label: 'Surname', type: 'text', required: true, autoFillKey: 'surname', section: 'Student Information' },
      { name: 'given_name', label: 'Given Name', type: 'text', required: true, autoFillKey: 'given_name', section: 'Student Information' },
      { name: 'middle_name', label: 'Middle Name', type: 'text', required: false, autoFillKey: 'middle_name', section: 'Student Information' },
      { name: 'course', label: 'Course / Program', type: 'text', required: true, autoFillKey: 'course', section: 'Student Information' },
      { name: 'major', label: 'Major / Specialization', type: 'text', required: false, section: 'Student Information', placeholder: 'e.g., Web Development' },
      { name: 'total_hours', label: 'Total Hours', type: 'number', required: true, autoFillKey: 'total_hours', section: 'Internship Details' },
      { name: 'start_month', label: 'Start Month', type: 'text', required: true, autoFillKey: 'start_month', section: 'Internship Details', placeholder: 'e.g., June' },
      { name: 'start_year', label: 'Start Year', type: 'text', required: true, autoFillKey: 'start_year', section: 'Internship Details', placeholder: 'e.g., 2026' },
      { name: 'end_month', label: 'End Month', type: 'text', required: true, autoFillKey: 'end_month', section: 'Internship Details', placeholder: 'e.g., September' },
      { name: 'end_year', label: 'End Year', type: 'text', required: true, autoFillKey: 'end_year', section: 'Internship Details', placeholder: 'e.g., 2026' },
      { name: 'company_name', label: 'Company / Agency Name', type: 'text', required: true, autoFillKey: 'company_name', section: 'Company Details' },
      { name: 'company_address', label: 'Company Address', type: 'text', required: true, autoFillKey: 'company_address', section: 'Company Details' },
      // Signature Fields
      { name: 'instructor_name', label: 'Internship/Practicum Subject Instructor', type: 'text', required: false, autoFillKey: 'instructor_name', section: 'Signatures' },
      { name: 'coordinator_name', label: 'Campus Internship Coordinator', type: 'text', required: false, autoFillKey: 'coordinator_name', section: 'Signatures' },
      { name: 'campus_exec_director', label: 'Campus Executive Director', type: 'text', required: false, section: 'Noted By', placeholder: 'Name of Campus Executive Director' },
    ],
  },

  // ========== APPLICATION FOR INTERNSHIP ==========
  APPLICATION_INTERNSHIP: {
    documentType: 'APPLICATION_INTERNSHIP',
    templateFile: 'application_internship.html',
    title: 'Application for Internship',
    description: 'FM-AA-INT-01 — Application form for internship / practicum',
    fields: [
      // Personal Profile (Section A)
      { name: 'surname', label: 'Surname', type: 'text', required: true, autoFillKey: 'surname', section: 'Personal Information' },
      { name: 'given_name', label: 'Given Name', type: 'text', required: true, autoFillKey: 'given_name', section: 'Personal Information' },
      { name: 'middle_name', label: 'Middle Name', type: 'text', required: false, autoFillKey: 'middle_name', section: 'Personal Information' },
      { name: 'age', label: 'Age', type: 'number', required: true, section: 'Personal Information', placeholder: 'e.g., 21' },
      {
        name: 'civil_status', label: 'Civil Status', type: 'select', required: true, section: 'Personal Information', options: [
          { value: 'Single', label: 'Single' },
          { value: 'Married', label: 'Married' },
          { value: 'Widowed', label: 'Widowed' },
        ]
      },
      {
        name: 'sex', label: 'Sex', type: 'select', required: true, section: 'Personal Information', options: [
          { value: 'Male', label: 'Male' },
          { value: 'Female', label: 'Female' },
        ]
      },
      { name: 'contact_number', label: 'Contact Number', type: 'text', required: true, section: 'Personal Information', placeholder: '09XX-XXX-XXXX' },
      { name: 'course', label: 'Course / Program', type: 'text', required: true, autoFillKey: 'course', section: 'Academic Details' },
      { name: 'year_section', label: 'Year & Section', type: 'text', required: true, autoFillKey: 'year_section', section: 'Academic Details', placeholder: 'e.g., 4-A' },
      { name: 'major', label: 'Major / Specialization', type: 'text', required: false, section: 'Academic Details', placeholder: 'e.g., Computer Engineering' },
      { name: 'parent_guardian', label: 'Parent / Guardian Name', type: 'text', required: true, section: 'Personal Information', placeholder: 'Full name of parent or guardian' },
      { name: 'parent_contact', label: 'Parent / Guardian Contact', type: 'text', required: true, section: 'Personal Information', placeholder: '09XX-XXX-XXXX' },
      { name: 'parent_address', label: 'Parent / Guardian Address', type: 'text', required: true, section: 'Address', placeholder: 'Permanent home address of parent' },
      { name: 'current_address', label: 'Current Address', type: 'text', required: true, section: 'Address', placeholder: 'Current residential address' },
      { name: 'home_address', label: 'Home Address', type: 'text', required: false, section: 'Address', placeholder: 'Permanent home address' },
      // Company (Section C)
      { name: 'company_name', label: 'Company / Agency Name', type: 'text', required: true, autoFillKey: 'company_name', section: 'Company Details' },
      { name: 'company_address', label: 'Company Address', type: 'text', required: true, autoFillKey: 'company_address', section: 'Company Details' },
      { name: 'company_head', label: 'Company Head / Manager', type: 'text', required: false, section: 'Company Details', placeholder: 'Name of company head' },
      { name: 'company_contact', label: 'Company Contact Number', type: 'text', required: false, section: 'Company Details', placeholder: 'Company phone number' },
      { name: 'number_of_hours', label: 'Number of Hours', type: 'number', required: true, autoFillKey: 'total_hours', section: 'Company Details' },
      // Academic subjects for upcoming school year (repeatable rows)
      ...[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].flatMap(i => [
        { name: `acad_sem_${i}`, label: 'Semester', type: 'text' as const, required: false, section: 'Academic Subjects (Next School Year)', placeholder: 'e.g., 1ST / 2ND / SUMMER', repeatGroup: 'acad_subjects', repeatIndex: i, ...(i === 1 ? { repeatMax: 15 } : {}) },
        { name: `acad_sy_${i}`, label: 'School Year', type: 'text' as const, required: false, section: 'Academic Subjects (Next School Year)', placeholder: 'e.g., 2026-2027', repeatGroup: 'acad_subjects', repeatIndex: i },
        { name: `acad_subject_${i}`, label: 'Subject', type: 'text' as const, required: false, section: 'Academic Subjects (Next School Year)', placeholder: 'Subject title', repeatGroup: 'acad_subjects', repeatIndex: i },
      ]),
      // Signature / Recommending Approval
      { name: 'instructor_name', label: 'Internship/Practicum Subject Instructor', type: 'text', required: false, autoFillKey: 'instructor_name', section: 'Recommending Approval' },
      { name: 'coordinator_name', label: 'Campus Internship Coordinator', type: 'text', required: false, autoFillKey: 'coordinator_name', section: 'Recommending Approval' },
      { name: 'dept_chair_name', label: 'Department Chair', type: 'text', required: false, section: 'Recommending Approval', placeholder: 'Name of Department Chair' },
      { name: 'college_dean_name', label: 'College Dean', type: 'text', required: false, section: 'Recommending Approval', placeholder: 'Name of College Dean' },
      { name: 'campus_exec_director', label: 'Campus Executive Director', type: 'text', required: false, section: 'Approved By', placeholder: 'Name of Campus Executive Director' },
    ],
  },

  // ========== CERTIFICATION OF UNITS ==========
  CERTIFICATION_UNITS: {
    documentType: 'CERTIFICATION_UNITS',
    templateFile: 'certification_units.html',
    title: 'Certification of Units Earned',
    description: 'FM-AA-INT-02 — Certification of units earned for internship',
    fields: [
      // University Details
      { name: 'campus', label: 'Campus', type: 'text', required: true, autoFillKey: 'campus', section: 'University Details' },

      // Student Information
      { name: 'surname', label: 'Surname', type: 'text', required: true, autoFillKey: 'surname', section: 'Student Information' },
      { name: 'given_name', label: 'Given Name', type: 'text', required: true, autoFillKey: 'given_name', section: 'Student Information' },
      { name: 'middle_name', label: 'Middle Name', type: 'text', required: false, autoFillKey: 'middle_name', section: 'Student Information' },
      { name: 'student_number', label: 'Student Number', type: 'text', required: true, autoFillKey: 'student_number', section: 'Student Information' },
      { name: 'course', label: 'Course / Program', type: 'text', required: true, autoFillKey: 'course', section: 'Student Information' },
      { name: 'major', label: 'Major / Specialization', type: 'text', required: false, section: 'Student Information', placeholder: 'e.g., Web Development' },
      { name: 'year_level', label: 'Year Level', type: 'text', required: true, autoFillKey: 'year_level', section: 'Student Information' },
      { name: 'section', label: 'Section', type: 'text', required: true, autoFillKey: 'section', section: 'Student Information' },

      // ---- FIRST YEAR — 1st Semester (repeatable, start with 1, max 10) ----
      ...[1,2,3,4,5,6,7,8,9,10].flatMap(i => [
        { name: `fy_1s_${i}`, label: `Subject`, type: 'text' as const, required: false, section: 'First Year — 1st Semester', placeholder: 'Subject name', repeatGroup: 'fy_1s', repeatIndex: i, ...(i === 1 ? { repeatMax: 10 } : {}) },
        { name: `fy_1s_${i}_u`, label: `Units`, type: 'number' as const, required: false, section: 'First Year — 1st Semester', placeholder: 'Units', repeatGroup: 'fy_1s', repeatIndex: i },
      ]),
      // ---- FIRST YEAR — 2nd Semester ----
      ...[1,2,3,4,5,6,7,8,9,10].flatMap(i => [
        { name: `fy_2s_${i}`, label: `Subject`, type: 'text' as const, required: false, section: 'First Year — 2nd Semester', placeholder: 'Subject name', repeatGroup: 'fy_2s', repeatIndex: i, ...(i === 1 ? { repeatMax: 10 } : {}) },
        { name: `fy_2s_${i}_u`, label: `Units`, type: 'number' as const, required: false, section: 'First Year — 2nd Semester', placeholder: 'Units', repeatGroup: 'fy_2s', repeatIndex: i },
      ]),
      { name: 'fy_total', label: 'First Year Total Units', type: 'number', required: false, section: 'First Year — Total' },

      // ---- SECOND YEAR — 1st Semester ----
      ...[1,2,3,4,5,6,7,8,9].flatMap(i => [
        { name: `sy_1s_${i}`, label: `Subject`, type: 'text' as const, required: false, section: 'Second Year — 1st Semester', placeholder: 'Subject name', repeatGroup: 'sy_1s', repeatIndex: i, ...(i === 1 ? { repeatMax: 9 } : {}) },
        { name: `sy_1s_${i}_u`, label: `Units`, type: 'number' as const, required: false, section: 'Second Year — 1st Semester', placeholder: 'Units', repeatGroup: 'sy_1s', repeatIndex: i },
      ]),
      // ---- SECOND YEAR — 2nd Semester ----
      ...[1,2,3,4,5,6,7,8,9].flatMap(i => [
        { name: `sy_2s_${i}`, label: `Subject`, type: 'text' as const, required: false, section: 'Second Year — 2nd Semester', placeholder: 'Subject name', repeatGroup: 'sy_2s', repeatIndex: i, ...(i === 1 ? { repeatMax: 9 } : {}) },
        { name: `sy_2s_${i}_u`, label: `Units`, type: 'number' as const, required: false, section: 'Second Year — 2nd Semester', placeholder: 'Units', repeatGroup: 'sy_2s', repeatIndex: i },
      ]),
      { name: 'sy_total', label: 'Second Year Total Units', type: 'number', required: false, section: 'Second Year — Total' },

      // ---- THIRD YEAR — 1st Semester ----
      ...[1,2,3,4,5,6,7,8,9,10,11].flatMap(i => [
        { name: `ty_1s_${i}`, label: `Subject`, type: 'text' as const, required: false, section: 'Third Year — 1st Semester', placeholder: 'Subject name', repeatGroup: 'ty_1s', repeatIndex: i, ...(i === 1 ? { repeatMax: 11 } : {}) },
        { name: `ty_1s_${i}_u`, label: `Units`, type: 'number' as const, required: false, section: 'Third Year — 1st Semester', placeholder: 'Units', repeatGroup: 'ty_1s', repeatIndex: i },
      ]),
      // ---- THIRD YEAR — 2nd Semester ----
      ...[1,2,3,4,5,6,7,8,9,10,11].flatMap(i => [
        { name: `ty_2s_${i}`, label: `Subject`, type: 'text' as const, required: false, section: 'Third Year — 2nd Semester', placeholder: 'Subject name', repeatGroup: 'ty_2s', repeatIndex: i, ...(i === 1 ? { repeatMax: 11 } : {}) },
        { name: `ty_2s_${i}_u`, label: `Units`, type: 'number' as const, required: false, section: 'Third Year — 2nd Semester', placeholder: 'Units', repeatGroup: 'ty_2s', repeatIndex: i },
      ]),
      { name: 'ty_total', label: 'Third Year Total Units', type: 'number', required: false, section: 'Third Year — Total' },

      // ---- FOURTH YEAR — 1st Semester ----
      ...[1,2,3,4,5,6,7,8,9,10].flatMap(i => [
        { name: `4y_1s_${i}`, label: `Subject`, type: 'text' as const, required: false, section: 'Fourth Year — 1st Semester', placeholder: 'Subject name', repeatGroup: '4y_1s', repeatIndex: i, ...(i === 1 ? { repeatMax: 10 } : {}) },
        { name: `4y_1s_${i}_u`, label: `Units`, type: 'number' as const, required: false, section: 'Fourth Year — 1st Semester', placeholder: 'Units', repeatGroup: '4y_1s', repeatIndex: i },
      ]),
      // ---- FOURTH YEAR — 2nd Semester ----
      ...[1,2,3,4,5,6,7,8,9,10].flatMap(i => [
        { name: `4y_2s_${i}`, label: `Subject`, type: 'text' as const, required: false, section: 'Fourth Year — 2nd Semester', placeholder: 'Subject name', repeatGroup: '4y_2s', repeatIndex: i, ...(i === 1 ? { repeatMax: 10 } : {}) },
        { name: `4y_2s_${i}_u`, label: `Units`, type: 'number' as const, required: false, section: 'Fourth Year — 2nd Semester', placeholder: 'Units', repeatGroup: '4y_2s', repeatIndex: i },
      ]),
      { name: '4y_total', label: 'Fourth Year Total Units', type: 'number', required: false, section: 'Fourth Year — Total' },

      // ---- Grand Total ----
      { name: 'grand_total', label: 'Grand Total Units', type: 'number', required: false, section: 'Grand Total' },

      // ---- Courses Failed to Take (repeatable, max 5) ----
      ...[1,2,3,4,5].flatMap(i => [
        { name: `fail_code_${i}`, label: 'Course Code', type: 'text' as const, required: false, section: 'Courses Failed to Take', placeholder: 'e.g., CPE 301', repeatGroup: 'fail_courses', repeatIndex: i, ...(i === 1 ? { repeatMax: 5 } : {}) },
        { name: `fail_title_${i}`, label: 'Course Title', type: 'text' as const, required: false, section: 'Courses Failed to Take', placeholder: 'e.g., Digital Systems Design', repeatGroup: 'fail_courses', repeatIndex: i },
        { name: `fail_units_${i}`, label: 'Units', type: 'number' as const, required: false, section: 'Courses Failed to Take', placeholder: 'Units', repeatGroup: 'fail_courses', repeatIndex: i },
      ]),
    ],
  },

  // ========== INTERNSHIP RESUME ==========
  INTERNSHIP_RESUME: {
    documentType: 'INTERNSHIP_RESUME',
    templateFile: 'internship_resume.html',
    title: 'Internship Resume',
    description: 'FM-AA-INT-09 — Resume for internship / practicum',
    fields: [
      // Photo
      { name: 'photo', label: '2x2 Photo', type: 'image', required: false, section: '2x2 Photo' },

      // University Details
      { name: 'campus', label: 'Campus', type: 'text', required: true, autoFillKey: 'campus', section: 'University Details' },

      // Personal Info
      { name: 'name', label: 'Full Name', type: 'text', required: true, autoFillKey: 'student_name', section: 'Personal Information' },
      { name: 'address', label: 'Address', type: 'text', required: true, section: 'Personal Information', placeholder: 'Complete residential address' },
      { name: 'phone', label: 'Telephone / Mobile Number', type: 'text', required: true, section: 'Personal Information', placeholder: '09XX-XXX-XXXX' },
      { name: 'email', label: 'Email Address', type: 'text', required: true, autoFillKey: 'email', section: 'Personal Information' },
      { name: 'career_objective', label: 'Career Objective', type: 'textarea', required: false, section: 'Personal Information', placeholder: 'Brief career objective statement' },

      // Work Experience (up to 5 entries)
      ...[1,2,3,4,5].flatMap(i => [
        { name: `we_date_${i}`, label: `Inclusive Date`, type: 'text' as const, required: false, section: 'Work Experience', placeholder: 'e.g., Jan 2024 - Mar 2024', repeatGroup: 'work_experience', repeatIndex: i, ...(i === 1 ? { repeatMax: 5 } : {}) },
        { name: `we_employer_${i}`, label: `Employer`, type: 'text' as const, required: false, section: 'Work Experience', placeholder: 'Company name', repeatGroup: 'work_experience', repeatIndex: i },
        { name: `we_position_${i}`, label: `Position`, type: 'text' as const, required: false, section: 'Work Experience', placeholder: 'Job title', repeatGroup: 'work_experience', repeatIndex: i },
      ]),

      // Trainings and Seminars (up to 5 entries)
      ...[1,2,3,4,5].flatMap(i => [
        { name: `sem_title_${i}`, label: `Title of Seminar`, type: 'text' as const, required: false, section: 'Trainings & Seminars Attended', placeholder: 'Seminar/training title', repeatGroup: 'seminars', repeatIndex: i, ...(i === 1 ? { repeatMax: 5 } : {}) },
        { name: `sem_date_${i}`, label: `Inclusive Date`, type: 'text' as const, required: false, section: 'Trainings & Seminars Attended', placeholder: 'e.g., Oct 15-16, 2024', repeatGroup: 'seminars', repeatIndex: i },
      ]),

      // Educational Background
      { name: 'elem_school', label: 'Elementary School', type: 'text', required: false, section: 'Educational Background', placeholder: 'School name' },
      { name: 'elem_date', label: 'Elementary — Inclusive Date', type: 'text', required: false, section: 'Educational Background', placeholder: 'e.g., 2010 - 2016' },
      { name: 'hs_school', label: 'High School', type: 'text', required: false, section: 'Educational Background', placeholder: 'School name' },
      { name: 'hs_date', label: 'High School — Inclusive Date', type: 'text', required: false, section: 'Educational Background', placeholder: 'e.g., 2016 - 2022' },
      { name: 'college_school', label: 'College', type: 'text', required: false, section: 'Educational Background', placeholder: 'School name' },
      { name: 'college_date', label: 'College — Inclusive Date', type: 'text', required: false, section: 'Educational Background', placeholder: 'e.g., 2022 - present' },

      // Extracurricular Activities (up to 4 entries)
      ...[1,2,3,4].map(i => ({
        name: `activity_${i}`, label: `Activity / Award ${i}`, type: 'text' as const, required: false, section: 'Extracurricular Activities & Awards', placeholder: 'Activity or award description', repeatGroup: 'activities', repeatIndex: i, ...(i === 1 ? { repeatMax: 4 } : {}),
      })),

      // Personal Background
      { name: 'nickname', label: 'Nickname', type: 'text', required: false, section: 'Personal Background', placeholder: 'Nickname' },
      { name: 'height', label: 'Height (cm)', type: 'number', required: false, section: 'Personal Background', placeholder: 'e.g., 168', min: 50, max: 280, step: 1 },
      { name: 'age', label: 'Age', type: 'number', required: false, section: 'Personal Background', placeholder: 'e.g., 21', min: 10, max: 120, step: 1 },
      { name: 'weight', label: 'Weight (kg)', type: 'number', required: false, section: 'Personal Background', placeholder: 'e.g., 60', min: 20, max: 400, step: 0.1 },
      { name: 'gender', label: 'Gender', type: 'select', required: false, section: 'Personal Background', options: [
        { value: 'Male', label: 'Male' },
        { value: 'Female', label: 'Female' },
      ]},
      { name: 'civil_status', label: 'Civil Status', type: 'select', required: false, section: 'Personal Background', options: [
        { value: 'Single', label: 'Single' },
        { value: 'Married', label: 'Married' },
        { value: 'Widowed', label: 'Widowed' },
      ]},
      { name: 'religion', label: 'Religion', type: 'text', required: false, section: 'Personal Background', placeholder: 'e.g., Roman Catholic' },
      { name: 'skills', label: 'Skills', type: 'text', required: false, section: 'Personal Background', placeholder: 'e.g., MS Office, Programming' },

      // References (up to 3 entries)
      ...[1,2,3].flatMap(i => [
        { name: `ref_name_${i}`, label: `Name`, type: 'text' as const, required: false, section: 'References', placeholder: 'Reference name', repeatGroup: 'references', repeatIndex: i, ...(i === 1 ? { repeatMax: 3 } : {}) },
        { name: `ref_pos_${i}`, label: `Position`, type: 'text' as const, required: false, section: 'References', placeholder: 'Position', repeatGroup: 'references', repeatIndex: i },
        { name: `ref_company_${i}`, label: `Company`, type: 'text' as const, required: false, section: 'References', placeholder: 'Company name', repeatGroup: 'references', repeatIndex: i },
        { name: `ref_contact_${i}`, label: `Contact Number`, type: 'text' as const, required: false, section: 'References', placeholder: '09XX-XXX-XXXX', repeatGroup: 'references', repeatIndex: i },
      ]),
    ],
  },

  // ========== RECORD_FILE ==========
  RECORD_FILE: {
    documentType: 'RECORD_FILE',
    templateFile: 'record_file.html',
    title: 'Record File',
    description: 'FM-AA-INT-XX — Student record file and document checklist',
    fields: [
      { name: 'photo_url', label: '2x2 Photo', type: 'image', required: false, section: '2x2 Photo' },
      { name: 'surname', label: 'Surname', type: 'text', required: true, autoFillKey: 'surname', section: 'Personal Information' },
      { name: 'given_name', label: 'Given Name', type: 'text', required: true, autoFillKey: 'given_name', section: 'Personal Information' },
      { name: 'middle_name', label: 'Middle Name', type: 'text', required: false, autoFillKey: 'middle_name', section: 'Personal Information' },
      { name: 'student_number', label: 'Student Number', type: 'text', required: true, autoFillKey: 'student_number', section: 'Personal Information' },
      { name: 'course', label: 'Course / Program', type: 'text', required: true, autoFillKey: 'course', section: 'Academic Details' },
      { name: 'year_section', label: 'Year & Section', type: 'text', required: true, autoFillKey: 'year_section', section: 'Academic Details' },
      { name: 'email', label: 'Email Address', type: 'text', required: true, autoFillKey: 'email', section: 'Contact Information' },
      { name: 'contact_number', label: 'Contact Number', type: 'text', required: true, section: 'Contact Information', placeholder: '09XX-XXX-XXXX' },
      { name: 'home_address', label: 'Home Address', type: 'text', required: true, section: 'Contact Information', placeholder: 'Permanent home address' },
      { name: 'parent_guardian', label: 'Parent / Guardian Name', type: 'text', required: true, section: 'Parent / Guardian Details', placeholder: 'Full name' },
      { name: 'parent_contact', label: 'Parent / Guardian Contact', type: 'text', required: true, section: 'Parent / Guardian Details', placeholder: '09XX-XXX-XXXX' },
      { name: 'parent_address', label: 'Parent / Guardian Address', type: 'text', required: false, section: 'Parent / Guardian Details', placeholder: 'Address' },
      { name: 'company_name', label: 'Company / Agency Name', type: 'text', required: true, autoFillKey: 'company_name', section: 'Company Details' },
      { name: 'company_address', label: 'Company Address', type: 'text', required: true, autoFillKey: 'company_address', section: 'Company Details' },
      { name: 'company_contact', label: 'Company Contact Number', type: 'text', required: false, section: 'Company Details', placeholder: 'Contact number' },
      { name: 'company_head', label: 'Authorized Representative', type: 'text', required: false, section: 'Company Details', placeholder: 'Manager / Supervisor' },
      { name: 'company_head_title', label: 'Position', type: 'text', required: false, section: 'Company Details', placeholder: 'Position' },
      { name: 'start_date', label: 'OJT Start Date', type: 'date', required: false, autoFillKey: 'start_date', section: 'Coverage Date' },
      { name: 'end_date', label: 'OJT End Date', type: 'date', required: false, autoFillKey: 'end_date', section: 'Coverage Date' },
    ],
  },

  // ========== STUDENT FEEDBACK FORM ==========
  STUDENT_FEEDBACK: {
    documentType: 'STUDENT_FEEDBACK',
    templateFile: 'student_feedback.html',
    title: "Student-Intern's Feedback Form",
    description: 'FM-AA-INT-17 — Student-Intern feedback form for internship experience',
    fields: [
      // Auto-filled
      { name: 'campus', label: 'Campus', type: 'text', required: true, autoFillKey: 'campus', section: 'University Details' },
      { name: 'student_name', label: 'Name of Student-Intern', type: 'text', required: true, autoFillKey: 'student_name', section: 'Student Information' },
      { name: 'course', label: 'Course', type: 'text', required: true, autoFillKey: 'course', section: 'Student Information' },
      { name: 'department', label: 'Department', type: 'text', required: false, section: 'Student Information', placeholder: 'e.g., College of Computing' },
      { name: 'company_name', label: 'Company Name', type: 'text', required: true, autoFillKey: 'company_name', section: 'Student Information' },
      { name: 'date', label: 'Date', type: 'date', required: true, autoFillKey: 'date', section: 'Student Information' },

      // Criteria (Likert scale: 5=Strongly Agree … 1=Strongly Disagree)
      { name: 'criteria_1', label: 'My training is aligned with my field of specialization', type: 'select', required: true, section: 'Feedback Criteria', options: [
        { value: '5', label: 'Strongly Agree' },
        { value: '4', label: 'Agree' },
        { value: '3', label: 'Neither Agree nor Disagree' },
        { value: '2', label: 'Disagree' },
        { value: '1', label: 'Strongly Disagree' },
      ]},
      { name: 'criteria_2', label: 'My training is challenging', type: 'select', required: true, section: 'Feedback Criteria', options: [
        { value: '5', label: 'Strongly Agree' },
        { value: '4', label: 'Agree' },
        { value: '3', label: 'Neither Agree nor Disagree' },
        { value: '2', label: 'Disagree' },
        { value: '1', label: 'Strongly Disagree' },
      ]},
      { name: 'criteria_3', label: 'I have opportunities for learning', type: 'select', required: true, section: 'Feedback Criteria', options: [
        { value: '5', label: 'Strongly Agree' },
        { value: '4', label: 'Agree' },
        { value: '3', label: 'Neither Agree nor Disagree' },
        { value: '2', label: 'Disagree' },
        { value: '1', label: 'Strongly Disagree' },
      ]},
      { name: 'criteria_4', label: 'I am aware of the policies of the company', type: 'select', required: true, section: 'Feedback Criteria', options: [
        { value: '5', label: 'Strongly Agree' },
        { value: '4', label: 'Agree' },
        { value: '3', label: 'Neither Agree nor Disagree' },
        { value: '2', label: 'Disagree' },
        { value: '1', label: 'Strongly Disagree' },
      ]},
      { name: 'criteria_5', label: 'I have a positive working relationship with my supervisor and other employees', type: 'select', required: true, section: 'Feedback Criteria', options: [
        { value: '5', label: 'Strongly Agree' },
        { value: '4', label: 'Agree' },
        { value: '3', label: 'Neither Agree nor Disagree' },
        { value: '2', label: 'Disagree' },
        { value: '1', label: 'Strongly Disagree' },
      ]},
      { name: 'criteria_6', label: 'I am aware of the risks and hazards of my working environment', type: 'select', required: true, section: 'Feedback Criteria', options: [
        { value: '5', label: 'Strongly Agree' },
        { value: '4', label: 'Agree' },
        { value: '3', label: 'Neither Agree nor Disagree' },
        { value: '2', label: 'Disagree' },
        { value: '1', label: 'Strongly Disagree' },
      ]},
      { name: 'criteria_7', label: 'My department is committed to ensuring the health and safety of its student-interns', type: 'select', required: true, section: 'Feedback Criteria', options: [
        { value: '5', label: 'Strongly Agree' },
        { value: '4', label: 'Agree' },
        { value: '3', label: 'Neither Agree nor Disagree' },
        { value: '2', label: 'Disagree' },
        { value: '1', label: 'Strongly Disagree' },
      ]},

      // Free-text sections
      { name: 'problems_met', label: 'Problems Met', type: 'textarea', required: false, section: 'Additional Feedback', placeholder: 'Describe any problems you encountered during your internship...' },
      { name: 'other_concerns', label: 'Other Concerns', type: 'textarea', required: false, section: 'Additional Feedback', placeholder: 'Any other concerns or suggestions...' },
    ],
  },

  // ========== INTERNSHIP AGREEMENT ==========
  INTERNSHIP_AGREEMENT: {
    documentType: 'INTERNSHIP_AGREEMENT',
    templateFile: 'internship_agreement.html',
    title: 'Internship Agreement',
    description: 'FM-AA-INT-10 — Internship Agreement between student, university, and host company',
    fields: [
      // Auto-filled
      { name: 'campus', label: 'Campus', type: 'text', required: true, autoFillKey: 'campus', section: 'University Details' },
      { name: 'campus_exec_director', label: 'Campus Executive Director', type: 'text', required: false, section: 'University Details', placeholder: 'Name of Campus Executive Director' },
      { name: 'student_name', label: 'Name of Student-Intern', type: 'text', required: true, autoFillKey: 'student_name', section: 'Student Information' },
      { name: 'course', label: 'Course / Major', type: 'text', required: true, autoFillKey: 'course', section: 'Student Information' },
      { name: 'student_address', label: 'Residential Address', type: 'text', required: true, section: 'Student Information', placeholder: 'Complete residential address' },
      { name: 'total_hours', label: 'Total Required Hours', type: 'number', required: true, autoFillKey: 'total_hours', section: 'Internship Details' },

      // Company Details
      { name: 'company_name', label: 'Name of Company / Agency', type: 'text', required: true, autoFillKey: 'company_name', section: 'Host Company Details' },
      { name: 'company_address', label: 'Office Address', type: 'text', required: true, autoFillKey: 'company_address', section: 'Host Company Details' },
      { name: 'company_representative', label: 'Company Representative', type: 'text', required: false, section: 'Host Company Details', placeholder: 'Name of representative' },
      { name: 'representative_position', label: 'Position of Representative', type: 'text', required: false, section: 'Host Company Details', placeholder: 'e.g., HR Manager, CEO' },
      { name: 'company_incharge', label: 'Company/Agency Internship In-Charge', type: 'text', required: false, section: 'Host Company Details', placeholder: 'Name of internship in-charge' },

      // Signatures
      { name: 'instructor_name', label: 'Internship/Practicum Subject Instructor', type: 'text', required: false, autoFillKey: 'instructor_name', section: 'Signatories' },
      { name: 'coordinator_name', label: 'Campus Internship Coordinator', type: 'text', required: false, autoFillKey: 'coordinator_name', section: 'Signatories' },

      // Signing Details
      { name: 'signed_date', label: 'Date Signed', type: 'date', required: false, section: 'Signing Details' },

      // Acknowledgment (optional — usually filled later by notary)
      { name: 'sworn_day', label: 'Sworn Day', type: 'text', required: false, section: 'Acknowledgment (Notary)', placeholder: 'Day' },
      { name: 'sworn_month', label: 'Sworn Month', type: 'text', required: false, section: 'Acknowledgment (Notary)', placeholder: 'Month' },
      { name: 'sworn_year', label: 'Sworn Year', type: 'text', required: false, section: 'Acknowledgment (Notary)', placeholder: 'Year' },
      { name: 'doc_no', label: 'Doc No.', type: 'text', required: false, section: 'Acknowledgment (Notary)', placeholder: 'Doc number' },
      { name: 'page_no', label: 'Page No.', type: 'text', required: false, section: 'Acknowledgment (Notary)', placeholder: 'Page number' },
      { name: 'book_no', label: 'Book No.', type: 'text', required: false, section: 'Acknowledgment (Notary)', placeholder: 'Book number' },
      { name: 'series_of', label: 'Series of', type: 'text', required: false, section: 'Acknowledgment (Notary)', placeholder: 'e.g., 2026' },
    ],
  },

  // ========== TRAINING AGREEMENT AND LIABILITY WAIVER (OVERTIME FORM) ==========
  TRAINING_AGREEMENT: {
    documentType: 'TRAINING_AGREEMENT',
    templateFile: 'training_agreement.html',
    title: 'Training Agreement and Liability Waiver Form - Overtime Form',
    description:
      'FM-AA-INT-15 — Training agreement and liability waiver for overtime internship training. Institutional approval for this form is handled from 5:00 PM onward (separate from the standard OJT attendance clock-out).',
    fields: [
      // Auto-filled
      { name: 'student_name', label: 'Name of Student-Intern', type: 'text', required: true, autoFillKey: 'student_name', section: 'Student Information' },
      { name: 'company_name', label: 'Company / Training Establishment', type: 'text', required: true, autoFillKey: 'company_name', section: 'Company Details' },

      // Student Cert Info
      { name: 'student_cert_no', label: 'Res. Cert No.', type: 'text', required: false, section: 'Student Residence Certificate', placeholder: 'Residence Certificate Number' },
      { name: 'student_cert_issued_on', label: 'Issued on', type: 'date', required: false, section: 'Student Residence Certificate' },
      { name: 'student_cert_issued_at', label: 'Issued at', type: 'text', required: false, section: 'Student Residence Certificate', placeholder: 'Place issued' },

      // Parent/Guardian Cert Info
      { name: 'parent_cert_no', label: 'Res. Cert No.', type: 'text', required: false, section: 'Parent/Guardian Residence Certificate', placeholder: 'Residence Certificate Number' },
      { name: 'parent_cert_issued_on', label: 'Issued on', type: 'date', required: false, section: 'Parent/Guardian Residence Certificate' },
      { name: 'parent_cert_issued_at', label: 'Issued at', type: 'text', required: false, section: 'Parent/Guardian Residence Certificate', placeholder: 'Place issued' },

      // Company Representative Cert Info
      { name: 'company_cert_no', label: 'Res. Cert No.', type: 'text', required: false, section: 'Company Rep. Residence Certificate', placeholder: 'Residence Certificate Number' },
      { name: 'company_cert_issued_on', label: 'Issued on', type: 'date', required: false, section: 'Company Rep. Residence Certificate' },
      { name: 'company_cert_issued_at', label: 'Issued at', type: 'text', required: false, section: 'Company Rep. Residence Certificate', placeholder: 'Place issued' },

      // Sworn Details (optional — usually filled later by notary)
      { name: 'sworn_day', label: 'Sworn Day', type: 'text', required: false, section: 'Subscribed & Sworn (Notary)', placeholder: 'Day' },
      { name: 'sworn_month', label: 'Sworn Month', type: 'text', required: false, section: 'Subscribed & Sworn (Notary)', placeholder: 'Month' },
      { name: 'sworn_year', label: 'Sworn Year', type: 'text', required: false, section: 'Subscribed & Sworn (Notary)', placeholder: 'Year' },
      { name: 'sworn_place', label: 'Place', type: 'text', required: false, section: 'Subscribed & Sworn (Notary)', placeholder: 'City/Municipality' },
    ],
  },
};
