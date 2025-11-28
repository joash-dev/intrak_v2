import { PrismaClient } from '@prisma/client';
import { getAIConfig, type AIProvider } from '../config/ai.config';

const prisma = new PrismaClient();

interface GenerateRemarksParams {
  competencyId: string;
  competencyTitle: string;
  rating: number;
  ratingCriteria: string;
  studentId: string;
  studentName?: string;
  attendanceData?: {
    totalHours: number;
    onTimePercentage: number;
    absences: number;
  };
  documentData?: {
    totalSubmitted: number;
    approved: number;
    rejected: number;
  };
}

interface GenerateDocumentFeedbackParams {
  documentType: string;
  documentTitle: string;
  action: 'approve' | 'reject' | 'request_changes';
  studentName: string;
  studentHistory?: {
    previousSubmissions: number;
    approvalRate: number;
  };
  rejectionReasons?: string[];
}

interface GenerateAttendanceNoteParams {
  studentName: string;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
  action: 'approve' | 'reject';
  issues?: string[];
  location?: string;
  attendanceHistory?: {
    onTimePercentage: number;
    recentAbsences: number;
  };
}

interface GenerateOverallCommentsParams {
  studentName: string;
  competencies: Array<{
    id: string;
    title: string;
    rating: number;
    remarks?: string;
  }>;
  overallRating: number;
  attendanceData?: {
    totalHours: number;
    onTimePercentage: number;
  };
  terminationData?: {
    terminated: boolean;
    reasons?: string[];
  };
}

interface GenerateForm18CommentsParams {
  studentName: string;
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

interface GenerateInstructorEvaluationCommentsParams {
  studentName: string;
  studentId: string;
  ratings?: Record<string, number>;
  overallRating?: number;
  attendanceData?: {
    totalHours: number;
    onTimePercentage: number;
  };
}

interface GenerateImprovementSuggestionsParams {
  studentName: string;
  studentId: string;
  currentPerformance: string;
  ratings?: Record<string, number>;
  attendanceData?: {
    totalHours: number;
    onTimePercentage: number;
  };
}

interface GenerateAnnouncementContentParams {
  title: string;
  audience: string;
  type?: string;
}

class AIService {
  private config = getAIConfig();

  private async callOpenAI(prompt: string): Promise<string> {
    if (!this.config.enabled || !this.config.apiKey) {
      throw new Error('AI service is not configured or enabled');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: 'You are a professional assistant helping supervisors write evaluation remarks for student interns. Write clear, constructive, and professional feedback that is appropriate for an academic/industry setting.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
        }),
      });

      if (!response.ok) {
        const error: any = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
      }

      const data: any = await response.json();
      return data.choices[0]?.message?.content?.trim() || '';
    } catch (error: any) {
      console.error('OpenAI API call failed:', error);
      throw new Error(`Failed to generate AI content: ${error.message}`);
    }
  }

  private async callAnthropic(prompt: string): Promise<string> {
    if (!this.config.enabled || !this.config.apiKey) {
      throw new Error('AI service is not configured or enabled');
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: this.config.maxTokens,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          system: 'You are a professional assistant helping supervisors write evaluation remarks for student interns. Write clear, constructive, and professional feedback that is appropriate for an academic/industry setting.',
        }),
      });

      if (!response.ok) {
        const error: any = await response.json();
        throw new Error(`Anthropic API error: ${error.error?.message || 'Unknown error'}`);
      }

      const data: any = await response.json();
      return data.content[0]?.text?.trim() || '';
    } catch (error: any) {
      console.error('Anthropic API call failed:', error);
      throw new Error(`Failed to generate AI content: ${error.message}`);
    }
  }

  private async callGemini(prompt: string): Promise<string> {
    if (!this.config.enabled || !this.config.apiKey) {
      throw new Error('AI service is not configured or enabled');
    }

    try {
      // Google Gemini API endpoint
      // Available models: models/gemini-2.5-flash, models/gemini-2.0-flash, models/gemini-2.5-pro
      // Model names must include 'models/' prefix
      let modelName = this.config.model;
      
      // Map legacy/incorrect model names to available models
      if (modelName === 'gemini-1.5-flash' || modelName === 'gemini-1.5-pro') {
        modelName = 'gemini-2.5-flash'; // Use 2.5 instead of 1.5
      } else if (modelName === 'gemini-pro') {
        modelName = 'gemini-2.5-flash'; // Use flash as default
      }
      
      // Ensure model name has 'models/' prefix
      if (!modelName.startsWith('models/')) {
        modelName = `models/${modelName}`;
      }
      
      // Use v1 API (works for all current models)
      const url = `https://generativelanguage.googleapis.com/v1/${modelName}:generateContent?key=${this.config.apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a professional assistant helping supervisors write evaluation remarks for student interns. Write clear, constructive, and professional feedback that is appropriate for an academic/industry setting.\n\n${prompt}`
            }]
          }],
          generationConfig: {
            // Gemini 2.5 Flash uses "thinking tokens" which count towards maxOutputTokens
            // We need significantly more tokens to account for thinking (typically 500-1000 tokens)
            // Set to at least 2000 to ensure we get actual output after thinking
            maxOutputTokens: Math.max(this.config.maxTokens, 2000),
            temperature: this.config.temperature,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Unknown error';
        try {
          const error: any = JSON.parse(errorText);
          errorMessage = error.error?.message || error.message || errorText;
        } catch {
          errorMessage = errorText;
        }
        throw new Error(`Gemini API error: ${errorMessage}`);
      }

      const data: any = await response.json();
      
      // Check for finish reason
      const finishReason = data.candidates?.[0]?.finishReason;
      
      // Handle safety filters or blocked content
      if (finishReason === 'SAFETY' || finishReason === 'RECITATION') {
        throw new Error('Content was blocked by safety filters. Please try with different input.');
      }
      
      if (finishReason === 'MAX_TOKENS') {
        console.warn('Gemini response was truncated due to token limit. Consider increasing AI_MAX_TOKENS.');
        // Still try to return what we got
      }
      
      // Extract text from response
      let text = '';
      const candidate = data.candidates?.[0];
      
      if (candidate?.content?.parts) {
        // Check all parts for text
        for (const part of candidate.content.parts) {
          if (part.text) {
            text += part.text + ' ';
          }
        }
        text = text.trim();
      }
      
      if (!text) {
        // Log full response for debugging
        const usageMetadata = data.usageMetadata || {};
        const thinkingTokens = usageMetadata.thoughtsTokenCount || 0;
        const totalTokens = usageMetadata.totalTokenCount || 0;
        
        console.error('Gemini API returned empty text.');
        console.error('Finish reason:', finishReason);
        console.error('Token usage:', { thinkingTokens, totalTokens, maxTokens: this.config.maxTokens });
        
        if (finishReason === 'MAX_TOKENS') {
          // Calculate recommended tokens (thinking tokens + output tokens)
          const recommendedTokens = Math.max(thinkingTokens + 500, 2000);
          throw new Error(`Response exceeded token limit. The model used ${thinkingTokens} tokens for thinking. Please increase AI_MAX_TOKENS in your .env file to at least ${recommendedTokens} (current: ${this.config.maxTokens}).`);
        } else if (finishReason) {
          throw new Error(`AI generation stopped: ${finishReason}. Please try again or contact support.`);
        } else {
          throw new Error('AI returned empty response. Please check your API key and model configuration.');
        }
      }
      
      return text;
    } catch (error: any) {
      console.error('Gemini API call failed:', error);
      throw new Error(`Failed to generate AI content: ${error.message}`);
    }
  }

  private async generateText(prompt: string): Promise<string> {
    if (!this.config.enabled) {
      throw new Error('AI service is disabled');
    }

    if (this.config.provider === 'openai') {
      return this.callOpenAI(prompt);
    } else if (this.config.provider === 'anthropic') {
      return this.callAnthropic(prompt);
    } else if (this.config.provider === 'gemini') {
      return this.callGemini(prompt);
    } else {
      throw new Error(`Unsupported AI provider: ${this.config.provider}`);
    }
  }

  async generateEvaluationRemarks(params: GenerateRemarksParams): Promise<string> {
    const {
      competencyId,
      competencyTitle,
      rating,
      ratingCriteria,
      studentId,
      studentName = 'the student',
      attendanceData,
      documentData,
    } = params;

    let contextInfo = '';
    if (attendanceData) {
      contextInfo += `\n- Attendance: ${attendanceData.totalHours} total hours, ${attendanceData.onTimePercentage}% on-time rate, ${attendanceData.absences} absences`;
    }
    if (documentData) {
      contextInfo += `\n- Documents: ${documentData.totalSubmitted} submitted, ${documentData.approved} approved, ${documentData.rejected} rejected`;
    }

    const prompt = `Generate professional evaluation remarks for ${studentName} regarding "${competencyTitle}".

Rating: ${rating}/5
Rating Criteria: ${ratingCriteria}
${contextInfo}

Write 2-3 sentences that:
- Reflect the ${rating}/5 rating appropriately
- Are professional and constructive
- Provide specific, actionable feedback
- Are suitable for an official evaluation form

Do not include the student's name in the remarks. Write in third person.`;

    return this.generateText(prompt);
  }

  async generateDocumentFeedback(params: GenerateDocumentFeedbackParams): Promise<string> {
    const {
      documentType,
      documentTitle,
      action,
      studentName,
      studentHistory,
      rejectionReasons,
    } = params;

    let contextInfo = '';
    if (studentHistory) {
      contextInfo += `\nStudent has submitted ${studentHistory.previousSubmissions} previous documents with ${(studentHistory.approvalRate * 100).toFixed(0)}% approval rate.`;
    }

    let prompt = '';
    if (action === 'approve') {
      prompt = `Generate positive, encouraging feedback for approving ${studentName}'s ${documentType} document titled "${documentTitle}".${contextInfo}

Write 1-2 sentences that:
- Acknowledge the quality of the submission
- Are encouraging and professional
- Can be used as approval feedback`;
    } else if (action === 'reject') {
      const reasons = rejectionReasons?.join(', ') || 'quality issues';
      prompt = `Generate constructive rejection feedback for ${studentName}'s ${documentType} document titled "${documentTitle}".${contextInfo}

Rejection reasons: ${reasons}

Write 2-3 sentences that:
- Clearly explain why the document was rejected
- Provide specific, actionable improvement suggestions
- Maintain a professional and supportive tone
- Help the student understand what needs to be corrected`;
    } else {
      prompt = `Generate feedback requesting changes to ${studentName}'s ${documentType} document titled "${documentTitle}".${contextInfo}

Write 2-3 sentences that:
- Clearly specify what changes are needed
- Provide actionable guidance
- Maintain a professional and supportive tone`;
    }

    return this.generateText(prompt);
  }

  async generateAttendanceNote(params: GenerateAttendanceNoteParams): Promise<string> {
    const {
      studentName,
      date,
      timeIn,
      timeOut,
      action,
      issues,
      location,
      attendanceHistory,
    } = params;

    let contextInfo = '';
    if (attendanceHistory) {
      contextInfo += `\nStudent's attendance history: ${attendanceHistory.onTimePercentage}% on-time rate, ${attendanceHistory.recentAbsences} recent absences.`;
    }
    if (location) {
      contextInfo += `\nLocation: ${location}`;
    }

    let prompt = '';
    if (action === 'approve') {
      prompt = `Generate a brief verification note for approving ${studentName}'s attendance on ${date}.
Time In: ${timeIn || 'N/A'}
Time Out: ${timeOut || 'N/A'}${contextInfo}

Write 1 sentence that confirms the attendance is verified and approved.`;
    } else {
      const issuesText = issues?.join(', ') || 'verification issues';
      prompt = `Generate a professional rejection note for ${studentName}'s attendance on ${date}.
Time In: ${timeIn || 'N/A'}
Time Out: ${timeOut || 'N/A'}
Issues: ${issuesText}${contextInfo}

Write 1-2 sentences that:
- Explain why the attendance was rejected
- Are clear and professional
- Help the student understand the issue`;
    }

    return this.generateText(prompt);
  }

  async generateWeeklyReportSummary(tasksAccomplished: string, knowledgeSkillsValues: string): Promise<string> {
    const prompt = `A student has provided the following information for their weekly report:

Tasks Accomplished:
${tasksAccomplished || 'Not provided'}

Knowledge/Skills Gained:
${knowledgeSkillsValues || 'Not provided'}

Generate a professional 2-3 paragraph summary that:
- Synthesizes the tasks and learning outcomes
- Uses professional academic language
- Highlights key achievements and learning points
- Is suitable for an official weekly report

Write in first person as if the student wrote it.`;

    return this.generateText(prompt);
  }

  async generateOverallComments(params: GenerateOverallCommentsParams): Promise<string> {
    const {
      studentName,
      competencies,
      overallRating,
      attendanceData,
      terminationData,
    } = params;

    const competencySummary = competencies
      .map(c => `- ${c.title}: ${c.rating}/5`)
      .join('\n');

    let contextInfo = '';
    if (attendanceData) {
      contextInfo += `\nAttendance: ${attendanceData.totalHours} total hours, ${attendanceData.onTimePercentage}% on-time rate.`;
    }
    if (terminationData?.terminated) {
      contextInfo += `\nNote: Internship was terminated. Reasons: ${terminationData.reasons?.join(', ') || 'N/A'}`;
    }

    const prompt = `Generate overall evaluation comments for ${studentName} based on the following assessment:

Overall Rating: ${overallRating}/5

Competency Ratings:
${competencySummary}
${contextInfo}

Write 3-4 paragraphs that:
- Provide a comprehensive summary of the student's performance
- Synthesize all competency ratings into a cohesive narrative
- Highlight strengths and areas for improvement
- Include attendance and overall performance context
- Are professional and suitable for an official evaluation
- Can be used for recommendation letters or performance reviews

Write in third person. Do not include the student's name in the comments.`;

    return this.generateText(prompt);
  }

  async generateForm18Comments(params: GenerateForm18CommentsParams): Promise<string> {
    const { studentName, ratings } = params;

    const ratingSummary = Object.entries(ratings)
      .map(([key, value]) => {
        const label = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/Rating/g, '')
          .trim()
          .replace(/^./, str => str.toUpperCase());
        return `- ${label}: ${value}/5`;
      })
      .join('\n');

    const averageRating = Object.values(ratings).reduce((sum, rating) => sum + rating, 0) / Object.values(ratings).length;

    const prompt = `Generate professional comments and suggestions for ${studentName} based on the Training Supervisor's Feedback Form (Form 18) ratings:

Average Rating: ${averageRating.toFixed(1)}/5

Individual Ratings:
${ratingSummary}

Write 2-3 paragraphs that:
- Provide a comprehensive summary of the student's performance across all rated areas
- Highlight strengths based on higher ratings
- Offer constructive suggestions for areas with lower ratings
- Are professional and suitable for official supervisor feedback
- Can be used as "Other Comments and Suggestions" in Form 18

Write in third person. Do not include the student's name in the comments.`;

    return this.generateText(prompt);
  }

  async generateInstructorEvaluationComments(params: GenerateInstructorEvaluationCommentsParams): Promise<string> {
    const { studentName, ratings, overallRating, attendanceData } = params;

    let contextInfo = '';
    if (attendanceData) {
      contextInfo += `\nAttendance: ${attendanceData.totalHours} total hours, ${attendanceData.onTimePercentage}% on-time rate.`;
    }

    let ratingInfo = '';
    if (ratings && Object.keys(ratings).length > 0) {
      const ratingSummary = Object.entries(ratings)
        .map(([key, value]) => `- ${key}: ${value}/5`)
        .join('\n');
      ratingInfo = `\nPerformance Ratings:\n${ratingSummary}`;
    }

    const prompt = `Generate overall evaluation comments for ${studentName} from an instructor's perspective.${contextInfo}${ratingInfo}${overallRating ? `\nOverall Rating: ${overallRating}/5` : ''}

Write 3-4 paragraphs that:
- Provide a comprehensive assessment of the student's performance
- Highlight academic and professional strengths
- Discuss areas of growth and development
- Include specific observations about work quality and engagement
- Are professional and suitable for an official instructor evaluation
- Can be used for academic records or recommendation letters

Write in third person. Do not include the student's name in the comments.`;

    return this.generateText(prompt);
  }

  async generateImprovementSuggestions(params: GenerateImprovementSuggestionsParams): Promise<string> {
    const { studentName, currentPerformance, ratings, attendanceData } = params;

    let contextInfo = '';
    if (attendanceData) {
      contextInfo += `\nAttendance: ${attendanceData.totalHours} total hours, ${attendanceData.onTimePercentage}% on-time rate.`;
    }

    let ratingInfo = '';
    if (ratings && Object.keys(ratings).length > 0) {
      const lowerRatings = Object.entries(ratings)
        .filter(([_, value]) => value < 4)
        .map(([key, value]) => `- ${key}: ${value}/5`)
        .join('\n');
      if (lowerRatings) {
        ratingInfo = `\nAreas needing improvement (ratings below 4):\n${lowerRatings}`;
      }
    }

    const prompt = `Generate constructive improvement suggestions for ${studentName} based on their current performance.

Current Performance Context:
${currentPerformance || 'General performance evaluation'}${contextInfo}${ratingInfo}

Write 2-3 paragraphs that:
- Identify specific areas where the student can improve
- Provide actionable and constructive suggestions
- Maintain a supportive and encouraging tone
- Focus on professional and academic development
- Are specific and measurable where possible
- Help the student understand how to enhance their performance

Write in a professional, supportive tone. Focus on growth opportunities.`;

    return this.generateText(prompt);
  }

  async generateAnnouncementContent(params: GenerateAnnouncementContentParams): Promise<string> {
    const { title, audience, type } = params;

    const audienceDescription = audience === 'ALL' 
      ? 'all users (students, instructors, coordinators, and supervisors)'
      : audience === 'STUDENTS'
      ? 'students'
      : audience === 'INSTRUCTORS'
      ? 'instructors'
      : audience === 'COORDINATORS'
      ? 'coordinators'
      : audience === 'INDUSTRY_PARTNERS'
      ? 'industry partners/supervisors'
      : audience.toLowerCase();

    const typeContext = type ? `\nAnnouncement Type: ${type}` : '';

    const prompt = `Generate a professional announcement message for an OJT/Internship Management System.

Title: ${title}
Target Audience: ${audienceDescription}${typeContext}

Write a clear, professional announcement that:
- Is appropriate for the target audience
- Clearly communicates the message related to the title
- Uses professional but accessible language
- Is concise but comprehensive (2-3 paragraphs)
- Includes relevant details that would be expected for this type of announcement
- Maintains a professional tone suitable for an academic/industry setting

Do not include the title in the message - only generate the message content.`;

    return this.generateText(prompt);
  }
}

export const aiService = new AIService();

