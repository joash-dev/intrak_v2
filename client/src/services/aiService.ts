import api from '../api/AxiosClient';

export interface GenerateEvaluationRemarksParams {
  competencyId: string;
  rating: number;
  studentId: string;
  competencyTitle?: string;
  ratingCriteria?: string;
}

export interface GenerateDocumentFeedbackParams {
  documentId: string;
  action: 'approve' | 'reject' | 'request_changes';
}

export interface GenerateAttendanceNoteParams {
  attendanceLogId: string;
  action: 'approve' | 'reject';
}

export interface GenerateWeeklyReportSummaryParams {
  tasksAccomplished: string;
  knowledgeSkillsValues: string;
}

export interface GenerateOverallCommentsParams {
  studentId: string;
  competencies: Array<{
    id: string;
    title: string;
    rating: number;
    remarks?: string;
  }>;
  overallRating: number;
  terminationData?: {
    terminated: boolean;
    reasons?: string[];
  };
}

export interface GenerateForm18CommentsParams {
  studentId: string;
  ratings: {
    punctualRating: number;
    knowledgeRating: number;
    teamworkRating: number;
    taskPerformanceRating: number;
    policyComplianceRating: number;
    conductRating: number;
    traitsRating: number;
  };
}

export interface GenerateInstructorEvaluationCommentsParams {
  studentId: string;
  ratings?: Record<string, number>;
  overallRating?: number;
}

export interface GenerateImprovementSuggestionsParams {
  studentId: string;
  currentPerformance?: string;
  ratings?: Record<string, number>;
}

export interface GenerateAnnouncementContentParams {
  title: string;
  audience: string;
  type?: string;
}

class AIService {
  async generateEvaluationRemarks(params: GenerateEvaluationRemarksParams): Promise<string> {
    try {
      const response = await api.post('/ai/evaluation-remarks', params);
      return response.data.remarks || '';
    } catch (error: any) {
      console.error('Error generating evaluation remarks:', error);
      throw new Error(error.response?.data?.message || 'Failed to generate remarks');
    }
  }

  async generateDocumentFeedback(params: GenerateDocumentFeedbackParams): Promise<string> {
    try {
      const response = await api.post('/ai/document-feedback', params);
      return response.data.feedback || '';
    } catch (error: any) {
      console.error('Error generating document feedback:', error);
      throw new Error(error.response?.data?.message || 'Failed to generate feedback');
    }
  }

  async generateAttendanceNote(params: GenerateAttendanceNoteParams): Promise<string> {
    try {
      const response = await api.post('/ai/attendance-note', params);
      return response.data.note || '';
    } catch (error: any) {
      console.error('Error generating attendance note:', error);
      throw new Error(error.response?.data?.message || 'Failed to generate note');
    }
  }

  async generateWeeklyReportSummary(params: GenerateWeeklyReportSummaryParams): Promise<string> {
    try {
      const response = await api.post('/ai/weekly-report-summary', params);
      return response.data.summary || '';
    } catch (error: any) {
      console.error('Error generating weekly report summary:', error);
      throw new Error(error.response?.data?.message || 'Failed to generate summary');
    }
  }

  async generateOverallComments(params: GenerateOverallCommentsParams): Promise<string> {
    try {
      const response = await api.post('/ai/overall-comments', params);
      return response.data.comments || '';
    } catch (error: any) {
      console.error('Error generating overall comments:', error);
      throw new Error(error.response?.data?.message || 'Failed to generate comments');
    }
  }

  async generateForm18Comments(params: GenerateForm18CommentsParams): Promise<string> {
    try {
      const response = await api.post('/ai/form18-comments', params);
      return response.data.comments || '';
    } catch (error: any) {
      console.error('Error generating Form 18 comments:', error);
      throw new Error(error.response?.data?.message || 'Failed to generate comments');
    }
  }

  async generateInstructorEvaluationComments(params: GenerateInstructorEvaluationCommentsParams): Promise<string> {
    try {
      const response = await api.post('/ai/instructor-evaluation-comments', params);
      return response.data.comments || '';
    } catch (error: any) {
      console.error('Error generating instructor evaluation comments:', error);
      throw new Error(error.response?.data?.message || 'Failed to generate comments');
    }
  }

  async generateImprovementSuggestions(params: GenerateImprovementSuggestionsParams): Promise<string> {
    try {
      const response = await api.post('/ai/improvement-suggestions', params);
      return response.data.suggestions || '';
    } catch (error: any) {
      console.error('Error generating improvement suggestions:', error);
      throw new Error(error.response?.data?.message || 'Failed to generate suggestions');
    }
  }

  async generateAnnouncementContent(params: GenerateAnnouncementContentParams): Promise<string> {
    try {
      const response = await api.post('/ai/announcement-content', params);
      return response.data.content || '';
    } catch (error: any) {
      console.error('Error generating announcement content:', error);
      throw new Error(error.response?.data?.message || 'Failed to generate content');
    }
  }
}

export const aiService = new AIService();

