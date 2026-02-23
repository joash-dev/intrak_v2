import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, FileCheck, Edit3, Loader2, CheckCircle, AlertCircle, Save, PlusCircle, MinusCircle, ImagePlus, X, Search, Users, UserPlus, Trash2, User, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { documentService } from '../../services/documentService';
import StudentWeeklyReport from './StudentWeeklyReport';

type Step = 'fill' | 'preview' | 'done';

// ========== Student Picker for Multi-Student Endorsement Letter ==========
interface PickerStudent {
  id: string;
  name: string;
  studentNumber: string;
  program: string;
  year: number;
  section: string;
  company: string | null;
}

const StudentPicker: React.FC<{
  selectedStudents: PickerStudent[];
  onAddStudent: (student: PickerStudent) => void;
  onRemoveStudent: (studentId: string) => void;
  currentStudentName: string;
}> = ({ selectedStudents, onAddStudent, onRemoveStudent, currentStudentName }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PickerStudent[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await documentService.searchStudentsForPicker(query.trim());
        // Filter out already selected students
        const selectedIds = new Set(selectedStudents.map(s => s.id));
        setSearchResults(results.filter(s => !selectedIds.has(s.id)));
        setShowDropdown(true);
      } catch (error) {
        console.error('Error searching students:', error);
        toast.error('Failed to search students');
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleSelect = (student: PickerStudent) => {
    onAddStudent(student);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  return (
    <div className="form-section" style={{ marginBottom: '16px' }}>
      <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Users size={18} />
        Students ({selectedStudents.length} selected)
      </h3>

      {/* Current student note */}
      <div className="sp-current-note">
        <User size={14} />
        <span>You (<strong>{currentStudentName}</strong>) are automatically included in this endorsement letter.</span>
      </div>

      {/* Search Box */}
      <div ref={dropdownRef} className="sp-search-wrapper">
        <div style={{ position: 'relative' }}>
          <Search size={16} className="sp-search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
            placeholder="Search students by name or student number..."
            className="sp-search-input"
          />
          {searching && (
            <Loader2 size={16} className="spin sp-search-spinner" />
          )}
        </div>

        {/* Dropdown Results */}
        {showDropdown && (
          <div className="sp-dropdown">
            {searchResults.length === 0 ? (
              <div className="sp-dropdown-empty">
                {searching ? 'Searching...' : 'No students found. Try a different name or student number.'}
              </div>
            ) : (
              searchResults.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => handleSelect(student)}
                  className="sp-dropdown-item"
                >
                  <div className="sp-dropdown-avatar">
                    <UserPlus size={14} />
                  </div>
                  <div className="sp-dropdown-info">
                    <div className="sp-dropdown-name">{student.name}</div>
                    <div className="sp-dropdown-meta">
                      {student.studentNumber} · {student.program} - Year {student.year}
                      {student.company && ` · ${student.company}`}
                    </div>
                  </div>
                  <span className="sp-dropdown-add">Add</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Selected Students List */}
      {selectedStudents.length > 0 && (
        <div className="sp-selected-list">
          {selectedStudents.map((student, idx) => (
            <div
              key={student.id}
              className={`sp-selected-row ${idx % 2 === 0 ? 'sp-selected-row-even' : ''}`}
              style={{ borderBottom: idx < selectedStudents.length - 1 ? undefined : 'none' }}
            >
              <span className="sp-selected-num">{idx + 1}</span>
              <div className="sp-selected-info">
                <div className="sp-selected-name">{student.name}</div>
                <div className="sp-selected-meta">
                  {student.studentNumber} · {student.program}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemoveStudent(student.id)}
                className="sp-remove-btn"
                title="Remove student"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedStudents.length === 0 && (
        <div className="sp-empty-state">
          <Users size={24} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
          <p>No additional students added yet.</p>
          <p style={{ fontSize: '12px' }}>Search and add students who will be included in this endorsement letter.</p>
        </div>
      )}
    </div>
  );
};

// ========== Template Selector for Endorsement Letter ==========
const EndorsementTemplateSelector: React.FC<{
  onSelect: (variant: 'single' | 'multi') => void;
}> = ({ onSelect }) => {
  const navigate = useNavigate();
  return (
    <div className="document-form-page">
      {/* Polished Header Card */}
      <div className="dfp-header-card">
        <button onClick={() => navigate('/student/documents')} className="dfp-back-btn">
          <ArrowLeft size={18} />
          <span>Back to Documents</span>
        </button>
        <div className="dfp-header-content">
          <div className="dfp-header-icon dfp-icon-blue">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="dfp-header-title">Endorsement Letter</h1>
            <p className="dfp-header-subtitle">FM-AA-INT-05 — Select a template to get started</p>
          </div>
        </div>
      </div>

      {/* Template Selection Cards */}
      <div className="dfp-template-grid">
        {/* Single Student */}
        <button onClick={() => onSelect('single')} className="dfp-template-card dfp-template-blue">
          <div className="dfp-template-icon dfp-icon-blue">
            <User size={28} />
          </div>
          <h3 className="dfp-template-title">Single Student</h3>
          <p className="dfp-template-desc">Generate an endorsement letter for yourself only.</p>
          <span className="dfp-template-action dfp-action-blue">Select template →</span>
        </button>

        {/* Multiple Students */}
        <button onClick={() => onSelect('multi')} className="dfp-template-card dfp-template-purple">
          <div className="dfp-template-icon dfp-icon-purple">
            <Users size={28} />
          </div>
          <h3 className="dfp-template-title">Multiple Students</h3>
          <p className="dfp-template-desc">Generate an endorsement letter listing multiple students from the system.</p>
          <span className="dfp-template-action dfp-action-purple">Select template →</span>
        </button>
      </div>

      {/* Styles must be inside this component since it returns before the main style block */}
      <style>{`
        .document-form-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 24px;
        }
        .dfp-header-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 20px 24px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06);
        }
        .dfp-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: #6b7280;
          font-size: 13px;
          cursor: pointer;
          padding: 4px 8px 4px 0;
          margin-bottom: 14px;
          border-radius: 6px;
          transition: all 0.2s;
        }
        .dfp-back-btn:hover {
          color: #111827;
          background: #f3f4f6;
          padding-left: 8px;
        }
        .dfp-header-content {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .dfp-header-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .dfp-header-title {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 2px 0;
          line-height: 1.3;
        }
        .dfp-header-subtitle {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
        }
        .dfp-template-grid {
          max-width: 700px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .dfp-template-card {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 16px;
          padding: 28px 20px;
          cursor: pointer;
          text-align: center;
          transition: all 0.25s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .dfp-template-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        }
        .dfp-template-blue:hover { border-color: #3b82f6; box-shadow: 0 8px 24px rgba(59,130,246,0.12); }
        .dfp-template-purple:hover { border-color: #8b5cf6; box-shadow: 0 8px 24px rgba(139,92,246,0.12); }
        .dfp-template-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
        }
        .dfp-template-title {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 6px 0;
        }
        .dfp-template-desc {
          font-size: 13px;
          color: #6b7280;
          line-height: 1.5;
          margin: 0 0 14px 0;
        }
        .dfp-template-action {
          font-size: 13px;
          font-weight: 600;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .dfp-template-card:hover .dfp-template-action { opacity: 1; }
        @media (max-width: 480px) {
          .dfp-template-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .document-form-page { padding: 12px; }
          .dfp-header-card { padding: 14px 16px; border-radius: 12px; }
          .dfp-header-icon { width: 40px; height: 40px; border-radius: 10px; }
          .dfp-header-title { font-size: 17px; }
          .dfp-template-card { padding: 20px 14px; }
        }

        /* Icon color helpers */
        .dfp-icon-blue { background: #eff6ff; color: #3b82f6; }
        .dfp-icon-purple { background: #f5f3ff; color: #8b5cf6; }
        .dfp-action-blue { color: #3b82f6; }
        .dfp-action-purple { color: #8b5cf6; }

        /* Template Selector dark mode */
        .dark .dfp-header-card { background: #212124; border-color: #374151; box-shadow: 0 1px 3px rgba(0,0,0,0.3); }
        .dark .dfp-back-btn { color: #9ca3af; }
        .dark .dfp-back-btn:hover { color: #f3f4f6; background: #374151; }
        .dark .dfp-header-title { color: #f9fafb; }
        .dark .dfp-header-subtitle { color: #9ca3af; }
        .dark .dfp-template-card { background: #212124; border-color: #374151; }
        .dark .dfp-template-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
        .dark .dfp-template-title { color: #f9fafb; }
        .dark .dfp-template-desc { color: #9ca3af; }
        .dark .dfp-icon-blue { background: rgba(59,130,246,0.12); color: #60a5fa; }
        .dark .dfp-icon-purple { background: rgba(139,92,246,0.12); color: #a78bfa; }
        .dark .dfp-action-blue { color: #60a5fa; }
        .dark .dfp-action-purple { color: #a78bfa; }
      `}</style>
    </div>
  );
};

interface FormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  autoFillKey?: string;
  placeholder?: string;
  section?: string;
  options?: Array<{ value: string; label: string }>;
  repeatGroup?: string;
  repeatIndex?: number;
  repeatMax?: number;
}

const DocumentFormPage: React.FC = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();

  // Map ENDORSEMENT_LETTER_SINGLE back to the real type for API
  const actualType = type === 'ENDORSEMENT_LETTER_SINGLE' ? 'ENDORSEMENT_LETTER' : type;
  const isMultiEndorsement = type === 'ENDORSEMENT_LETTER_MULTI';

  // ALL hooks must be declared unconditionally (React Rules of Hooks)
  const [step, setStep] = useState<Step>('fill');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [autoFillKeys, setAutoFillKeys] = useState<Set<string>>(new Set());
  const [previewHtml, setPreviewHtml] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draftSaved, setDraftSaved] = useState(false);
  const [repeatCounts, setRepeatCounts] = useState<Record<string, number>>({});
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Multi-student endorsement letter
  const [selectedStudents, setSelectedStudents] = useState<PickerStudent[]>([]);
  const [currentStudentName, setCurrentStudentName] = useState('');

  // Draft key for localStorage
  const draftKey = `intrak_form_draft_${actualType}`;

  // Load form definition (skip for types handled by early returns)
  useEffect(() => {
    if (!actualType || type === 'WEEKLY_REPORTS' || type === 'ENDORSEMENT_LETTER') return;
    const loadDefinition = async () => {
      try {
        setLoading(true);
        const { definition, autoFillValues } = await documentService.getFormDefinition(actualType);

        // For multi-student endorsement: save current student name and auto-include them
        if (isMultiEndorsement && autoFillValues.student_name) {
          setCurrentStudentName(autoFillValues.student_name);
        }
        setTitle(definition.title);
        setDescription(definition.description);
        setFields(definition.fields);

        // Pre-fill form data with auto-fill values
        const initialData: Record<string, string> = {};
        const autoKeys = new Set<string>();
        definition.fields.forEach((field: FormField) => {
          if (field.autoFillKey && autoFillValues[field.autoFillKey]) {
            initialData[field.name] = autoFillValues[field.autoFillKey];
            autoKeys.add(field.name);
          } else {
            initialData[field.name] = '';
          }
        });

        // Load saved draft from localStorage (overrides auto-fill for user-edited fields)
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          try {
            const draftData = JSON.parse(savedDraft) as Record<string, string>;
            // Merge: draft values take priority over auto-fill
            Object.keys(draftData).forEach(key => {
              if (draftData[key] !== '') {
                initialData[key] = draftData[key];
              }
            });
            setDraftSaved(true);
          } catch { /* ignore corrupted draft */ }
        }

        setFormData(initialData);
        setAutoFillKeys(autoKeys);

        // Initialize repeat group counts
        const counts: Record<string, number> = {};
        definition.fields.forEach((field: FormField) => {
          if (field.repeatGroup && field.repeatIndex) {
            // Find max index that has data, or default to 1
            if (!counts[field.repeatGroup]) counts[field.repeatGroup] = 1;
            if (initialData[field.name] && initialData[field.name] !== '') {
              counts[field.repeatGroup] = Math.max(counts[field.repeatGroup], field.repeatIndex);
            }
          }
        });
        setRepeatCounts(counts);
      } catch (error) {
        console.error('Error loading form definition:', error);
        toast.error('Failed to load form');
        navigate('/student/documents');
      } finally {
        setLoading(false);
      }
    };
    loadDefinition();
  }, [actualType, navigate, draftKey]);

  // Auto-compute totals for CERTIFICATION_UNITS
  const computeUnitTotals = (data: Record<string, string>): Record<string, string> => {
    if (actualType !== 'CERTIFICATION_UNITS') return data;
    const sumUnits = (prefix: string, max: number) => {
      let total = 0;
      for (let i = 1; i <= max; i++) {
        const val = parseFloat(data[`${prefix}_${i}_u`] || '0');
        if (!isNaN(val)) total += val;
      }
      return total;
    };
    const fy1 = sumUnits('fy_1s', 10);
    const fy2 = sumUnits('fy_2s', 10);
    const sy1 = sumUnits('sy_1s', 9);
    const sy2 = sumUnits('sy_2s', 9);
    const ty1 = sumUnits('ty_1s', 11);
    const ty2 = sumUnits('ty_2s', 11);
    const y4_1 = sumUnits('4y_1s', 10);
    const y4_2 = sumUnits('4y_2s', 10);
    const fyTotal = fy1 + fy2;
    const syTotal = sy1 + sy2;
    const tyTotal = ty1 + ty2;
    const y4Total = y4_1 + y4_2;
    const grandTotal = fyTotal + syTotal + tyTotal + y4Total;
    return {
      ...data,
      fy_total: fyTotal > 0 ? String(fyTotal) : '',
      sy_total: syTotal > 0 ? String(syTotal) : '',
      ty_total: tyTotal > 0 ? String(tyTotal) : '',
      '4y_total': y4Total > 0 ? String(y4Total) : '',
      grand_total: grandTotal > 0 ? String(grandTotal) : '',
    };
  };

  // Computed total field names (read-only)
  const computedFields = new Set(['fy_total', 'sy_total', 'ty_total', '4y_total', 'grand_total']);

  const handleChange = (name: string, value: string) => {
    let updated = { ...formData, [name]: value };
    // If a unit field changed, recompute totals
    if (actualType === 'CERTIFICATION_UNITS' && name.endsWith('_u')) {
      updated = computeUnitTotals(updated);
    }
    setFormData(updated);
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    // Auto-save draft to localStorage (debounced)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(updated));
        setDraftSaved(true);
      } catch (e: any) {
        // If quota exceeded (e.g. large photo), save without images as fallback
        if (e?.name === 'QuotaExceededError' || e?.code === 22) {
          const imageFieldNames = new Set(fields.filter(f => f.type === 'image').map(f => f.name));
          const draftData = { ...updated };
          imageFieldNames.forEach(key => { delete draftData[key]; });
          try {
            localStorage.setItem(draftKey, JSON.stringify(draftData));
            setDraftSaved(true);
          } catch { /* ignore */ }
        }
      }
    }, 500);
  };

  const handleAddRow = (group: string) => {
    setRepeatCounts(prev => {
      const maxForGroup = fields.find(f => f.repeatGroup === group && f.repeatMax)?.repeatMax || 5;
      const current = prev[group] || 1;
      if (current >= maxForGroup) return prev;
      return { ...prev, [group]: current + 1 };
    });
  };

  const handleRemoveRow = (group: string) => {
    setRepeatCounts(prev => {
      const current = prev[group] || 1;
      if (current <= 1) return prev;
      // Clear data for the removed row
      const fieldsToRemove = fields.filter(f => f.repeatGroup === group && f.repeatIndex === current);
      const updated = { ...formData };
      fieldsToRemove.forEach(f => { updated[f.name] = ''; });
      setFormData(updated);
      return { ...prev, [group]: current - 1 };
    });
  };

  const handleImageUpload = (fieldName: string, file: File | null) => {
    if (!file) return;
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG)');
      return;
    }
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }
    setImageLoading(prev => ({ ...prev, [fieldName]: true }));
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      handleChange(fieldName, base64);
      setImageLoading(prev => ({ ...prev, [fieldName]: false }));
      toast.success('Photo uploaded successfully');
    };
    reader.onerror = () => {
      setImageLoading(prev => ({ ...prev, [fieldName]: false }));
      toast.error('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (fieldName: string) => {
    handleChange(fieldName, '');
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    fields.forEach(field => {
      // Skip selected_students field validation for multi-endorsement — we handle it separately
      if (isMultiEndorsement && field.name === 'selected_students') return;
      if (field.required && (!formData[field.name] || formData[field.name].trim() === '')) {
        newErrors[field.name] = `${field.label} is required`;
      }
    });
    // For multi-endorsement, validate that at least 1 student is selected (+ current user)
    if (isMultiEndorsement && selectedStudents.length === 0) {
      newErrors['selected_students'] = 'Please add at least one additional student';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Build final form data for multi-student endorsement (inject selected_students JSON + IDs)
  const buildFinalFormData = (): Record<string, string> => {
    if (!isMultiEndorsement) return formData;
    // Build list: current student first, then selected students
    const allNames = [currentStudentName, ...selectedStudents.map(s => s.name)];
    // Also send IDs so the server can create document records for all included students
    const selectedStudentIds = selectedStudents.map(s => s.id);
    return {
      ...formData,
      selected_students: JSON.stringify(allNames),
      selected_student_ids: JSON.stringify(selectedStudentIds),
    };
  };

  const handlePreview = async () => {
    if (!validate()) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!actualType) return;

    try {
      setPreviewLoading(true);
      const finalData = buildFinalFormData();
      const html = await documentService.previewDocument(actualType, finalData);
      setPreviewHtml(html);
      setStep('preview');
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!actualType) return;

    try {
      setSubmitting(true);
      const finalData = buildFinalFormData();
      await documentService.finalizeDocument(actualType, finalData);
      // Clear draft from localStorage after successful finalization
      localStorage.removeItem(draftKey);
      setStep('done');
      if (isMultiEndorsement) {
        toast.success('Endorsement letter sent to students for acceptance!');
      } else {
        toast.success('Document generated successfully!');
      }
    } catch (error) {
      console.error('Error finalizing document:', error);
      toast.error('Failed to generate document');
    } finally {
      setSubmitting(false);
    }
  };

  // Group fields by section
  const groupedFields = useCallback(() => {
    const groups: Record<string, FormField[]> = {};
    fields.forEach(field => {
      const section = field.section || 'General';
      if (!groups[section]) groups[section] = [];
      groups[section].push(field);
    });
    return groups;
  }, [fields]);

  // ── Early returns AFTER all hooks (React Rules of Hooks) ──

  // For WEEKLY_REPORTS, render the weekly report editor instead of the standard form
  if (type === 'WEEKLY_REPORTS') {
    return (
      <StudentWeeklyReport
        documentMode
        onBack={() => navigate('/student/documents')}
        onSubmitted={() => navigate('/student/documents')}
      />
    );
  }

  // For ENDORSEMENT_LETTER, show template selector first
  if (type === 'ENDORSEMENT_LETTER') {
    return (
      <EndorsementTemplateSelector
        onSelect={(variant) => {
          if (variant === 'single') {
            navigate('/student/documents/form/ENDORSEMENT_LETTER_SINGLE', { replace: true });
          } else {
            navigate('/student/documents/form/ENDORSEMENT_LETTER_MULTI', { replace: true });
          }
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-40" style={{ pointerEvents: 'none' }}>
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
          <img src="/logo_intrak.png" alt="Loading..." className="relative w-full h-full object-contain animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="document-form-page">
      {/* Polished Header Card */}
      <div className="dfp-header-card">
        <button onClick={() => step === 'fill' ? navigate('/student/documents') : setStep('fill')} className="dfp-back-btn">
          <ArrowLeft size={18} />
          <span>{step === 'fill' ? 'Back to Documents' : 'Back to Form'}</span>
        </button>
        <div className="dfp-header-content">
          <div className="dfp-header-icon dfp-icon-blue">
            <FileText size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h1 className="dfp-header-title">{title}</h1>
            <p className="dfp-header-subtitle">{description}</p>
          </div>
          {/* Stepper — inline in header */}
          <div className="dfp-stepper">
            <div className={`dfp-step ${step === 'fill' ? 'active' : step === 'preview' || step === 'done' ? 'completed' : ''}`}>
              <div className="dfp-step-dot">{step === 'preview' || step === 'done' ? <CheckCircle size={14} /> : '1'}</div>
              <span>Fill Up</span>
            </div>
            <div className="dfp-step-line" />
            <div className={`dfp-step ${step === 'preview' ? 'active' : step === 'done' ? 'completed' : ''}`}>
              <div className="dfp-step-dot">{step === 'done' ? <CheckCircle size={14} /> : '2'}</div>
              <span>Preview</span>
            </div>
            <div className="dfp-step-line" />
            <div className={`dfp-step ${step === 'done' ? 'active completed' : ''}`}>
              <div className="dfp-step-dot">3</div>
              <span>Finalize</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step Content */}
      {step === 'fill' && (
        <div className="form-fill-step">
          <div className="form-notice">
            <AlertCircle size={16} />
            <span>Fields highlighted in blue are <strong>auto-filled</strong> from your profile. You can edit them if needed.</span>
          </div>
          {draftSaved && (
            <div className="form-notice form-notice-draft">
              <Save size={16} />
              <span>Draft saved automatically. Your progress will be restored if you reload.</span>
              <button
                onClick={() => {
                  localStorage.removeItem(draftKey);
                  setDraftSaved(false);
                  toast.success('Draft cleared');
                }}
                className="draft-clear-btn"
              >Clear Draft</button>
            </div>
          )}

          {/* Student Picker for Multi-Student Endorsement Letter */}
          {isMultiEndorsement && (
            <>
              <StudentPicker
                selectedStudents={selectedStudents}
                onAddStudent={(student) => {
                  setSelectedStudents(prev => [...prev, student]);
                  if (errors['selected_students']) {
                    setErrors(prev => { const next = { ...prev }; delete next['selected_students']; return next; });
                  }
                }}
                onRemoveStudent={(id) => setSelectedStudents(prev => prev.filter(s => s.id !== id))}
                currentStudentName={currentStudentName}
              />
              {errors['selected_students'] && (
                <div className="field-error" style={{ marginTop: '-8px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={14} /> {errors['selected_students']}
                </div>
              )}
            </>
          )}

          {Object.entries(groupedFields()).map(([section, sectionFields]) => {
            // Hide the "Students" section for multi-endorsement — handled by StudentPicker above
            if (isMultiEndorsement && section === 'Students') return null;
            const repeatGroup = sectionFields[0]?.repeatGroup;
            const isRepeatable = !!repeatGroup;
            const repeatMax = sectionFields.find(f => f.repeatMax)?.repeatMax || 1;
            const currentCount = repeatCounts[repeatGroup || ''] || 1;

            const renderFieldInput = (field: FormField) => (
              <div key={field.name} className={`form-field ${field.type === 'image' ? 'image-field' : ''} ${errors[field.name] ? 'has-error' : ''} ${autoFillKeys.has(field.name) ? 'auto-filled' : ''}`}>
                <label htmlFor={`field-${field.name}`}>
                  {field.label}
                  {field.required && <span className="required">*</span>}
                  {autoFillKeys.has(field.name) && <span className="auto-badge">Auto</span>}
                </label>
                {field.type === 'image' ? (
                  <div className="image-upload-area">
                    {imageLoading[field.name] ? (
                      <div className="image-loading">
                        <Loader2 className="spin" size={28} />
                        <span>Uploading photo...</span>
                      </div>
                    ) : formData[field.name] ? (
                      <div className="image-preview-wrapper">
                        <img src={formData[field.name]} alt="Uploaded photo" className="image-preview" />
                        <button type="button" className="image-remove-btn" onClick={() => handleRemoveImage(field.name)}>
                          <X size={14} />
                        </button>
                        <label htmlFor={`field-${field.name}`} className="image-change-btn">Change Photo</label>
                      </div>
                    ) : (
                      <label htmlFor={`field-${field.name}`} className="image-upload-label">
                        <ImagePlus size={28} />
                        <span>Click to upload 2x2 photo</span>
                        <span className="image-hint">JPG or PNG, max 2MB</span>
                      </label>
                    )}
                    <input
                      id={`field-${field.name}`}
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={(e) => handleImageUpload(field.name, e.target.files?.[0] || null)}
                      style={{ display: 'none' }}
                    />
                  </div>
                ) : field.type === 'textarea' ? (
                  <textarea
                    id={`field-${field.name}`}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                  />
                ) : field.type === 'select' && field.options ? (
                  <select
                    id={`field-${field.name}`}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                  >
                    <option value="">— Select —</option>
                    {field.options.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`field-${field.name}`}
                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    readOnly={computedFields.has(field.name)}
                    style={computedFields.has(field.name) ? { background: '#f0fdf4', fontWeight: 700, color: '#166534', cursor: 'default' } : undefined}
                  />
                )}
                {errors[field.name] && <span className="field-error">{errors[field.name]}</span>}
              </div>
            );

            return (
              <div key={section} className="form-section">
                <h3 className="section-title">{section}</h3>
                {isRepeatable ? (
                  <>
                    {Array.from({ length: currentCount }, (_, i) => i + 1).map(idx => {
                      const rowFields = sectionFields.filter(f => f.repeatIndex === idx);
                      return (
                        <div key={idx} className="repeat-entry">
                          <div className="repeat-entry-label">{section.includes('Semester') ? `Subject ${idx}` : section.includes('Failed') ? `Course ${idx}` : `Entry ${idx}`}</div>
                          <div className="section-fields">
                            {rowFields.map(field => renderFieldInput(field))}
                          </div>
                        </div>
                      );
                    })}
                    <div className="repeat-actions">
                      {currentCount < repeatMax && (
                        <button type="button" className="repeat-btn repeat-btn-add" onClick={() => handleAddRow(repeatGroup!)}>
                          <PlusCircle size={16} /> {section.includes('Semester') ? 'Add Subject' : section.includes('Failed') ? 'Add Course' : 'Add Entry'}
                        </button>
                      )}
                      {currentCount > 1 && (
                        <button type="button" className="repeat-btn repeat-btn-remove" onClick={() => handleRemoveRow(repeatGroup!)}>
                          <MinusCircle size={16} /> Remove Last
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="section-fields">
                    {sectionFields.map(field => renderFieldInput(field))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="form-actions">
            <button onClick={() => navigate('/student/documents')} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handlePreview} className="btn-primary" disabled={previewLoading}>
              {previewLoading ? (
                <><Loader2 className="spin" size={16} /> Generating Preview...</>
              ) : (
                <><Eye size={16} /> Preview Document</>
              )}
            </button>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="form-preview-step">
          <div className="preview-toolbar">
            <p className="preview-note">Review your document carefully. If everything looks good, click <strong>Finalize</strong> to submit.</p>
            <div className="preview-actions">
              <button onClick={() => setStep('fill')} className="btn-secondary">
                <Edit3 size={16} /> Edit Form
              </button>
              <button onClick={handleFinalize} className="btn-success" disabled={submitting}>
                {submitting ? (
                  <><Loader2 className="spin" size={16} /> Generating PDF...</>
                ) : (
                  <><FileCheck size={16} /> Finalize & Submit</>
                )}
              </button>
            </div>
          </div>

          <div className="preview-container">
            <iframe
              srcDoc={previewHtml}
              title="Document Preview"
              className="preview-iframe"
            />
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="form-done-step">
          <div className="done-card">
            {isMultiEndorsement ? (
              <>
                <Users size={48} className="done-icon" style={{ color: '#f59e0b' }} />
                <h2>Endorsement Letter Submitted!</h2>
                <p>Your multi-student endorsement letter has been sent to the included students for <strong>acceptance</strong>. The PDF will be generated automatically once all students have accepted.</p>
                <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '-12px' }}>You can track the status in your Documents tab.</p>
                <button onClick={() => navigate('/student/documents')} className="btn-primary">
                  Go to Documents
                </button>
              </>
            ) : (
              <>
                <CheckCircle size={48} className="done-icon" />
                <h2>Document Generated Successfully!</h2>
                <p>Your <strong>{title}</strong> has been generated and submitted for review. You can view it in your Documents tab.</p>
                <button onClick={() => navigate('/student/documents')} className="btn-primary">
                  Go to Documents
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        .document-form-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 24px;
        }

        .form-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 300px;
          gap: 12px;
          color: #6b7280;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ── Polished Header Card ── */
        .dfp-header-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 20px 24px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06);
        }

        .dfp-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: #6b7280;
          font-size: 13px;
          cursor: pointer;
          padding: 4px 8px 4px 0;
          margin-bottom: 14px;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .dfp-back-btn:hover {
          color: #111827;
          background: #f3f4f6;
          padding-left: 8px;
        }

        .dfp-header-content {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .dfp-header-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .dfp-header-title {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 2px 0;
          line-height: 1.3;
        }

        .dfp-header-subtitle {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
        }

        /* ── Stepper (inside header) ── */
        .dfp-stepper {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: auto;
          flex-shrink: 0;
        }

        .dfp-step {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #9ca3af;
          font-weight: 500;
          white-space: nowrap;
        }

        .dfp-step.active { color: #4361ee; }
        .dfp-step.completed { color: #10b981; }

        .dfp-step-dot {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          background: #f3f4f6;
          border: 2px solid #e5e7eb;
          transition: all 0.2s;
        }

        .dfp-step.active .dfp-step-dot {
          background: #4361ee;
          color: white;
          border-color: #4361ee;
        }

        .dfp-step.completed .dfp-step-dot {
          background: #10b981;
          color: white;
          border-color: #10b981;
        }

        .dfp-step-line {
          width: 28px;
          height: 2px;
          background: #e5e7eb;
          border-radius: 1px;
        }

        @media (max-width: 768px) {
          .document-form-page { padding: 12px; }
          .dfp-header-card { padding: 14px 16px; border-radius: 12px; }
          .dfp-header-content { flex-direction: column; align-items: flex-start; gap: 10px; }
          .dfp-header-icon { width: 40px; height: 40px; border-radius: 10px; }
          .dfp-header-title { font-size: 17px; }
          .dfp-stepper { margin-left: 0; margin-top: 8px; flex-wrap: wrap; }
          .dfp-step span { display: none; }
          .dfp-step-line { width: 18px; }
          .form-notice { font-size: 12px; padding: 10px 12px; }
          .section-title { font-size: 14px; padding: 12px 14px; }
          .section-fields { padding: 14px; gap: 12px; }
          .form-actions { flex-direction: column; }
          .form-actions .btn-primary,
          .form-actions .btn-secondary,
          .form-actions .btn-success { width: 100%; justify-content: center; }
          .preview-toolbar { flex-direction: column; align-items: stretch; }
          .preview-actions { justify-content: stretch; }
          .preview-actions .btn-secondary,
          .preview-actions .btn-success { flex: 1; justify-content: center; }
          .done-card { padding: 24px 16px; margin: 0 8px; }
        }

        /* ── Template Selector Grid ── */
        .dfp-template-grid {
          max-width: 700px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .dfp-template-card {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 16px;
          padding: 28px 20px;
          cursor: pointer;
          text-align: center;
          transition: all 0.25s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .dfp-template-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        }

        .dfp-template-blue:hover { border-color: #3b82f6; box-shadow: 0 8px 24px rgba(59,130,246,0.12); }
        .dfp-template-purple:hover { border-color: #8b5cf6; box-shadow: 0 8px 24px rgba(139,92,246,0.12); }

        .dfp-template-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
        }

        .dfp-template-title {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 6px 0;
        }

        .dfp-template-desc {
          font-size: 13px;
          color: #6b7280;
          line-height: 1.5;
          margin: 0 0 14px 0;
        }

        .dfp-template-action {
          font-size: 13px;
          font-weight: 600;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .dfp-template-card:hover .dfp-template-action { opacity: 1; }

        @media (max-width: 480px) {
          .dfp-template-grid { grid-template-columns: 1fr; }
        }

        /* Form Notice */
        .form-notice {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: 8px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1e40af;
          font-size: 13px;
          margin-bottom: 24px;
        }

        /* Form Sections */
        .form-section {
          margin-bottom: 24px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
        }

        .section-title {
          font-size: 15px;
          font-weight: 600;
          color: #111827;
          padding: 14px 20px;
          margin: 0;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        .section-fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          padding: 20px;
        }

        @media (max-width: 640px) {
          .section-fields {
            grid-template-columns: 1fr;
          }
        }

        /* Form Fields */
        .form-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .form-field label {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .required {
          color: #ef4444;
        }

        .auto-badge {
          font-size: 10px;
          padding: 1px 6px;
          border-radius: 4px;
          background: #e0e7ff;
          color: #4361ee;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .form-field input,
        .form-field textarea,
        .form-field select {
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          color: #111827;
          background: #ffffff;
          transition: all 0.2s;
        }

        .form-field input:focus,
        .form-field textarea:focus,
        .form-field select:focus {
          outline: none;
          border-color: #4361ee;
          box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
        }

        .form-field.auto-filled input,
        .form-field.auto-filled textarea {
          background: #eff6ff;
          border-color: #bfdbfe;
        }

        .form-field.has-error input,
        .form-field.has-error textarea {
          border-color: #ef4444;
          background: #fef2f2;
        }

        .field-error {
          font-size: 12px;
          color: #ef4444;
        }

        .form-field textarea {
          resize: vertical;
          min-height: 80px;
        }

        /* Actions */
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 16px;
        }

        .btn-primary,
        .btn-secondary,
        .btn-success {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #4361ee;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #3a56d4;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .btn-secondary:hover {
          background: #e5e7eb;
        }

        .btn-success {
          background: #10b981;
          color: white;
        }

        .btn-success:hover:not(:disabled) {
          background: #059669;
        }

        .btn-primary:disabled,
        .btn-success:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Preview */
        .form-preview-step {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .preview-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .preview-note {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .preview-actions {
          display: flex;
          gap: 8px;
        }

        .preview-container {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          background: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .preview-iframe {
          width: 100%;
          min-height: 800px;
          border: none;
          display: block;
        }

        /* Done */
        .form-done-step {
          display: flex;
          justify-content: center;
          padding: 40px 0;
        }

        .done-card {
          text-align: center;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 40px;
          max-width: 500px;
        }

        .done-icon {
          color: #10b981;
          margin: 0 auto 16px auto;
          display: block;
        }

        .done-card h2 {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 8px 0;
        }

        .done-card p {
          font-size: 14px;
          color: #6b7280;
          margin: 0 0 24px 0;
          line-height: 1.6;
        }

        /* Image Upload */
        .image-field {
          grid-column: 1 / -1;
        }

        .image-upload-area {
          display: flex;
          justify-content: center;
        }

        .image-upload-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 160px;
          height: 160px;
          border: 2px dashed #d1d5db;
          border-radius: 12px;
          cursor: pointer;
          color: #9ca3af;
          font-size: 13px;
          text-align: center;
          transition: all 0.2s;
          padding: 12px;
        }

        .image-upload-label:hover {
          border-color: #4361ee;
          color: #4361ee;
          background: #e0e7ff;
        }

        .image-hint {
          font-size: 11px;
          opacity: 0.7;
        }

        .image-preview-wrapper {
          position: relative;
          width: 160px;
          height: 160px;
        }

        .image-preview {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 10px;
          border: 2px solid #e5e7eb;
        }

        .image-remove-btn {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #ef4444;
          color: white;
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 0;
          transition: transform 0.15s;
        }

        .image-remove-btn:hover {
          transform: scale(1.1);
          background: #dc2626;
        }

        .image-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 160px;
          height: 160px;
          border: 2px dashed #4361ee;
          border-radius: 12px;
          color: #4361ee;
          font-size: 13px;
          background: #e0e7ff;
        }

        .image-change-btn {
          display: block;
          text-align: center;
          margin-top: 6px;
          font-size: 12px;
          color: #4361ee;
          cursor: pointer;
          font-weight: 500;
          text-decoration: underline;
        }

        .image-change-btn:hover {
          color: #3a56d4;
        }

        /* Repeatable Groups */
        .repeat-entry {
          border-bottom: 1px dashed #e5e7eb;
        }

        .repeat-entry:last-of-type {
          border-bottom: none;
        }

        .repeat-entry-label {
          font-size: 12px;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 12px 20px 0 20px;
        }

        .repeat-actions {
          display: flex;
          gap: 10px;
          padding: 12px 20px 16px 20px;
          border-top: 1px solid #e5e7eb;
        }

        .repeat-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid #d1d5db;
          transition: all 0.2s;
        }

        .repeat-btn-add {
          background: #e0e7ff;
          color: #4361ee;
          border-color: #4361ee;
        }

        .repeat-btn-add:hover {
          background: #4361ee;
          color: white;
        }

        .repeat-btn-remove {
          background: #fef2f2;
          color: #ef4444;
          border-color: #ef4444;
        }

        .repeat-btn-remove:hover {
          background: #ef4444;
          color: white;
        }

        /* Icon color helpers */
        .dfp-icon-blue { background: #eff6ff; color: #3b82f6; }
        .dfp-icon-purple { background: #f5f3ff; color: #8b5cf6; }
        .dfp-action-blue { color: #3b82f6; }
        .dfp-action-purple { color: #8b5cf6; }

        /* Draft saved notice */
        .form-notice-draft {
          background: #e8f5e9;
          border-color: #4caf50;
          color: #2e7d32;
          margin-top: -8px;
        }

        .draft-clear-btn {
          margin-left: auto;
          background: none;
          border: none;
          color: #c62828;
          cursor: pointer;
          font-size: 12px;
          text-decoration: underline;
        }

        /* ══════════════════════════════════════════
           DARK MODE — scoped under .dark ancestor
           ══════════════════════════════════════════ */

        .dark .form-loading { color: #9ca3af; }

        /* Icon helpers dark */
        .dark .dfp-icon-blue { background: rgba(59,130,246,0.12); color: #60a5fa; }
        .dark .dfp-icon-purple { background: rgba(139,92,246,0.12); color: #a78bfa; }
        .dark .dfp-action-blue { color: #60a5fa; }
        .dark .dfp-action-purple { color: #a78bfa; }

        /* Draft notice dark */
        .dark .form-notice-draft {
          background: rgba(76,175,80,0.08);
          border-color: rgba(76,175,80,0.3);
          color: #81c784;
        }
        .dark .draft-clear-btn { color: #ef9a9a; }

        /* Header Card */
        .dark .dfp-header-card {
          background: #212124;
          border-color: #374151;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }

        .dark .dfp-back-btn { color: #9ca3af; }
        .dark .dfp-back-btn:hover { color: #f3f4f6; background: #374151; }

        .dark .dfp-header-title { color: #f9fafb; }
        .dark .dfp-header-subtitle { color: #9ca3af; }

        /* Stepper */
        .dark .dfp-step { color: #6b7280; }
        .dark .dfp-step.active { color: #6d8cff; }
        .dark .dfp-step.completed { color: #34d399; }
        .dark .dfp-step-dot { background: #374151; border-color: #4b5563; color: #9ca3af; }
        .dark .dfp-step.active .dfp-step-dot { background: #4361ee; border-color: #4361ee; color: white; }
        .dark .dfp-step.completed .dfp-step-dot { background: #10b981; border-color: #10b981; color: white; }
        .dark .dfp-step-line { background: #4b5563; }

        /* Template Selector */
        .dark .dfp-template-card { background: #212124; border-color: #374151; }
        .dark .dfp-template-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
        .dark .dfp-template-title { color: #f9fafb; }
        .dark .dfp-template-desc { color: #9ca3af; }

        /* Form Notice */
        .dark .form-notice {
          background: rgba(59,130,246,0.1);
          border-color: rgba(59,130,246,0.3);
          color: #93c5fd;
        }

        /* Form Sections */
        .dark .form-section {
          background: #212124;
          border-color: #374151;
        }

        .dark .section-title {
          color: #f3f4f6;
          background: #1a1a1d;
          border-bottom-color: #374151;
        }

        /* Form Fields */
        .dark .form-field label { color: #d1d5db; }

        .dark .auto-badge {
          background: rgba(67,97,238,0.15);
          color: #818cf8;
        }

        .dark .form-field input,
        .dark .form-field textarea,
        .dark .form-field select {
          border-color: #4b5563;
          color: #f3f4f6;
          background: #1a1a1d;
        }

        .dark .form-field input:focus,
        .dark .form-field textarea:focus,
        .dark .form-field select:focus {
          border-color: #6d8cff;
          box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.2);
        }

        .dark .form-field.auto-filled input,
        .dark .form-field.auto-filled textarea {
          background: rgba(59,130,246,0.08);
          border-color: rgba(59,130,246,0.3);
        }

        .dark .form-field.has-error input,
        .dark .form-field.has-error textarea {
          border-color: #f87171;
          background: rgba(239,68,68,0.08);
        }

        .dark .field-error { color: #f87171; }

        /* Buttons */
        .dark .btn-secondary {
          background: #374151;
          color: #d1d5db;
          border-color: #4b5563;
        }
        .dark .btn-secondary:hover { background: #4b5563; }

        /* Preview */
        .dark .preview-note { color: #9ca3af; }
        .dark .preview-container {
          border-color: #374151;
          background: #1a1a1d;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        /* Done Card */
        .dark .done-card {
          background: #212124;
          border-color: #374151;
        }
        .dark .done-card h2 { color: #f9fafb; }
        .dark .done-card p { color: #9ca3af; }

        /* Image Upload */
        .dark .image-upload-label {
          border-color: #4b5563;
          color: #6b7280;
        }
        .dark .image-upload-label:hover {
          border-color: #6d8cff;
          color: #6d8cff;
          background: rgba(67,97,238,0.1);
        }
        .dark .image-preview { border-color: #4b5563; }
        .dark .image-remove-btn { border-color: #212124; }
        .dark .image-loading {
          border-color: #6d8cff;
          color: #6d8cff;
          background: rgba(67,97,238,0.1);
        }
        .dark .image-change-btn { color: #6d8cff; }
        .dark .image-change-btn:hover { color: #818cf8; }

        /* Repeatable Groups */
        .dark .repeat-entry { border-bottom-color: #374151; }
        .dark .repeat-entry-label { color: #6b7280; }
        .dark .repeat-actions { border-top-color: #374151; }
        .dark .repeat-btn { border-color: #4b5563; }
        .dark .repeat-btn-add {
          background: rgba(67,97,238,0.12);
          color: #818cf8;
          border-color: #6d8cff;
        }
        .dark .repeat-btn-add:hover { background: #4361ee; color: white; }
        .dark .repeat-btn-remove {
          background: rgba(239,68,68,0.08);
          color: #f87171;
          border-color: #f87171;
        }
        .dark .repeat-btn-remove:hover { background: #ef4444; color: white; }

        /* ══════════════════════════════════════
           Student Picker — light mode
           ══════════════════════════════════════ */
        .sp-current-note {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          padding: 10px 14px;
          margin: 12px 20px;
          font-size: 13px;
          color: #1e40af;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sp-search-wrapper {
          position: relative;
          margin: 0 20px 12px 20px;
        }

        .sp-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          z-index: 1;
        }

        .sp-search-input {
          width: 100%;
          padding: 10px 12px 10px 38px;
          border-radius: 10px;
          border: 1px solid #d1d5db;
          font-size: 14px;
          outline: none;
          background: #ffffff;
          color: #111827;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }

        .sp-search-input:focus {
          border-color: #4361ee;
          box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
        }

        .sp-search-spinner {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #6b7280;
        }

        .sp-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.12);
          max-height: 250px;
          overflow-y: auto;
          z-index: 50;
          margin-top: 4px;
        }

        .sp-dropdown-empty {
          padding: 16px;
          text-align: center;
          color: #9ca3af;
          font-size: 13px;
        }

        .sp-dropdown-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border: none;
          border-bottom: 1px solid #f3f4f6;
          background: transparent;
          cursor: pointer;
          text-align: left;
          font-size: 13px;
          transition: background 0.15s;
        }

        .sp-dropdown-item:hover {
          background: #f0f9ff;
        }

        .sp-dropdown-avatar {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #dbeafe;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #3b82f6;
        }

        .sp-dropdown-info { flex: 1; min-width: 0; }
        .sp-dropdown-name { font-weight: 600; color: #111827; }
        .sp-dropdown-meta { font-size: 11px; color: #6b7280; }
        .sp-dropdown-add { font-size: 11px; color: #3b82f6; font-weight: 500; }

        .sp-selected-list {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          overflow: hidden;
          margin: 0 20px 12px 20px;
        }

        .sp-selected-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-bottom: 1px solid #f3f4f6;
          background: white;
        }

        .sp-selected-row-even { background: #fafafa; }

        .sp-selected-num {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          background: #eff6ff;
          color: #3b82f6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .sp-selected-info { flex: 1; min-width: 0; }
        .sp-selected-name { font-weight: 600; font-size: 13px; color: #111827; }
        .sp-selected-meta { font-size: 11px; color: #6b7280; }

        .sp-remove-btn {
          background: none;
          border: none;
          color: #ef4444;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          display: flex;
          align-items: center;
        }

        .sp-remove-btn:hover { background: #fef2f2; }

        .sp-empty-state {
          text-align: center;
          padding: 24px;
          color: #9ca3af;
          font-size: 13px;
          border: 2px dashed #e5e7eb;
          border-radius: 10px;
          margin: 0 20px 12px 20px;
        }

        /* Student Picker — dark mode */
        .dark .sp-current-note {
          background: rgba(59,130,246,0.1);
          border-color: rgba(59,130,246,0.3);
          color: #93c5fd;
        }

        .dark .sp-search-icon { color: #6b7280; }

        .dark .sp-search-input {
          background: #1a1a1d;
          color: #f3f4f6;
          border-color: #4b5563;
        }

        .dark .sp-search-input:focus {
          border-color: #6d8cff;
          box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.2);
        }

        .dark .sp-search-spinner { color: #9ca3af; }

        .dark .sp-dropdown {
          background: #212124;
          border-color: #374151;
          box-shadow: 0 10px 25px rgba(0,0,0,0.4);
        }

        .dark .sp-dropdown-empty { color: #6b7280; }

        .dark .sp-dropdown-item { border-bottom-color: #2d2d30; }
        .dark .sp-dropdown-item:hover { background: rgba(59,130,246,0.08); }

        .dark .sp-dropdown-avatar { background: rgba(59,130,246,0.15); color: #60a5fa; }
        .dark .sp-dropdown-name { color: #f3f4f6; }
        .dark .sp-dropdown-meta { color: #9ca3af; }
        .dark .sp-dropdown-add { color: #60a5fa; }

        .dark .sp-selected-list { border-color: #374151; }
        .dark .sp-selected-row { border-bottom-color: #2d2d30; background: #212124; }
        .dark .sp-selected-row-even { background: #1a1a1d; }
        .dark .sp-selected-num { background: rgba(59,130,246,0.12); color: #60a5fa; }
        .dark .sp-selected-name { color: #f3f4f6; }
        .dark .sp-selected-meta { color: #9ca3af; }
        .dark .sp-remove-btn { color: #f87171; }
        .dark .sp-remove-btn:hover { background: rgba(239,68,68,0.1); }

        .dark .sp-empty-state { color: #6b7280; border-color: #374151; }

        /* ══════════════════════════════
           Student Picker — responsive
           ══════════════════════════════ */
        @media (max-width: 768px) {
          .sp-current-note { margin: 10px 14px; font-size: 12px; }
          .sp-search-wrapper { margin: 0 14px 10px 14px; }
          .sp-selected-list { margin: 0 14px 10px 14px; }
          .sp-empty-state { margin: 0 14px 10px 14px; padding: 16px; }
        }
      `}</style>
    </div>
  );
};

export default DocumentFormPage;
